#!/bin/bash

echo "🔧 Diagnóstico e correção do webhook Cakto..."
echo ""

# Verificar se os serviços estão rodando
echo "📋 Verificando PM2:"
pm2 list
echo ""

# Verificar se o backend está respondendo localmente na porta 4000
echo "🧪 Testando backend local (porta 4000):"
curl -s -I http://localhost:4000/cakto/webhook/test || echo "❌ Backend não responde na porta 4000"
echo ""

# Verificar se o frontend está rodando o server.js ou react-scripts
echo "📂 Verificando processo do frontend:"
pm2 show frontend-server 2>/dev/null || pm2 show frontend 2>/dev/null || echo "❌ Frontend não encontrado no PM2"
echo ""

# Verificar configuração do nginx
echo "🌐 Verificando configuração do nginx:"
if [ -f /etc/nginx/sites-available/default ]; then
    echo "📄 Configuração nginx encontrada:"
    grep -A 10 -B 5 "apizap.meulink.lat" /etc/nginx/sites-available/default
else
    echo "❌ Configuração nginx não encontrada"
fi
echo ""

# Testar webhook localmente
echo "🧪 Testando webhook localmente:"
curl -X POST http://localhost:4000/cakto/webhook/test \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    -s || echo "❌ Webhook local falhou"
echo ""

echo "💡 Soluções possíveis:"
echo "1. Adicionar proxy no nginx para /cakto/webhook -> localhost:4000"
echo "2. Usar frontend com server.js para processar webhook"
echo "3. Liberar porta 4000 no firewall"
