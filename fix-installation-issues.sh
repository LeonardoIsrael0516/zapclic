#!/bin/bash

# Script para Corrigir Problemas Comuns na Instalação ZapClic
# Resolve problemas de conexão frontend-backend

echo "=== CORREÇÃO DE PROBLEMAS DA INSTALAÇÃO ZAPCLIC ==="
echo "Data: $(date)"
echo ""

# Função para log colorido
log_info() { echo -e "\033[34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[33m[WARNING]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script deve ser executado como root (sudo)"
    exit 1
fi

# Função para corrigir permissões
fix_permissions() {
    log_info "Corrigindo permissões..."
    chown -R deploy:deploy /home/deploy/
    chmod -R 755 /home/deploy/
    log_success "Permissões corrigidas"
}

# Função para corrigir configurações do Nginx
fix_nginx_config() {
    log_info "Verificando e corrigindo configurações do Nginx..."
    
    # Testar configuração
    if ! nginx -t; then
        log_error "Configuração do Nginx inválida"
        return 1
    fi
    
    # Reiniciar Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    if systemctl is-active nginx > /dev/null; then
        log_success "Nginx reiniciado com sucesso"
    else
        log_error "Falha ao reiniciar Nginx"
        return 1
    fi
}

# Função para corrigir PM2
fix_pm2() {
    log_info "Corrigindo configurações do PM2..."
    
    # Parar todos os processos
    sudo -u deploy pm2 stop all
    sudo -u deploy pm2 delete all
    
    # Reconfigurar startup
    sudo -u deploy pm2 startup
    env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
    
    log_success "PM2 reconfigurado"
}

# Função para corrigir variáveis de ambiente
fix_env_variables() {
    local instance_path=$1
    local instance_name=$(basename "$instance_path")
    
    log_info "Corrigindo variáveis de ambiente para $instance_name..."
    
    # Verificar se os arquivos .env existem
    if [ ! -f "$instance_path/backend/.env" ]; then
        log_warning "Arquivo .env do backend não encontrado, criando..."
        
        # Solicitar informações básicas
        read -p "Digite a URL do backend (ex: https://api.exemplo.com): " backend_url
        read -p "Digite a URL do frontend (ex: https://app.exemplo.com): " frontend_url
        read -p "Digite a porta do backend (ex: 4000): " backend_port
        read -s -p "Digite a senha do banco de dados: " db_password
        echo
        
        # Criar .env do backend
        cat > "$instance_path/backend/.env" << EOF
NODE_ENV=production
BACKEND_URL=$backend_url
FRONTEND_URL=$frontend_url
PROXY_PORT=443
PORT=$backend_port

DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=$instance_name
DB_PASS=$db_password
DB_NAME=$instance_name

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

REDIS_URI=redis://:$db_password@127.0.0.1:$(($backend_port + 1000))
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000

USER_LIMIT=10000
CONNECTIONS_LIMIT=100000
CLOSED_SEND_BY_ME=true

npm_package_version="6.0.1"
EOF
        
        chown deploy:deploy "$instance_path/backend/.env"
        log_success "Arquivo .env do backend criado"
    fi
    
    if [ ! -f "$instance_path/frontend/.env" ]; then
        log_warning "Arquivo .env do frontend não encontrado, criando..."
        
        # Obter URL do backend do arquivo do backend
        backend_url=$(grep "^BACKEND_URL=" "$instance_path/backend/.env" | cut -d'=' -f2)
        
        cat > "$instance_path/frontend/.env" << EOF
REACT_APP_BACKEND_URL=$backend_url
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
EOF
        
        chown deploy:deploy "$instance_path/frontend/.env"
        log_success "Arquivo .env do frontend criado"
    fi
}

# Função para recompilar aplicação
recompile_application() {
    local instance_path=$1
    local instance_name=$(basename "$instance_path")
    
    log_info "Recompilando aplicação $instance_name..."
    
    # Backend
    if [ -d "$instance_path/backend" ]; then
        log_info "Recompilando backend..."
        sudo -u deploy bash -c "cd $instance_path/backend && npm install --force && npm run build"
        
        if [ -d "$instance_path/backend/dist" ]; then
            log_success "Backend compilado com sucesso"
        else
            log_error "Falha na compilação do backend"
            return 1
        fi
    fi
    
    # Frontend
    if [ -d "$instance_path/frontend" ]; then
        log_info "Recompilando frontend..."
        sudo -u deploy bash -c "cd $instance_path/frontend && npm install --force && npm run build"
        
        if [ -d "$instance_path/frontend/build" ]; then
            log_success "Frontend compilado com sucesso"
        else
            log_error "Falha na compilação do frontend"
            return 1
        fi
    fi
}

# Função para executar migrações
run_migrations() {
    local instance_path=$1
    local instance_name=$(basename "$instance_path")
    
    log_info "Executando migrações para $instance_name..."
    
    if [ -d "$instance_path/backend" ]; then
        sudo -u deploy bash -c "cd $instance_path/backend && npx sequelize db:migrate"
        sudo -u deploy bash -c "cd $instance_path/backend && npx sequelize db:seed:all"
        log_success "Migrações executadas"
    fi
}

# Função para reiniciar serviços
restart_services() {
    local instance_name=$1
    
    log_info "Reiniciando serviços para $instance_name..."
    
    # Parar serviços
    sudo -u deploy pm2 stop "$instance_name-backend" "$instance_name-frontend" 2>/dev/null || true
    sudo -u deploy pm2 delete "$instance_name-backend" "$instance_name-frontend" 2>/dev/null || true
    
    # Iniciar backend
    if [ -f "/home/deploy/$instance_name/backend/dist/server.js" ]; then
        sudo -u deploy bash -c "cd /home/deploy/$instance_name/backend && pm2 start dist/server.js --name $instance_name-backend"
        log_success "Backend iniciado"
    fi
    
    # Iniciar frontend
    if [ -f "/home/deploy/$instance_name/frontend/server.js" ]; then
        sudo -u deploy bash -c "cd /home/deploy/$instance_name/frontend && pm2 start server.js --name $instance_name-frontend"
        log_success "Frontend iniciado"
    fi
    
    # Salvar configuração PM2
    sudo -u deploy pm2 save
}

# Função principal
main() {
    echo "Escolha uma opção:"
    echo "1) Diagnóstico completo e correção automática"
    echo "2) Corrigir permissões apenas"
    echo "3) Corrigir Nginx apenas"
    echo "4) Corrigir PM2 apenas"
    echo "5) Recompilar aplicação específica"
    echo "6) Reiniciar serviços específicos"
    echo "7) Correção completa de instância específica"
    read -p "Digite sua escolha (1-7): " choice
    
    case $choice in
        1)
            log_info "Iniciando correção automática completa..."
            fix_permissions
            fix_nginx_config
            fix_pm2
            
            # Corrigir todas as instâncias
            for instance in /home/deploy/*/; do
                if [ -d "$instance" ] && [ "$(basename "$instance")" != "*" ]; then
                    instance_name=$(basename "$instance")
                    log_info "Processando instância: $instance_name"
                    fix_env_variables "$instance"
                    recompile_application "$instance"
                    run_migrations "$instance"
                    restart_services "$instance_name"
                fi
            done
            ;;
        2)
            fix_permissions
            ;;
        3)
            fix_nginx_config
            ;;
        4)
            fix_pm2
            ;;
        5)
            read -p "Digite o nome da instância: " instance_name
            if [ -d "/home/deploy/$instance_name" ]; then
                recompile_application "/home/deploy/$instance_name"
            else
                log_error "Instância não encontrada"
            fi
            ;;
        6)
            read -p "Digite o nome da instância: " instance_name
            restart_services "$instance_name"
            ;;
        7)
            read -p "Digite o nome da instância: " instance_name
            if [ -d "/home/deploy/$instance_name" ]; then
                fix_env_variables "/home/deploy/$instance_name"
                recompile_application "/home/deploy/$instance_name"
                run_migrations "/home/deploy/$instance_name"
                restart_services "$instance_name"
            else
                log_error "Instância não encontrada"
            fi
            ;;
        *)
            log_error "Opção inválida"
            exit 1
            ;;
    esac
    
    log_success "Correção concluída!"
    log_info "Execute o diagnóstico novamente para verificar se os problemas foram resolvidos"
}

# Executar função principal
main