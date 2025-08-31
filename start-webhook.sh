#!/bin/bash

echo "🚀 Iniciando Webhook Server Dedicado"

cd backend

# Build
echo "📦 Building..."
npm run build

# Iniciar servidor webhook dedicado
echo "🎯 Iniciando webhook server na porta 9090..."
node dist/webhookServer.js &

echo "✅ Webhook server iniciado!"
echo ""
echo "📡 URLs para testar:"
echo "   http://localhost:9090/test"
echo "   http://sua-url:9090/webhook/test"
echo ""
echo "🔧 Para parar: pkill -f webhookServer"
