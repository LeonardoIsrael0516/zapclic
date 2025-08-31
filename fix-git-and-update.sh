#!/bin/bash

echo "🔧 Corrigindo problema de Git ownership e atualizando código..."
echo ""

# Corrigir problema de ownership do Git
echo "🛠️ Configurando Git safe directory..."
git config --global --add safe.directory /home/deploy/zapclic
echo ""

# Ir para a pasta do projeto
cd /home/deploy/zapclic

echo "📥 Fazendo pull das alterações (tentativa 2)..."
git pull origin main
echo ""

echo "📁 Verificando se os arquivos foram atualizados..."
echo "🔍 Verificando CaktoWebhookController:"
ls -la backend/src/controllers/CaktoWebhookController.ts
echo ""
echo "🔍 Verificando caktoWebhookRoutes:"
ls -la backend/src/routes/caktoWebhookRoutes.ts
echo ""

echo "🛑 Parando PM2 atual..."
pm2 stop zapclic-backend || echo "Processo não estava rodando"
pm2 delete zapclic-backend || echo "Processo não existia"
echo ""

echo "🏗️ Rebuild completo do backend..."
cd backend
rm -rf dist/
npm run build
echo ""

echo "🚀 Iniciando backend novamente..."
pm2 start dist/server.js --name "zapclic-backend" --log-date-format="YYYY-MM-DD HH:mm Z"
pm2 save
echo ""

echo "⏱️ Aguardando 5 segundos para o servidor inicializar..."
sleep 5

echo "📋 Status PM2:"
pm2 list
echo ""

echo "📊 Logs do PM2:"
pm2 logs zapclic-backend --lines 10
echo ""

echo "🧪 Testando GET no endpoint de teste:"
curl -v http://localhost:4000/cakto/webhook/test
echo ""
echo ""

echo "🧪 Testando POST no webhook:"
curl -X POST http://localhost:4000/cakto/webhook/test \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: 2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6" \
  -d '{"test": true, "status": "paid", "event": "subscription.paid"}' \
  -v
echo ""
echo ""

echo "✅ Atualização completa finalizada!"
