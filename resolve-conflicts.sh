#!/bin/bash

echo "🚨 Resolvendo conflitos Git e problemas de porta..."
echo ""

# Parar todos os processos PM2
echo "🛑 Parando todos os processos PM2..."
pm2 delete all
echo ""

# Matar todos os processos na porta 4000
echo "🔫 Matando processos na porta 4000..."
sudo fuser -k 4000/tcp || echo "Nenhum processo encontrado na porta 4000"
sudo pkill -f "node.*4000" || echo "Nenhum processo node encontrado"
echo ""

# Resolver conflitos Git fazendo stash das mudanças locais
echo "📦 Fazendo stash das mudanças locais..."
cd /home/deploy/zapclic
git stash
echo ""

echo "📥 Fazendo pull novamente..."
git pull origin main
echo ""

echo "📁 Verificando se os arquivos do webhook agora existem..."
echo "🔍 CaktoWebhookController:"
ls -la backend/src/controllers/CaktoWebhookController.ts || echo "❌ Ainda não existe"
echo ""
echo "🔍 caktoWebhookRoutes:"
ls -la backend/src/routes/caktoWebhookRoutes.ts || echo "❌ Ainda não existe"
echo ""

echo "🔍 Verificando rotas no index.ts:"
grep -n "caktoWebhookRoutes" backend/src/routes/index.ts || echo "❌ Não encontrado no index.ts"
echo ""

echo "🏗️ Build do backend..."
cd backend
npm install
rm -rf dist/
npm run build
echo ""

echo "🔍 Verificando se a porta 4000 está livre..."
sudo lsof -i :4000 || echo "✅ Porta 4000 está livre"
echo ""

echo "🚀 Iniciando backend..."
pm2 start dist/server.js --name "zapclic-backend"
pm2 save
echo ""

echo "⏱️ Aguardando 3 segundos..."
sleep 3

echo "📋 Status PM2:"
pm2 list
echo ""

echo "🧪 Teste final:"
curl -I http://localhost:4000/cakto/webhook/test
echo ""

echo "✅ Processo finalizado!"
