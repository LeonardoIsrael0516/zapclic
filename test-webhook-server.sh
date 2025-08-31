#!/bin/bash

echo "🧪 Testando webhook da Cakto após configuração..."
echo ""

# Payload de teste
PAYLOAD='{
  "id": "test-123456",
  "status": "paid",
  "event": "subscription.paid",
  "customer": {
    "name": "João Silva",
    "email": "joao.silva@exemplo.com",
    "phone": "11999999999"
  },
  "subscription": {
    "id": "sub-789",
    "plan": {
      "name": "Plano Pro",
      "price": 4900,
      "interval": "monthly"
    }
  },
  "payment": {
    "method": "pix",
    "amount": 4900,
    "paid_at": "'$(date -Iseconds)'"
  }
}'

echo "📡 Testando endpoint local do backend..."
curl -X POST http://localhost:3333/cakto/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: 2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6" \
  -d "$PAYLOAD" \
  -v
echo ""
echo ""

echo "📡 Testando endpoint local do frontend..."
curl -X POST http://localhost:3000/cakto/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: 2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6" \
  -d "$PAYLOAD" \
  -v
echo ""
echo ""

echo "📡 Testando endpoint simples do frontend..."
curl -X POST http://localhost:3000/cakto/webhook/test-simple \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: 2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6" \
  -d "$PAYLOAD" \
  -v
echo ""
echo ""

echo "🌐 Testando endpoints públicos..."
echo "📡 Backend público..."
curl -X POST https://apizap.meulink.lat/cakto/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: 2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6" \
  -d "$PAYLOAD" \
  -v
echo ""
echo ""

echo "📡 Frontend público..."
curl -X POST https://zap.meulink.lat/cakto/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: 2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6" \
  -d "$PAYLOAD" \
  -v
echo ""
echo ""

echo "✅ Teste completo!"
