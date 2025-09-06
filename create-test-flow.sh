#!/bin/bash

# Script para criar um fluxo de teste via SSH no servidor de produção
# Execute este script no servidor após conectar via SSH

echo "=== CRIANDO FLUXO DE TESTE VIA SSH ==="

# Variáveis do fluxo de teste
FLOW_NAME="Fluxo Teste SSH $(date +%Y%m%d_%H%M%S)"
COMPANY_ID=1  # Ajuste conforme necessário
USER_ID=1     # Ajuste conforme necessário

echo "Nome do fluxo: $FLOW_NAME"
echo "Company ID: $COMPANY_ID"
echo "User ID: $USER_ID"

# Método 1: Via API REST (Recomendado)
echo "\n=== MÉTODO 1: CRIAÇÃO VIA API REST ==="

# Primeiro, obter um token de autenticação (se necessário)
echo "1. Testando endpoint de fluxos..."
curl -I http://localhost:4000/flowbuilder 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ API acessível"
else
    echo "✗ API não acessível. Verificando serviços..."
    docker-compose ps 2>/dev/null || pm2 status 2>/dev/null
fi

# Criar fluxo via POST
echo "\n2. Criando fluxo via API..."
RESPONSE=$(curl -s -X POST http://localhost:4000/flowbuilder \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$FLOW_NAME\",
    \"isActive\": true,
    \"companyId\": $COMPANY_ID,
    \"userId\": $USER_ID,
    \"flowData\": {
      \"nodes\": [
        {
          \"id\": \"start\",
          \"type\": \"start\",
          \"data\": {
            \"label\": \"Início\"
          },
          \"position\": { \"x\": 100, \"y\": 100 }
        },
        {
          \"id\": \"message1\",
          \"type\": \"message\",
          \"data\": {
            \"label\": \"Mensagem de Teste\",
            \"message\": \"Olá! Este é um fluxo de teste criado via SSH.\"
          },
          \"position\": { \"x\": 100, \"y\": 200 }
        }
      ],
      \"edges\": [
        {
          \"id\": \"e1\",
          \"source\": \"start\",
          \"target\": \"message1\"
        }
      ]
    }
  }")

echo "Resposta da API:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Verificar se foi criado com sucesso
if echo "$RESPONSE" | grep -q '"id"'; then
    echo "\n✓ Fluxo criado com sucesso via API!"
    FLOW_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "ID do fluxo: $FLOW_ID"
else
    echo "\n✗ Erro ao criar fluxo via API"
    echo "Tentando método alternativo..."
fi

# Método 2: Via SQL direto no banco
echo "\n=== MÉTODO 2: CRIAÇÃO VIA SQL DIRETO ==="

# SQL para inserir fluxo diretamente
SQL_INSERT="
INSERT INTO \"FlowBuilders\" (
    name, 
    \"isActive\", 
    \"companyId\", 
    \"userId\", 
    \"flowData\", 
    \"createdAt\", 
    \"updatedAt\"
) VALUES (
    '$FLOW_NAME',
    true,
    $COMPANY_ID,
    $USER_ID,
    '{\"nodes\":[{\"id\":\"start\",\"type\":\"start\",\"data\":{\"label\":\"Início\"},\"position\":{\"x\":100,\"y\":100}},{\"id\":\"message1\",\"type\":\"message\",\"data\":{\"label\":\"Mensagem de Teste\",\"message\":\"Olá! Este é um fluxo de teste criado via SSH.\"},\"position\":{\"x\":100,\"y\":200}}],\"edges\":[{\"id\":\"e1\",\"source\":\"start\",\"target\":\"message1\"}]}',
    NOW(),
    NOW()
) RETURNING id, name;
"

echo "Executando SQL..."
if command -v docker >/dev/null 2>&1; then
    echo "Via Docker:"
    echo "$SQL_INSERT" | docker-compose exec -T postgres psql -U postgres -d zapclic 2>/dev/null || \
    echo "$SQL_INSERT" | docker exec -i $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic 2>/dev/null
else
    echo "Via psql direto:"
    echo "$SQL_INSERT" | psql -U postgres -h localhost -d zapclic 2>/dev/null
fi

if [ $? -eq 0 ]; then
    echo "✓ Fluxo criado com sucesso via SQL!"
else
    echo "✗ Erro ao criar fluxo via SQL"
fi

# Método 3: Verificar fluxos existentes
echo "\n=== VERIFICANDO FLUXOS EXISTENTES ==="

echo "Listando todos os fluxos:"
if command -v docker >/dev/null 2>&1; then
    docker-compose exec postgres psql -U postgres -d zapclic -c "SELECT id, name, \"isActive\", \"companyId\", \"createdAt\" FROM \"FlowBuilders\" ORDER BY id DESC LIMIT 10;" 2>/dev/null || \
    docker exec $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic -c "SELECT id, name, \"isActive\", \"companyId\", \"createdAt\" FROM \"FlowBuilders\" ORDER BY id DESC LIMIT 10;" 2>/dev/null
else
    psql -U postgres -h localhost -d zapclic -c "SELECT id, name, \"isActive\", \"companyId\", \"createdAt\" FROM \"FlowBuilders\" ORDER BY id DESC LIMIT 10;" 2>/dev/null
fi

# Testar API de listagem
echo "\nTestando API de listagem:"
curl -s http://localhost:4000/flowbuilder | python3 -m json.tool 2>/dev/null || curl -s http://localhost:4000/flowbuilder

# Método 4: Comandos de diagnóstico
echo "\n=== DIAGNÓSTICO ADICIONAL ==="

echo "1. Verificando estrutura da tabela FlowBuilders:"
if command -v docker >/dev/null 2>&1; then
    docker-compose exec postgres psql -U postgres -d zapclic -c "\\d FlowBuilders" 2>/dev/null || \
    docker exec $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic -c "\\d FlowBuilders" 2>/dev/null
else
    psql -U postgres -h localhost -d zapclic -c "\\d FlowBuilders" 2>/dev/null
fi

echo "\n2. Verificando logs do backend:"
docker-compose logs backend --tail=20 2>/dev/null || pm2 logs --lines 20 2>/dev/null

echo "\n3. Verificando conectividade:"
netstat -tlnp | grep :4000 2>/dev/null || ss -tlnp | grep :4000 2>/dev/null

echo "\n=== COMANDOS MANUAIS PARA TESTE ==="
echo "\nSe os métodos automáticos falharem, execute manualmente:"
echo ""
echo "1. Criar via curl:"
echo "curl -X POST http://localhost:4000/flowbuilder \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\": \"Teste Manual\", \"isActive\": true, \"companyId\": 1}'"
echo ""
echo "2. Criar via SQL:"
echo "docker-compose exec postgres psql -U postgres -d zapclic"
echo "INSERT INTO \"FlowBuilders\" (name, \"isActive\", \"companyId\", \"createdAt\", \"updatedAt\") "
echo "VALUES ('Teste Manual', true, 1, NOW(), NOW());"
echo ""
echo "3. Verificar criação:"
echo "curl http://localhost:4000/flowbuilder"
echo ""
echo "4. Acessar frontend:"
echo "http://31.97.91.232:3000/flowbuilder"

echo "\n=== SCRIPT CONCLUÍDO ==="