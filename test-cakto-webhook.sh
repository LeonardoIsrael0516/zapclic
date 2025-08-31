#!/bin/bash

# Script para testar a integração webhook da Cakto
# Este script simula um pagamento aprovado e testa a criação automática de contas

echo "🚀 Testando Integração Webhook Cakto - ZapClic"
echo "=============================================="

# Configurar URL base (altere conforme necessário)
BASE_URL="http://localhost:8090"

echo "📡 Testando conectividade do webhook..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/cakto/webhook/test")

if [ "$response" = "200" ]; then
    echo "✅ Webhook endpoint está ativo"
else
    echo "❌ Webhook endpoint não está respondendo (HTTP $response)"
    exit 1
fi

echo ""
echo "💰 Simulando pagamento aprovado..."

# Payload de teste baseado no exemplo real da Cakto
payload='{
  "data": {
    "id": "test-' $(date +%s) '",
    "amount": 29.90,
    "status": "paid",
    "paidAt": "' $(date -Iseconds) '",
    "customer": {
      "name": "Cliente Teste ZapClic",
      "email": "teste.zapclic+' $(date +%s) '@gmail.com",
      "phone": "5511999999999",
      "docType": "cpf",
      "docNumber": "12345678901"
    },
    "product": {
      "id": "test-product-123",
      "name": "Plano Básico ZapClic",
      "type": "subscription"
    },
    "subscription": {
      "id": "test-subscription-123",
      "status": "active",
      "next_payment_date": "' $(date -d "+30 days" -Iseconds) '"
    }
  },
  "event": "purchase_approved",
  "secret": "test-secret-123"
}'

echo "📦 Enviando payload:"
echo "$payload" | jq .

echo ""
echo "📨 Fazendo requisição para o webhook..."

response=$(curl -s -X POST "$BASE_URL/cakto/webhook" \
  -H "Content-Type: application/json" \
  -d "$payload")

echo "📨 Resposta recebida:"
echo "$response" | jq .

echo ""
echo "🔍 Verificando resposta..."

success=$(echo "$response" | jq -r '.success // false')
message=$(echo "$response" | jq -r '.message // "Nenhuma mensagem"')

if [ "$success" = "true" ]; then
    echo "✅ Webhook processado com sucesso!"
    echo "📋 Detalhes:"
    echo "   - Mensagem: $message"
    echo "   - Empresa: $(echo "$response" | jq -r '.company.name // "N/A"')"
    echo "   - Email: $(echo "$response" | jq -r '.company.email // "N/A"')"
    echo "   - Plano: $(echo "$response" | jq -r '.company.plan // "N/A"')"
    echo "   - Valor: R$ $(echo "$response" | jq -r '.company.planValue // "N/A"')"
    
    isNewCompany=$(echo "$response" | jq -r '.isNewCompany // false')
    if [ "$isNewCompany" = "true" ]; then
        echo "   - ✨ Nova empresa criada!"
        echo "   - 👤 Usuário admin: $(echo "$response" | jq -r '.user.name // "N/A"')"
    else
        echo "   - 🔄 Empresa existente atualizada"
    fi
else
    echo "❌ Erro no processamento do webhook"
    echo "💬 Mensagem de erro: $message"
    error=$(echo "$response" | jq -r '.error // "Erro desconhecido"')
    echo "⚠️  Detalhes: $error"
fi

echo ""
echo "🧪 Teste de payload inválido..."

invalid_payload='{"invalid": "payload"}'
response=$(curl -s -X POST "$BASE_URL/cakto/webhook" \
  -H "Content-Type: application/json" \
  -d "$invalid_payload")

echo "📨 Resposta para payload inválido:"
echo "$response" | jq .

echo ""
echo "🎯 Teste de evento ignorado..."

ignored_payload='{
  "data": {
    "id": "test-ignored",
    "amount": 29.90,
    "status": "pending",
    "customer": {
      "name": "Cliente Teste",
      "email": "teste@email.com",
      "phone": "11999999999"
    }
  },
  "event": "purchase_pending"
}'

response=$(curl -s -X POST "$BASE_URL/cakto/webhook" \
  -H "Content-Type: application/json" \
  -d "$ignored_payload")

echo "📨 Resposta para evento ignorado:"
echo "$response" | jq .

echo ""
echo "🏁 Teste concluído!"
echo ""
echo "🔗 URLs importantes:"
echo "   - Webhook endpoint: $BASE_URL/cakto/webhook"
echo "   - Teste de conectividade: $BASE_URL/cakto/webhook/test"
echo ""
echo "📚 Para mais informações, consulte: CAKTO_WEBHOOK_INTEGRATION.md"
