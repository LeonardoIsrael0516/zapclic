#!/bin/bash

echo "🔧 Configurando proxy nginx para webhook Cakto..."
echo ""

# Backup da configuração atual
echo "💾 Fazendo backup da configuração nginx..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Verificar se já existe configuração para apizap.meulink.lat
if grep -q "apizap.meulink.lat" /etc/nginx/sites-available/default; then
    echo "✅ Configuração apizap.meulink.lat já existe"
    
    # Verificar se já tem proxy para /cakto/webhook
    if grep -q "/cakto/webhook" /etc/nginx/sites-available/default; then
        echo "✅ Proxy /cakto/webhook já configurado"
    else
        echo "➕ Adicionando proxy /cakto/webhook..."
        
        # Adicionar configuração do webhook antes do fechamento da location /
        sudo sed -i '/server_name apizap.meulink.lat;/a\\n    # Proxy para webhook Cakto\n    location /cakto/webhook {\n        proxy_pass http://localhost:4000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_cache_bypass $http_upgrade;\n    }' /etc/nginx/sites-available/default
    fi
else
    echo "❌ Configuração apizap.meulink.lat não encontrada"
    echo "Você precisa criar a configuração do nginx primeiro"
    exit 1
fi

# Testar configuração
echo "🧪 Testando configuração nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração nginx válida"
    
    echo "🔄 Recarregando nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Nginx recarregado com sucesso!"
    
    echo ""
    echo "🧪 Testando webhook após configuração..."
    sleep 2
    curl -X GET https://apizap.meulink.lat/cakto/webhook/test -v
else
    echo "❌ Erro na configuração nginx"
    echo "💾 Restaurando backup..."
    sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
fi
