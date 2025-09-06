#!/bin/bash

# Script de Correção Rápida para Erro 500 em Produção
# Execute este script no servidor VPS para corrigir problemas comuns

echo "=== CORREÇÃO RÁPIDA ERRO 500 - ZAPCLIC ==="
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

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script deve ser executado como root (sudo)"
    exit 1
fi

# Definir caminhos (ajustar conforme necessário)
BACKEND_PATH="/var/www/zapclic/backend"
FRONTEND_PATH="/var/www/zapclic/frontend"

# Verificar se os diretórios existem
if [ ! -d "$BACKEND_PATH" ]; then
    log_error "Diretório do backend não encontrado: $BACKEND_PATH"
    log_info "Tentando outros caminhos comuns..."
    
    for path in "/opt/zapclic/backend" "/home/zapclic/backend" "/root/zapclic/backend"; do
        if [ -d "$path" ]; then
            BACKEND_PATH="$path"
            log_success "Backend encontrado em: $BACKEND_PATH"
            break
        fi
    done
    
    if [ ! -d "$BACKEND_PATH" ]; then
        log_error "Não foi possível encontrar o diretório do backend"
        exit 1
    fi
fi

log_info "Usando caminhos:"
echo "Backend: $BACKEND_PATH"
echo "Frontend: $FRONTEND_PATH"
echo ""

# 1. Verificar e corrigir Redis
log_info "1. Verificando e corrigindo Redis..."

if ! systemctl is-active --quiet redis; then
    log_warning "Redis não está rodando. Tentando iniciar..."
    systemctl start redis
    systemctl enable redis
    sleep 2
    
    if systemctl is-active --quiet redis; then
        log_success "Redis iniciado com sucesso"
    else
        log_error "Falha ao iniciar Redis"
        systemctl status redis --no-pager -l
    fi
else
    log_success "Redis já está rodando"
fi

# Testar conexão Redis
if redis-cli ping >/dev/null 2>&1; then
    log_success "Redis responde ao ping"
else
    log_error "Redis não responde ao ping"
    log_info "Tentando reiniciar Redis..."
    systemctl restart redis
    sleep 3
    
    if redis-cli ping >/dev/null 2>&1; then
        log_success "Redis funcionando após reinicialização"
    else
        log_error "Redis ainda não funciona. Verificar configuração manual."
    fi
fi

# 2. Verificar e corrigir PostgreSQL
log_info "2. Verificando PostgreSQL..."

if ! systemctl is-active --quiet postgresql; then
    log_warning "PostgreSQL não está rodando. Tentando iniciar..."
    systemctl start postgresql
    systemctl enable postgresql
    sleep 3
    
    if systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL iniciado com sucesso"
    else
        log_error "Falha ao iniciar PostgreSQL"
    fi
else
    log_success "PostgreSQL está rodando"
fi

# 3. Verificar e criar arquivo .env do backend
log_info "3. Verificando arquivo .env do backend..."

if [ ! -f "$BACKEND_PATH/.env" ]; then
    log_warning "Arquivo .env não encontrado. Criando baseado no .env.example..."
    
    if [ -f "$BACKEND_PATH/.env.example" ]; then
        cp "$BACKEND_PATH/.env.example" "$BACKEND_PATH/.env"
        log_success "Arquivo .env criado baseado no .env.example"
        log_warning "IMPORTANTE: Edite o arquivo .env com as configurações corretas!"
        echo "Arquivo localizado em: $BACKEND_PATH/.env"
    else
        log_error "Arquivo .env.example não encontrado"
        log_info "Criando .env básico..."
        
        cat > "$BACKEND_PATH/.env" << EOF
NODE_ENV=production
BACKEND_URL=https://apizap.meulink.lat
FRONTEND_URL=https://zapclic.meulink.lat
PROXY_PORT=443
PORT=4000

# Database
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zapclic
DB_USER=zapclic
DB_PASS=sua_senha_aqui

# Redis
REDIS_URI=redis://:123456@127.0.0.1:6379
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000

# JWT
JWT_SECRET=sua_chave_jwt_aqui
JWT_REFRESH_SECRET=sua_chave_refresh_aqui

# Outros
USER_LIMIT=10000
CONNECTIONS_LIMIT=100000
EOF
        
        log_success "Arquivo .env básico criado"
        log_error "CRÍTICO: Configure as senhas e chaves no arquivo .env!"
    fi
else
    log_success "Arquivo .env já existe"
fi

# 4. Verificar configurações críticas no .env
log_info "4. Verificando configurações críticas..."

if grep -q "sua_senha_aqui\|sua_chave_jwt_aqui" "$BACKEND_PATH/.env" 2>/dev/null; then
    log_error "CRÍTICO: Arquivo .env contém valores padrão. Configure as senhas!"
    echo "Edite o arquivo: $BACKEND_PATH/.env"
else
    log_success "Configurações básicas parecem estar definidas"
fi

# 5. Instalar/atualizar dependências do backend
log_info "5. Verificando dependências do backend..."

cd "$BACKEND_PATH" || exit 1

if [ ! -d "node_modules" ]; then
    log_warning "Dependências não instaladas. Instalando..."
    npm install --production
    
    if [ $? -eq 0 ]; then
        log_success "Dependências instaladas com sucesso"
    else
        log_error "Falha ao instalar dependências"
    fi
else
    log_success "Dependências já estão instaladas"
fi

# 6. Executar migrações do banco
log_info "6. Executando migrações do banco..."

if command -v npx >/dev/null 2>&1; then
    npx sequelize db:migrate 2>/dev/null
    if [ $? -eq 0 ]; then
        log_success "Migrações executadas com sucesso"
    else
        log_warning "Algumas migrações podem ter falhado (normal se já executadas)"
    fi
else
    log_warning "npx não encontrado. Pule as migrações por enquanto."
fi

# 7. Reiniciar aplicações PM2
log_info "7. Reiniciando aplicações..."

if command -v pm2 >/dev/null 2>&1; then
    log_info "Parando aplicações..."
    pm2 stop all 2>/dev/null
    
    log_info "Iniciando backend..."
    cd "$BACKEND_PATH"
    pm2 start dist/server.js --name "backend" --env production 2>/dev/null || \
    pm2 start src/server.ts --name "backend" --env production 2>/dev/null || \
    pm2 start npm --name "backend" -- run start:prod 2>/dev/null
    
    if [ -d "$FRONTEND_PATH" ]; then
        log_info "Iniciando frontend..."
        cd "$FRONTEND_PATH"
        pm2 start server.js --name "frontend" --env production 2>/dev/null || \
        pm2 start npm --name "frontend" -- start 2>/dev/null
    fi
    
    sleep 5
    pm2 status
    
    log_success "Aplicações reiniciadas"
else
    log_error "PM2 não encontrado. Instale PM2 primeiro."
fi

# 8. Verificar e corrigir Nginx
log_info "8. Verificando Nginx..."

if ! systemctl is-active --quiet nginx; then
    log_warning "Nginx não está rodando. Tentando iniciar..."
    systemctl start nginx
    systemctl enable nginx
fi

# Testar configuração do Nginx
nginx -t 2>/dev/null
if [ $? -eq 0 ]; then
    log_success "Configuração do Nginx válida"
    systemctl reload nginx
else
    log_error "Configuração do Nginx inválida"
    nginx -t
fi

# 9. Testes finais
log_info "9. Executando testes finais..."

echo "--- Testando Redis ---"
redis-cli ping && log_success "Redis OK" || log_error "Redis falhou"

echo "--- Testando Backend ---"
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health 2>/dev/null | grep -q "200"; then
    log_success "Backend responde localmente"
else
    log_error "Backend não responde localmente"
    log_info "Verificando logs do PM2..."
    pm2 logs backend --lines 10 --nostream
fi

echo "--- Testando URL externa ---"
if curl -s -o /dev/null -w "%{http_code}" https://apizap.meulink.lat/health 2>/dev/null | grep -q "200"; then
    log_success "Backend responde externamente"
else
    log_warning "Backend pode não estar respondendo externamente (verificar DNS/Firewall)"
fi

# 10. Resumo final
echo ""
log_info "=== RESUMO DA CORREÇÃO ==="
echo "1. Redis: $(systemctl is-active redis)"
echo "2. PostgreSQL: $(systemctl is-active postgresql)"
echo "3. Nginx: $(systemctl is-active nginx)"
echo "4. Arquivo .env: $([ -f "$BACKEND_PATH/.env" ] && echo "Existe" || echo "Não existe")"
echo "5. PM2 Status:"
pm2 status 2>/dev/null || echo "PM2 não disponível"

echo ""
log_info "Próximos passos:"
echo "1. Verifique se as configurações no .env estão corretas"
echo "2. Teste o acesso: https://apizap.meulink.lat/auth/login"
echo "3. Monitore os logs: pm2 logs backend"
echo "4. Se ainda houver erro, execute o diagnóstico completo"

echo ""
log_success "Correção concluída em $(date)"