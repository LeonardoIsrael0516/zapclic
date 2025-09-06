#!/bin/bash

# Script de Diagnóstico para Produção ZapClic
# Execute este script no servidor VPS para identificar problemas

echo "=== DIAGNÓSTICO DE PRODUÇÃO ZAPCLIC ==="
echo "Data: $(date)"
echo "Servidor: $(hostname)"
echo ""

# Função para log colorido
log_info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[OK]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERRO]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[AVISO]\033[0m $1"
}

# 1. Verificar serviços essenciais
log_info "Verificando serviços essenciais..."

echo "--- Redis ---"
if systemctl is-active --quiet redis; then
    log_success "Redis está rodando"
    redis-cli ping 2>/dev/null && log_success "Redis responde ao ping" || log_error "Redis não responde ao ping"
else
    log_error "Redis não está rodando"
    systemctl status redis --no-pager -l
fi

echo ""
echo "--- PostgreSQL ---"
if systemctl is-active --quiet postgresql; then
    log_success "PostgreSQL está rodando"
else
    log_error "PostgreSQL não está rodando"
    systemctl status postgresql --no-pager -l
fi

echo ""
echo "--- Nginx ---"
if systemctl is-active --quiet nginx; then
    log_success "Nginx está rodando"
    nginx -t && log_success "Configuração do Nginx válida" || log_error "Configuração do Nginx inválida"
else
    log_error "Nginx não está rodando"
fi

echo ""
echo "--- PM2 ---"
if command -v pm2 >/dev/null 2>&1; then
    log_success "PM2 está instalado"
    pm2 status
else
    log_error "PM2 não está instalado"
fi

# 2. Verificar portas
log_info "Verificando portas..."
echo "--- Portas em uso ---"
netstat -tlnp | grep -E ':(3000|4000|5432|6379|80|443)'

# 3. Verificar arquivos de configuração
log_info "Verificando configurações..."

echo "--- Backend .env ---"
if [ -f "/var/www/zapclic/backend/.env" ]; then
    log_success "Arquivo .env do backend existe"
    echo "Variáveis principais:"
    grep -E '^(NODE_ENV|BACKEND_URL|FRONTEND_URL|DB_|REDIS_)' /var/www/zapclic/backend/.env | head -10
else
    log_error "Arquivo .env do backend não encontrado"
fi

echo ""
echo "--- Frontend .env ---"
if [ -f "/var/www/zapclic/frontend/.env" ]; then
    log_success "Arquivo .env do frontend existe"
    echo "Variáveis principais:"
    grep -E '^(REACT_APP_|NODE_ENV)' /var/www/zapclic/frontend/.env | head -5
else
    log_error "Arquivo .env do frontend não encontrado"
fi

# 4. Verificar logs recentes
log_info "Verificando logs recentes..."

echo "--- Logs do PM2 (Backend) ---"
if pm2 list | grep -q "backend"; then
    pm2 logs backend --lines 20 --nostream
else
    log_warning "Processo backend não encontrado no PM2"
fi

echo ""
echo "--- Logs do PM2 (Frontend) ---"
if pm2 list | grep -q "frontend"; then
    pm2 logs frontend --lines 20 --nostream
else
    log_warning "Processo frontend não encontrado no PM2"
fi

echo ""
echo "--- Logs do Nginx ---"
if [ -f "/var/log/nginx/error.log" ]; then
    echo "Últimos erros do Nginx:"
    tail -20 /var/log/nginx/error.log
fi

# 5. Testar conectividade
log_info "Testando conectividade..."

echo "--- Teste Redis ---"
redis-cli ping 2>/dev/null && log_success "Redis OK" || log_error "Redis falhou"

echo "--- Teste PostgreSQL ---"
if command -v psql >/dev/null 2>&1; then
    # Tentar conectar usando as credenciais do .env
    if [ -f "/var/www/zapclic/backend/.env" ]; then
        DB_HOST=$(grep '^DB_HOST=' /var/www/zapclic/backend/.env | cut -d'=' -f2)
        DB_NAME=$(grep '^DB_NAME=' /var/www/zapclic/backend/.env | cut -d'=' -f2)
        DB_USER=$(grep '^DB_USER=' /var/www/zapclic/backend/.env | cut -d'=' -f2)
        
        if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
            PGPASSWORD=$(grep '^DB_PASS=' /var/www/zapclic/backend/.env | cut -d'=' -f2) psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1 && log_success "PostgreSQL OK" || log_error "PostgreSQL falhou"
        else
            log_warning "Credenciais do banco não encontradas no .env"
        fi
    fi
else
    log_warning "psql não está instalado"
fi

# 6. Verificar URLs e CORS
log_info "Testando URLs..."

echo "--- Teste Backend ---"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health 2>/dev/null | grep -q "200"; then
    log_success "Backend responde localmente"
else
    log_error "Backend não responde localmente"
fi

echo "--- Teste Frontend ---"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
    log_success "Frontend responde localmente"
else
    log_error "Frontend não responde localmente"
fi

# 7. Verificar espaço em disco e recursos
log_info "Verificando recursos do sistema..."

echo "--- Espaço em disco ---"
df -h | grep -E '(Filesystem|/dev/)'

echo ""
echo "--- Memória ---"
free -h

echo ""
echo "--- CPU ---"
uptime

# 8. Verificar configuração do Nginx
log_info "Verificando configuração do Nginx..."

if [ -f "/etc/nginx/sites-available/zapclic" ]; then
    log_success "Configuração do ZapClic encontrada"
    echo "Configuração:"
    grep -E '(server_name|proxy_pass|listen)' /etc/nginx/sites-available/zapclic
else
    log_error "Configuração do ZapClic não encontrada"
fi

echo ""
echo "=== RESUMO DO DIAGNÓSTICO ==="
echo "Execute este relatório e envie os resultados para análise."
echo "Data: $(date)"
echo "Diagnóstico concluído."