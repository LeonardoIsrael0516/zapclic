#!/bin/bash
# 
# functions for setting up app frontend - VERSÃO CORRIGIDA
# Corrige problemas de configuração e conectividade

# Função para log colorido
log_info() { echo -e "\033[34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_warning() { echo -e "\033[33m[WARNING]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

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

#######################################
# installed node packages - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
frontend_node_dependencies() {
    print_banner
    printf "${WHITE} 💻 Instalando dependências do frontend...${GRAY_LIGHT}"
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
    if [ ! -d "/home/deploy/${instancia_add}/frontend" ]; then
        log_error "Diretório do frontend não encontrado"
        exit 1
    fi
    
    log_info "Instalando dependências do frontend..."

    sudo su - deploy <<EOF
    cd /home/deploy/${instancia_add}/frontend
    
    # Limpar cache do npm
    npm cache clean --force
    
    # Remover node_modules se existir
    rm -rf node_modules package-lock.json
    
    # Configurar npm para evitar problemas de memória
    npm config set fund false
    npm config set audit false
    
    # Instalar dependências
    npm install --force --legacy-peer-deps
    
    # Verificar se a instalação foi bem-sucedida
    if [ \$? -eq 0 ] && [ -d "node_modules" ]; then
        echo "✅ Dependências do frontend instaladas com sucesso"
    else
        echo "❌ Falha na instalação das dependências do frontend"
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Dependências do frontend instaladas com sucesso"
    else
        log_error "Falha na instalação das dependências do frontend"
        exit 1
    fi

    sleep 2
}

#######################################
# compiles frontend code - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
frontend_node_build() {
    print_banner
    printf "${WHITE} 💻 Compilando o código do frontend...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Compilando frontend..."

    sudo su - deploy <<EOF
    cd /home/deploy/${instancia_add}/frontend
    
    # Verificar se .env existe
    if [ ! -f ".env" ]; then
        echo "❌ Arquivo .env não encontrado"
        exit 1
    fi
    
    # Mostrar configurações (para debug)
    echo "Configurações do frontend:"
    cat .env
    
    # Remover build anterior
    rm -rf build
    
    # Aumentar limite de memória para o build
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    # Compilar
    npm run build
    
    # Verificar se a compilação foi bem-sucedida
    if [ -d "build" ] && [ -f "build/index.html" ]; then
        echo "✅ Frontend compilado com sucesso"
        echo "Arquivos no build:"
        ls -la build/
    else
        echo "❌ Falha na compilação do frontend"
        ls -la build/ 2>/dev/null || echo "Diretório build não foi criado"
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Frontend compilado com sucesso"
    else
        log_error "Falha na compilação do frontend"
        exit 1
    fi

    sleep 2
}

#######################################
# updates frontend code - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
frontend_update() {
    print_banner
    printf "${WHITE} 💻 Atualizando o frontend...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Atualizando frontend..."

    sudo su - deploy <<EOF
    cd /home/deploy/${empresa_atualizar}
    
    # Parar serviço
    pm2 stop ${empresa_atualizar}-frontend
    
    # Atualizar código
    git pull
    
    cd /home/deploy/${empresa_atualizar}/frontend
    
    # Reinstalar dependências
    npm install --force --legacy-peer-deps
    
    # Recompilar
    rm -rf build
    export NODE_OPTIONS="--max-old-space-size=4096"
    npm run build
    
    # Verificar se compilou
    if [ -d "build" ] && [ -f "build/index.html" ]; then
        echo "✅ Frontend atualizado e compilado"
        
        # Reiniciar serviço
        pm2 start ${empresa_atualizar}-frontend
        pm2 save
    else
        echo "❌ Falha na atualização do frontend"
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Frontend atualizado com sucesso"
    else
        log_error "Falha na atualização do frontend"
        exit 1
    fi

    sleep 2
}

#######################################
# sets frontend environment variables - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
frontend_set_env() {
    print_banner
    printf "${WHITE} 💻 Configurando variáveis de ambiente (frontend)...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    # Validar URL do backend
    validate_url "$backend_url" "Backend"
    
    # Normalizar URL (remover trailing slash)
    backend_url=$(echo "$backend_url" | sed 's:/*$::')
    
    # Verificar se a porta frontend está disponível
    check_port_available "$frontend_port" "Frontend"
    
    log_info "Criando arquivo .env do frontend..."

    sudo su - deploy << EOF
    # Criar arquivo .env do frontend
    cat <<[-]EOF > /home/deploy/${instancia_add}/frontend/.env
REACT_APP_BACKEND_URL=${backend_url}
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
REACT_APP_FRONTEND_URL=${frontend_url}
GENERATE_SOURCEMAP=false
[-]EOF
EOF

    # Verificar se arquivo foi criado
    if [ -f "/home/deploy/${instancia_add}/frontend/.env" ]; then
        log_success "Arquivo .env do frontend criado com sucesso"
        
        # Mostrar configurações
        log_info "Configurações do frontend:"
        cat "/home/deploy/${instancia_add}/frontend/.env"
    else
        log_error "Falha ao criar arquivo .env do frontend"
        exit 1
    fi

    sleep 2
    
    log_info "Criando servidor Express para o frontend..."

    sudo su - deploy << EOF
    # Criar servidor Express otimizado
    cat <<[-]EOF > /home/deploy/${instancia_add}/frontend/server.js
//simple express server to run frontend production build;
const express = require("express");
const path = require("path");
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = ${frontend_port};

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilitar CSP para evitar problemas com React
    crossOriginEmbedderPolicy: false
}));

// Compressão gzip
app.use(compression());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "build"), {
    maxAge: '1d', // Cache de 1 dia para arquivos estáticos
    etag: true
}));

// Configurar headers CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '${backend_url}');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Rota para health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        instance: '${instancia_add}'
    });
});

// Todas as outras rotas retornam o index.html (SPA)
app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor frontend:', err);
    res.status(500).send('Erro interno do servidor');
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 Frontend rodando na porta \${PORT}\`);
    console.log(\`📱 Instância: ${instancia_add}\`);
    console.log(\`🔗 Backend URL: ${backend_url}\`);
});

// Tratamento de sinais para shutdown graceful
process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Recebido SIGINT, encerrando servidor...');
    process.exit(0);
});

[-]EOF
EOF

    # Verificar se arquivo foi criado
    if [ -f "/home/deploy/${instancia_add}/frontend/server.js" ]; then
        log_success "Servidor Express criado com sucesso"
    else
        log_error "Falha ao criar servidor Express"
        exit 1
    fi

    # Instalar dependências adicionais para o servidor
    sudo su - deploy << EOF
    cd /home/deploy/${instancia_add}/frontend
    
    # Verificar se package.json existe
    if [ ! -f "package.json" ]; then
        echo "❌ package.json não encontrado"
        exit 1
    fi
    
    # Instalar dependências do servidor se não estiverem instaladas
    npm list compression > /dev/null 2>&1 || npm install compression
    npm list helmet > /dev/null 2>&1 || npm install helmet
    
    echo "✅ Dependências do servidor instaladas"
EOF

    sleep 2
}

#######################################
# starts pm2 for frontend - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
frontend_start_pm2() {
    print_banner
    printf "${WHITE} 💻 Iniciando pm2 (frontend)...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Configurando PM2 para o frontend..."
    
    # Parar processo existente se houver
    sudo -u deploy pm2 stop "${instancia_add}-frontend" 2>/dev/null || true
    sudo -u deploy pm2 delete "${instancia_add}-frontend" 2>/dev/null || true

    sudo su - deploy <<EOF
    cd /home/deploy/${instancia_add}/frontend
    
    # Verificar se os arquivos necessários existem
    if [ ! -f "server.js" ]; then
        echo "❌ Arquivo server.js não encontrado"
        exit 1
    fi
    
    if [ ! -d "build" ]; then
        echo "❌ Diretório build não encontrado"
        exit 1
    fi
    
    # Criar diretório de logs se não existir
    mkdir -p /home/deploy/${instancia_add}/logs
    
    # Iniciar com PM2
    pm2 start server.js \
        --name "${instancia_add}-frontend" \
        --log "/home/deploy/${instancia_add}/logs/frontend.log" \
        --error "/home/deploy/${instancia_add}/logs/frontend-error.log" \
        --out "/home/deploy/${instancia_add}/logs/frontend-out.log" \
        --time
    
    # Aguardar inicialização
    sleep 5
    
    # Verificar se está rodando
    if pm2 show "${instancia_add}-frontend" | grep -q "online"; then
        echo "✅ Frontend iniciado com sucesso"
    else
        echo "❌ Falha ao iniciar frontend"
        pm2 logs "${instancia_add}-frontend" --lines 10
        exit 1
    fi
    
    # Salvar configuração
    pm2 save
EOF

    if [ $? -eq 0 ]; then
        log_success "Frontend iniciado com PM2"
        
        # Testar se a porta está respondendo
        sleep 5
        if netstat -tlnp | grep ":${frontend_port} " > /dev/null; then
            log_success "Frontend está respondendo na porta ${frontend_port}"
            
            # Testar health check
            if curl -s "http://localhost:${frontend_port}/health" > /dev/null; then
                log_success "Health check do frontend OK"
            else
                log_warning "Health check do frontend falhou"
            fi
        else
            log_warning "Frontend pode não estar respondendo na porta ${frontend_port}"
        fi
    else
        log_error "Falha ao iniciar frontend com PM2"
        exit 1
    fi

    sleep 2
    
    # Configurar PM2 startup se ainda não foi configurado
    sudo su - root <<EOF
    if ! systemctl is-enabled pm2-deploy > /dev/null 2>&1; then
        echo "Configurando PM2 startup..."
        pm2 startup
        env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
        systemctl enable pm2-deploy
        echo "✅ PM2 startup configurado"
    else
        echo "✅ PM2 startup já configurado"
    fi
EOF

    sleep 2
}

#######################################
# sets up nginx for frontend - VERSÃO CORRIGIDA
# Arguments:
#   None
#######################################
frontend_nginx_setup() {
    print_banner
    printf "${WHITE} 💻 Configurando nginx (frontend)...${GRAY_LIGHT}"
    printf "\n\n"

    sleep 2
    
    log_info "Configurando Nginx para o frontend..."
    
    # Extrair hostname da URL
    frontend_hostname=$(echo "${frontend_url}" | sed 's|https\?://||' | sed 's|/.*||')
    
    log_info "Hostname do frontend: $frontend_hostname"

    sudo su - root << EOF
    # Remover configuração existente
    rm -f /etc/nginx/sites-enabled/${instancia_add}-frontend
    rm -f /etc/nginx/sites-available/${instancia_add}-frontend
    
    # Criar nova configuração
    cat > /etc/nginx/sites-available/${instancia_add}-frontend << 'END'
server {
    server_name $frontend_hostname;
    
    # Configurações de segurança
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Logs específicos
    access_log /var/log/nginx/${instancia_add}-frontend-access.log;
    error_log /var/log/nginx/${instancia_add}-frontend-error.log;
    
    # Compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://127.0.0.1:${frontend_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache para arquivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            proxy_pass http://127.0.0.1:${frontend_port};
            proxy_cache_valid 200 1d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:${frontend_port}/health;
        access_log off;
    }
    
    # Bloquear acesso a arquivos sensíveis
    location ~ /\.(ht|git|env) {
        deny all;
        return 404;
    }
}
END
    
    # Habilitar site
    ln -sf /etc/nginx/sites-available/${instancia_add}-frontend /etc/nginx/sites-enabled/
    
    # Testar configuração
    if nginx -t; then
        echo "✅ Configuração do Nginx válida"
    else
        echo "❌ Erro na configuração do Nginx"
        exit 1
    fi
EOF

    if [ $? -eq 0 ]; then
        log_success "Nginx configurado para o frontend"
    else
        log_error "Falha na configuração do Nginx"
        exit 1
    fi

    sleep 2
}