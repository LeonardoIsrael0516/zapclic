#!/bin/bash

echo "🚀 Corrigindo backend com rotas do webhook..."
echo ""

# Ir para a pasta do projeto
cd /home/deploy/zapclic

echo "📥 Fazendo pull das alterações..."
git pull origin main
echo ""

echo "📦 Instalando dependências do backend..."
cd backend
npm install
echo ""

echo "🏗️ Fazendo build do backend..."
npm run build
echo ""

echo "🔄 Verificando se há processos na porta 4000..."
sudo lsof -i :4000
echo ""

echo "🛑 Parando processos na porta 4000 (se houver)..."
sudo pkill -f "node.*4000" || echo "Nenhum processo encontrado"
echo ""

echo "🚀 Iniciando backend com PM2..."
pm2 start dist/server.js --name "zapclic-backend" -e error.log -o out.log
echo ""

echo "💾 Salvando configuração PM2..."
pm2 save
echo ""

echo "📋 Verificando status:"
pm2 list
echo ""

echo "🧪 Testando endpoint após atualização..."
sleep 3
curl -I http://localhost:4000/cakto/webhook/test
echo ""

echo "🧪 Testando POST no webhook:"
curl -X POST http://localhost:4000/cakto/webhook/test \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: 2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6" \
  -d '{"test": true, "status": "paid", "event": "subscription.paid"}'
echo ""
echo ""

echo "✅ Backend atualizado e testado!"
