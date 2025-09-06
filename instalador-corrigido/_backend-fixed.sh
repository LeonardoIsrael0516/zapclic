#!/bin/bash
#
# functions for setting up app backend - VERSÃO CORRIGIDA
# Corrige problemas de CORS, validação e conectividade

# Função para log colorido
log_info() { echo -e "\033[34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[33m[WARNING]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

# Função para validar URLs
validate_url() {
    local url=$1
    local name=$2
    
    if [[ ! $url =~ ^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$ ]]; then
        log_error "URL inválida para $name: $url"
        exit 1
    fi
    
    log_success "URL válida para $name: $url"
}

# Função para verificar se uma porta está disponível
check_port_available() {
    local port=$1
    local service=$2
    
    if netstat -tlnp | grep ":$port " > /dev/null; then
        log_error "Porta $port já está em uso (necessária para $service)"
        log_info "Processos usando a porta $port:"
        netstat -tlnp | grep ":$port "
        exit 1
    fi
    
    log_success "Porta $port disponível para $service"
}

# Função para verificar conectividade do banco
test_database_connection() {
    local db_name=$1
    local db_user=$2
    local db_pass=$3
    
    log_info "Testando conexão com o banco de dados..."
    
    # Testar se o PostgreSQL está rodando
    if ! sudo systemctl is-active postgresql > /dev/null; then
        log_error "PostgreSQL não está rodando"
        exit 1
    fi
    
    # Testar conexão
    if sudo -u postgres psql -d "$db_name" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Conexão com banco de dados OK"
    else
        log_error "Falha na conexão com o banco de dados"
        exit 1
    fi
}

#######################################
# creates REDIS db using docker - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
backend_redis_create() {
    print_banner
    printf "${WHITE} 💻 Criando Redis & Banco Postgres...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2

    # Verificar se a porta Redis está disponível
    check_port_available "$redis_port" "Redis"
    
    # Verificar se Docker está rodando
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker não está rodando ou não está instalado"
        exit 1
    fi

    log_info "Criando container Redis..."
    
    # Remover container existente se houver
    docker rm -f "redis-${instancia_add}" 2>/dev/null || true
    
    # Criar novo container Redis
    if docker run --name "redis-${instancia_add}" \
        -p "${redis_port}:6379" \
        --restart always \
        --detach redis redis-server \
        --requirepass "${mysql_root_password}"; then
        
        log_success "Container Redis criado"
        
        # Aguardar Redis inicializar
        log_info "Aguardando Redis inicializar..."
        sleep 10
        
        # Testar conectividade Redis
        local max_attempts=5
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker exec "redis-${instancia_add}" redis-cli -a "${mysql_root_password}" ping 2>/dev/null | grep -q PONG; then
                log_success "Redis está respondendo corretamente"
                break
            else
                log_warning "Tentativa $attempt/$max_attempts: Redis ainda não está pronto"
                sleep 5
                attempt=$((attempt + 1))
            fi
        done
        
        if [ $attempt -gt $max_attempts ]; then
            log_error "Redis não está respondendo após $max_attempts tentativas"
            exit 1
        fi
    else
        log_error "Falha ao criar container Redis"
        exit 1
    fi

    # Configurar banco PostgreSQL
    log_info "Configurando banco PostgreSQL..."
    
    sudo su - root <<EOF
    usermod -aG docker deploy
EOF

    # Criar banco e usuário
    sudo su - postgres <<EOF
    # Verificar se banco já existe
    if psql -lqt | cut -d \| -f 1 | grep -qw "${instancia_add}"; then
        echo "Banco ${instancia_add} já existe, removendo..."
        dropdb "${instancia_add}" 2>/dev/null || true
    fi
    
    # Verificar se usuário já existe
    if psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${instancia_add}'" | grep -q 1; then
        echo "Usuário ${instancia_add} já existe, removendo..."
        dropuser "${instancia_add}" 2>/dev/null || true
    fi
    
    # Criar banco e usuário
    createdb "${instancia_add}"
    psql -c "CREATE USER ${instancia_add} SUPERUSER INHERIT CREATEDB CREATEROLE;"
    psql -c "ALTER USER ${instancia_add} PASSWORD '${mysql_root_password}';"
EOF

    # Testar conexão com banco
    test_database_connection "${instancia_add}" "${instancia_add}" "${mysql_root_password}"
    
    log_success "Redis e PostgreSQL configurados com sucesso"
    sleep 2
}

#######################################
# sets environment variable for backend - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
backend_set_env() {
    print_banner
    printf "${WHITE} 💻 Configurando variáveis de ambiente (backend)...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2

    # Validar URLs
    validate_url "$backend_url" "Backend"
    validate_url "$frontend_url" "Frontend"
    
    # Normalizar URLs (remover trailing slash)
    backend_url=$(echo "$backend_url" | sed 's:/*$::')
    frontend_url=$(echo "$frontend_url" | sed 's:/*$::')
    
    # Verificar se a porta backend está disponível
    check_port_available "$backend_port" "Backend"
    
    # Gerar secrets seguros
    local jwt_secret=$(openssl rand -base64 32)
    local jwt_refresh_secret=$(openssl rand -base64 32)
    
    log_info "Criando arquivo .env do backend..."

    sudo su - deploy << EOF
    # Criar diretório de logs
    mkdir -p /home/deploy/${instancia_add}/logs
    
    # Criar arquivo .env
    cat <<[-]EOF > /home/deploy/${instancia_add}/backend/.env
NODE_ENV=production
BACKEND_URL=${backend_url}
FRONTEND_URL=${frontend_url}
PROXY_PORT=443
PORT=${backend_port}

DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=${instancia_add}
DB_PASS=${mysql_root_password}
DB_NAME=${instancia_add}

JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_refresh_secret}

REDIS_URI=redis://:${mysql_root_password}@127.0.0.1:${redis_port}
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000

USER_LIMIT=${max_user}
CONNECTIONS_LIMIT=${max_whats}
CLOSED_SEND_BY_ME=true

# Configurações de email (opcional)
MAIL_HOST=smtp.gmail.com
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
MAIL_PORT=465

# Configurações de campanha
CAMPAIGN_RATE_LIMIT=10000
CAMPAIGN_BATCH_SIZE=50

npm_package_version="6.0.1"

[-]EOF
EOF

    # Verificar se arquivo foi criado
    if [ -f "/home/deploy/${instancia_add}/backend/.env" ]; then
        log_success "Arquivo .env do backend criado com sucesso"
        
        # Mostrar configurações (sem senhas)
        log_info "Configurações do backend:"
        grep -E "^(BACKEND_URL|FRONTEND_URL|PORT|DB_NAME|USER_LIMIT|CONNECTIONS_LIMIT)" "/home/deploy/${instancia_add}/backend/.env"
    else
        log_error "Falha ao criar arquivo .env do backend"
        exit 1
    fi

    sleep 2
}

#######################################
# installs node.js dependencies - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
backend_node_dependencies() {
    print_banner
    printf "${WHITE} 💻 Instalando dependências do backend...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    # Verificar se Node.js está instalado
    if ! command -v node &> /dev/null; then
        log_error "Node.js não está instalado"
        exit 1
    fi
    
    # Verificar versão do Node.js
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js versão 18+ necessária. Versão atual: $(node -v)"
        exit 1
    fi
    
    log_success "Node.js $(node -v) detectado"
    
    # Verificar se o diretório existe
    if [ ! -d "/home/deploy/${instancia_add}/backend" ]; then
        log_error "Diretório do backend não encontrado"
        exit 1
    fi
    
    log_info "Instalando dependências do backend..."

    sudo su - deploy <<EOF
    cd /home/deploy/${instancia_add}/backend
    
    # Limpar cache do npm
    npm cache clean --force
    
    # Remover node_modules se existir
    rm -rf node_modules package-lock.json
    
    # Instalar dependências
    npm install --force --production=false
    
    # Verificar se a instalação foi bem-sucedida
    if [ \$? -eq 0 ] && [ -d "node_modules" ]; then
        echo "✅ Dependências instaladas com sucesso"
    else
        echo "❌ Falha na instalação das dependências"
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Dependências do backend instaladas com sucesso"
    else
        log_error "Falha na instalação das dependências do backend"
        exit 1
    fi

    sleep 2
}

#######################################
# compiles backend code - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
backend_node_build() {
    print_banner
    printf "${WHITE} 💻 Compilando o código do backend...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Compilando backend..."

    sudo su - deploy <<EOF
    cd /home/deploy/${instancia_add}/backend
    
    # Remover build anterior
    rm -rf dist
    
    # Compilar
    npm run build
    
    # Verificar se a compilação foi bem-sucedida
    if [ -d "dist" ] && [ -f "dist/server.js" ]; then
        echo "✅ Backend compilado com sucesso"
    else
        echo "❌ Falha na compilação do backend"
        ls -la dist/ 2>/dev/null || echo "Diretório dist não foi criado"
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Backend compilado com sucesso"
    else
        log_error "Falha na compilação do backend"
        exit 1
    fi

    sleep 2
}

#######################################
# runs db migrate - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
backend_db_migrate() {
    print_banner
    printf "${WHITE} 💻 Executando db:migrate...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Executando migrações do banco..."

    sudo su - deploy <<EOF
    cd /home/deploy/${instancia_add}/backend
    
    # Verificar conectividade com banco
    if ! npx sequelize db:validate; then
        echo "❌ Erro: Não foi possível conectar ao banco"
        exit 1
    fi
    
    echo "✅ Conexão com banco validada"
    
    # Executar migrações
    if npx sequelize db:migrate; then
        echo "✅ Migrações executadas com sucesso"
    else
        echo "❌ Erro nas migrações do banco"
        echo "Logs de erro:"
        npx sequelize db:migrate --debug 2>&1 | tail -20
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Migrações executadas com sucesso"
    else
        log_error "Falha nas migrações do banco"
        exit 1
    fi

    sleep 2
}

#######################################
# runs db seed - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
backend_db_seed() {
    print_banner
    printf "${WHITE} 💻 Executando db:seed...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Executando seeds do banco..."

    sudo su - deploy <<EOF
    cd /home/deploy/${instancia_add}/backend
    
    # Executar seeds
    if npx sequelize db:seed:all; then
        echo "✅ Seeds executados com sucesso"
    else
        echo "⚠️ Aviso: Falha ao executar seeds (pode ser normal se já existirem dados)"
        echo "Continuando instalação..."
    fi
EOF

    log_success "Seeds processados"
    sleep 2
}

#######################################
# starts backend using pm2 - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
backend_start_pm2() {
    print_banner
    printf "${WHITE} 💻 Iniciando pm2 (backend)...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Configurando PM2 para o backend..."
    
    # Parar processo existente se houver
    sudo -u deploy pm2 stop "${instancia_add}-backend" 2>/dev/null || true
    sudo -u deploy pm2 delete "${instancia_add}-backend" 2>/dev/null || true

    sudo su - deploy <<EOF
    cd /home/deploy/${instancia_add}/backend
    
    # Verificar se o arquivo compilado existe
    if [ ! -f "dist/server.js" ]; then
        echo "❌ Arquivo dist/server.js não encontrado"
        exit 1
    fi
    
    # Iniciar com PM2
    pm2 start dist/server.js \
        --name "${instancia_add}-backend" \
        --log "/home/deploy/${instancia_add}/logs/backend.log" \
        --error "/home/deploy/${instancia_add}/logs/backend-error.log" \
        --out "/home/deploy/${instancia_add}/logs/backend-out.log" \
        --time
    
    # Aguardar inicialização
    sleep 5
    
    # Verificar se está rodando
    if pm2 show "${instancia_add}-backend" | grep -q "online"; then
        echo "✅ Backend iniciado com sucesso"
    else
        echo "❌ Falha ao iniciar backend"
        pm2 logs "${instancia_add}-backend" --lines 10
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Backend iniciado com PM2"
        
        # Testar se a porta está respondendo
        sleep 5
        if netstat -tlnp | grep ":${backend_port} " > /dev/null; then
            log_success "Backend está respondendo na porta ${backend_port}"
        else
            log_warning "Backend pode não estar respondendo na porta ${backend_port}"
        fi
    else
        log_error "Falha ao iniciar backend com PM2"
        exit 1
    fi

    sleep 2
}

#######################################
# sets up nginx for backend - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
backend_nginx_setup() {
    print_banner
    printf "${WHITE} 💻 Configurando nginx (backend)...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Configurando Nginx para o backend..."
    
    # Extrair hostname da URL
    backend_hostname=$(echo "${backend_url}" | sed 's|https\?://||' | sed 's|/.*||')
    
    log_info "Hostname do backend: $backend_hostname"

    sudo su - root << EOF
    # Remover configuração existente
    rm -f /etc/nginx/sites-enabled/${instancia_add}-backend
    rm -f /etc/nginx/sites-available/${instancia_add}-backend
    
    # Criar nova configuração
    cat > /etc/nginx/sites-available/${instancia_add}-backend << 'END'
server {
    server_name $backend_hostname;
    
    # Configurações de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Logs específicos
    access_log /var/log/nginx/${instancia_add}-backend-access.log;
    error_log /var/log/nginx/${instancia_add}-backend-error.log;
    
    location / {
        # Verificar se backend está rodando
        proxy_pass http://127.0.0.1:${backend_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts para WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "${frontend_url}";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
        add_header Access-Control-Allow-Credentials true;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "${frontend_url}";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
}
END
    
    # Habilitar site
    ln -sf /etc/nginx/sites-available/${instancia_add}-backend /etc/nginx/sites-enabled/
    
    # Testar configuração
    if nginx -t; then
        echo "✅ Configuração do Nginx válida"
    else
        echo "❌ Erro na configuração do Nginx"
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Nginx configurado para o backend"
    else
        log_error "Falha na configuração do Nginx"
        exit 1
    fi

    sleep 2
}