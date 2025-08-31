#!/bin/bash

echo "🔄 Reiniciando serviços com código atualizado..."
echo ""

# Parar todos os processos PM2
echo "🛑 Parando todos os processos PM2..."
pm2 delete all
echo ""

# Matar processos nas portas se estiverem ocupadas
echo "🔫 Limpando portas 3000 e 4000..."
sudo fuser -k 3000/tcp || echo "Porta 3000 estava livre"
sudo fuser -k 4000/tcp || echo "Porta 4000 estava livre"
echo ""

echo "🏗️ Build do backend..."
cd /home/deploy/zapclic/backend
rm -rf dist/
npm run build
echo ""

echo "🚀 Iniciando backend na porta 4000..."
pm2 start dist/server.js --name "backend-4000"
echo ""

echo "🏗️ Build do frontend..."
cd ../frontend
npm run build
echo ""

echo "🚀 Iniciando frontend na porta 3000 (com server.js)..."
pm2 start server.js --name "frontend-3000"
echo ""

echo "💾 Salvando configuração PM2..."
pm2 save
echo ""

echo "⏱️ Aguardando 5 segundos para inicializar..."
sleep 5

echo "📋 Status PM2:"
pm2 list
echo ""

echo "🧪 Testando backend (porta 4000):"
curl -I http://localhost:4000/cakto/webhook/test
echo ""

echo "🧪 Testando frontend (porta 3000):"
curl -I http://localhost:3000/cakto/webhook/test-simple
echo ""

echo "✅ Serviços reiniciados!"
