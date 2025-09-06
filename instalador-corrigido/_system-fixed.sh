#!/bin/bash
# 
# functions for setting up system - VERSÃO CORRIGIDA
# Corrige problemas de configuração e dependências

# Função para log colorido
log_info() { echo -e "\033[34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[33m[WARNING]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar se um serviço está rodando
service_is_running() {
    systemctl is-active --quiet "$1"
}

# Função para aguardar um serviço ficar disponível
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Aguardando $service ficar disponível na porta $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if netstat -tlnp | grep ":$port " > /dev/null; then
            log_success "$service está disponível na porta $port"
            return 0
        fi
        
        log_info "Tentativa $attempt/$max_attempts - aguardando $service..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$service não ficou disponível na porta $port após $max_attempts tentativas"
    return 1
}

#######################################
# creates deploy user - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
system_create_user() {
    print_banner
    printf "${WHITE} 💻 Criando usuário de deploy...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Verificando usuário deploy..."
    
    # Verificar se usuário já existe
    if id "deploy" &>/dev/null; then
        log_warning "Usuário deploy já existe"
        
        # Verificar se tem as permissões corretas
        if groups deploy | grep -q sudo; then
            log_success "Usuário deploy já tem permissões sudo"
        else
            log_info "Adicionando usuário deploy ao grupo sudo..."
            usermod -aG sudo deploy
            log_success "Usuário deploy adicionado ao grupo sudo"
        fi
    else
        log_info "Criando usuário deploy..."
        
        # Criar usuário
        useradd -m -s /bin/bash deploy
        
        # Adicionar ao grupo sudo
        usermod -aG sudo deploy
        
        # Configurar senha (opcional - pode ser removido em produção)
        echo "deploy:$(openssl rand -base64 32)" | chpasswd
        
        log_success "Usuário deploy criado com sucesso"
    fi
    
    # Criar diretórios necessários
    log_info "Criando estrutura de diretórios..."
    
    sudo -u deploy mkdir -p /home/deploy/.ssh
    sudo -u deploy mkdir -p /home/deploy/logs
    
    # Configurar permissões SSH
    chmod 700 /home/deploy/.ssh
    chown deploy:deploy /home/deploy/.ssh
    
    # Configurar sudoers para deploy (sem senha para comandos específicos)
    if [ ! -f "/etc/sudoers.d/deploy" ]; then
        cat > /etc/sudoers.d/deploy << EOF
# Permitir ao usuário deploy executar comandos específicos sem senha
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
deploy ALL=(ALL) NOPASSWD: /bin/systemctl status nginx
deploy ALL=(ALL) NOPASSWD: /usr/bin/certbot
EOF
        log_success "Configuração sudoers criada para deploy"
    fi
    
    log_success "Usuário deploy configurado com sucesso"
    sleep 2
}

#######################################
# clones git repository - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
system_git_clone() {
    print_banner
    printf "${WHITE} 💻 Clonando repositório...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    # Verificar se git está instalado
    if ! command_exists git; then
        log_error "Git não está instalado"
        exit 1
    fi
    
    log_info "Clonando repositório para /home/deploy/${instancia_add}..."
    
    # Verificar se diretório já existe
    if [ -d "/home/deploy/${instancia_add}" ]; then
        log_warning "Diretório /home/deploy/${instancia_add} já existe"
        
        # Perguntar se deve remover ou atualizar
        read -p "Deseja remover e clonar novamente? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Removendo diretório existente..."
            rm -rf "/home/deploy/${instancia_add}"
        else
            log_info "Atualizando repositório existente..."
            sudo -u deploy git -C "/home/deploy/${instancia_add}" pull
            return 0
        fi
    fi

    sudo -u deploy git clone "$link_git" "/home/deploy/${instancia_add}"
    
    if [ $? -eq 0 ]; then
        log_success "Repositório clonado com sucesso"
        
        # Verificar se os diretórios essenciais existem
        if [ -d "/home/deploy/${instancia_add}/backend" ] && [ -d "/home/deploy/${instancia_add}/frontend" ]; then
            log_success "Estrutura do projeto verificada"
        else
            log_error "Estrutura do projeto inválida - faltam diretórios backend/frontend"
            exit 1
        fi
    else
        log_error "Falha ao clonar repositório"
        exit 1
    fi

    # Configurar permissões
    chown -R deploy:deploy "/home/deploy/${instancia_add}"
    
    sleep 2
}

#######################################
# updates system packages - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
system_update() {
    print_banner
    printf "${WHITE} 💻 Atualizando sistema...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Atualizando lista de pacotes..."
    
    # Atualizar lista de pacotes
    apt update
    
    if [ $? -eq 0 ]; then
        log_success "Lista de pacotes atualizada"
    else
        log_error "Falha ao atualizar lista de pacotes"
        exit 1
    fi
    
    log_info "Atualizando pacotes do sistema..."
    
    # Atualizar pacotes (sem interação)
    DEBIAN_FRONTEND=noninteractive apt upgrade -y
    
    if [ $? -eq 0 ]; then
        log_success "Pacotes do sistema atualizados"
    else
        log_warning "Alguns pacotes podem não ter sido atualizados"
    fi
    
    # Instalar pacotes essenciais
    log_info "Instalando pacotes essenciais..."
    
    DEBIAN_FRONTEND=noninteractive apt install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        build-essential \
        python3 \
        python3-pip \
        htop \
        nano \
        vim \
        net-tools \
        ufw
    
    if [ $? -eq 0 ]; then
        log_success "Pacotes essenciais instalados"
    else
        log_error "Falha ao instalar pacotes essenciais"
        exit 1
    fi
    
    # Configurar timezone
    log_info "Configurando timezone..."
    timedatectl set-timezone America/Sao_Paulo
    
    # Configurar locale
    log_info "Configurando locale..."
    locale-gen pt_BR.UTF-8
    update-locale LANG=pt_BR.UTF-8
    
    log_success "Sistema atualizado com sucesso"
    sleep 2
}

#######################################
# deletes system - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
system_delete() {
    print_banner
    printf "${WHITE} 💻 Removendo sistema...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_warning "ATENÇÃO: Esta operação irá remover completamente a instância ${empresa_delete}"
    read -p "Tem certeza que deseja continuar? Digite 'CONFIRMAR' para prosseguir: " confirmacao
    
    if [ "$confirmacao" != "CONFIRMAR" ]; then
        log_info "Operação cancelada pelo usuário"
        return 0
    fi
    
    log_info "Iniciando remoção da instância ${empresa_delete}..."
    
    # Parar serviços PM2
    log_info "Parando serviços PM2..."
    sudo -u deploy pm2 stop "${empresa_delete}-backend" 2>/dev/null || true
    sudo -u deploy pm2 stop "${empresa_delete}-frontend" 2>/dev/null || true
    sudo -u deploy pm2 delete "${empresa_delete}-backend" 2>/dev/null || true
    sudo -u deploy pm2 delete "${empresa_delete}-frontend" 2>/dev/null || true
    sudo -u deploy pm2 save
    
    # Remover containers Docker
    log_info "Removendo containers Docker..."
    docker stop "${empresa_delete}_redis" 2>/dev/null || true
    docker rm "${empresa_delete}_redis" 2>/dev/null || true
    
    # Remover configurações do Nginx
    log_info "Removendo configurações do Nginx..."
    rm -f "/etc/nginx/sites-enabled/${empresa_delete}-backend"
    rm -f "/etc/nginx/sites-enabled/${empresa_delete}-frontend"
    rm -f "/etc/nginx/sites-available/${empresa_delete}-backend"
    rm -f "/etc/nginx/sites-available/${empresa_delete}-frontend"
    
    # Recarregar Nginx
    systemctl reload nginx
    
    # Remover certificados SSL
    log_info "Removendo certificados SSL..."
    certbot delete --cert-name "${empresa_delete}" 2>/dev/null || true
    
    # Remover banco de dados
    log_info "Removendo banco de dados..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${empresa_delete};" 2>/dev/null || true
    sudo -u postgres psql -c "DROP USER IF EXISTS ${empresa_delete};" 2>/dev/null || true
    
    # Remover arquivos do sistema
    log_info "Removendo arquivos do sistema..."
    rm -rf "/home/deploy/${empresa_delete}"
    
    # Remover logs
    rm -f "/var/log/nginx/${empresa_delete}-*"
    
    log_success "Instância ${empresa_delete} removida com sucesso"
    
    sleep 2
}

#######################################
# configures firewall - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
system_configure_firewall() {
    print_banner
    printf "${WHITE} 💻 Configurando firewall...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Configurando UFW (Uncomplicated Firewall)..."
    
    # Resetar regras
    ufw --force reset
    
    # Configurar políticas padrão
    ufw default deny incoming
    ufw default allow outgoing
    
    # Permitir SSH
    ufw allow ssh
    ufw allow 22/tcp
    
    # Permitir HTTP e HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Permitir portas específicas se definidas
    if [ -n "$backend_port" ]; then
        ufw allow "$backend_port"/tcp comment "Backend ${instancia_add}"
    fi
    
    if [ -n "$frontend_port" ]; then
        ufw allow "$frontend_port"/tcp comment "Frontend ${instancia_add}"
    fi
    
    # Habilitar firewall
    ufw --force enable
    
    # Mostrar status
    ufw status verbose
    
    log_success "Firewall configurado com sucesso"
    sleep 2
}

#######################################
# checks system health - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
system_health_check() {
    print_banner
    printf "${WHITE} 💻 Verificando saúde do sistema...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Executando verificação de saúde do sistema..."
    
    # Verificar espaço em disco
    log_info "Verificando espaço em disco..."
    df -h | grep -E '^/dev/'
    
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        log_warning "Espaço em disco baixo: ${disk_usage}% usado"
    else
        log_success "Espaço em disco OK: ${disk_usage}% usado"
    fi
    
    # Verificar memória
    log_info "Verificando memória..."
    free -h
    
    # Verificar serviços essenciais
    log_info "Verificando serviços essenciais..."
    
    local services=("nginx" "postgresql" "docker")
    for service in "${services[@]}"; do
        if service_is_running "$service"; then
            log_success "Serviço $service está rodando"
        else
            log_warning "Serviço $service não está rodando"
        fi
    done
    
    # Verificar PM2
    log_info "Verificando processos PM2..."
    sudo -u deploy pm2 list
    
    # Verificar conectividade de rede
    log_info "Verificando conectividade de rede..."
    if ping -c 1 google.com > /dev/null 2>&1; then
        log_success "Conectividade de rede OK"
    else
        log_warning "Problemas de conectividade de rede"
    fi
    
    # Verificar portas em uso
    log_info "Verificando portas em uso..."
    netstat -tlnp | grep LISTEN
    
    log_success "Verificação de saúde concluída"
    sleep 2
}

#######################################
# optimizes system performance - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
system_optimize() {
    print_banner
    printf "${WHITE} 💻 Otimizando sistema...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Aplicando otimizações do sistema..."
    
    # Otimizações de kernel
    log_info "Configurando parâmetros do kernel..."
    
    cat > /etc/sysctl.d/99-performance.conf << EOF
# Otimizações de rede
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# Otimizações de memória
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# Otimizações de arquivo
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
EOF
    
    # Aplicar configurações
    sysctl -p /etc/sysctl.d/99-performance.conf
    
    # Configurar limites de arquivo
    log_info "Configurando limites de arquivo..."
    
    cat > /etc/security/limits.d/99-performance.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
deploy soft nofile 65536
deploy hard nofile 65536
EOF
    
    # Otimizar Nginx
    log_info "Otimizando configuração do Nginx..."
    
    # Backup da configuração original
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Aplicar configurações otimizadas
    cat > /etc/nginx/conf.d/performance.conf << EOF
# Otimizações de performance
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache de arquivos
    open_file_cache max=200000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;
    
    # Buffers
    client_body_buffer_size 16K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;
}
EOF
    
    # Testar configuração do Nginx
    if nginx -t; then
        log_success "Configuração do Nginx otimizada"
        systemctl reload nginx
    else
        log_error "Erro na configuração do Nginx, restaurando backup"
        mv /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
    fi
    
    log_success "Otimizações aplicadas com sucesso"
    sleep 2
}