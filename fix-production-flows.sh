#!/bin/bash

# Script para corrigir problemas específicos de fluxos no servidor de produção
# Execute via SSH no servidor VPS após diagnosticar o problema

echo "🔧 Corrigindo problemas de fluxos no servidor de produção"
echo "======================================================"

# 1. Parar serviços
echo "\n⏹️ Parando serviços..."
docker-compose down

# 2. Backup do banco de dados
echo "\n💾 Fazendo backup do banco de dados..."
mkdir -p ~/backups/$(date +%Y%m%d)
docker run --rm -v zapclic_postgres_data:/data -v ~/backups/$(date +%Y%m%d):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

echo "✅ Backup salvo em ~/backups/$(date +%Y%m%d)/"

# 3. Verificar e corrigir migração problemática
echo "\n🔍 Verificando migração problemática..."
echo "Entrando no container do banco para verificar estrutura..."

# Iniciar apenas o banco de dados
docker-compose up -d db
sleep 10

# Verificar se a coluna company_id existe
echo "\n📊 Verificando estrutura da tabela FlowBuilders..."
docker-compose exec -T db psql -U postgres -d zapclic -c "\d \"FlowBuilders\";"

# Verificar migrações executadas
echo "\n📋 Verificando migrações executadas..."
docker-compose exec -T db psql -U postgres -d zapclic -c "SELECT * FROM \"SequelizeMeta\" ORDER BY name;"

# 4. Corrigir migração se necessário
echo "\n🔧 Corrigindo migração se necessário..."
echo "Removendo migração problemática do registro..."
docker-compose exec -T db psql -U postgres -d zapclic -c "DELETE FROM \"SequelizeMeta\" WHERE name = '20250111140000-add-missing-columns-flowbuilder.js';"

# 5. Iniciar backend para executar migrações
echo "\n🚀 Iniciando backend para executar migrações..."
docker-compose up -d backend
sleep 30

# Verificar logs do backend
echo "\n📋 Verificando logs do backend..."
docker-compose logs backend --tail 50

# 6. Verificar se a tabela está correta agora
echo "\n✅ Verificando estrutura final da tabela..."
docker-compose exec -T db psql -U postgres -d zapclic -c "\d \"FlowBuilders\";"

# 7. Testar criação de fluxo via SQL
echo "\n🧪 Testando criação de fluxo diretamente no banco..."
docker-compose exec -T db psql -U postgres -d zapclic -c "
INSERT INTO \"FlowBuilders\" (name, user_id, company_id, active, flow, \"createdAt\", \"updatedAt\")
VALUES ('Teste Produção', 1, 1, true, '{\"nodes\": [], \"edges\": []}', NOW(), NOW())
RETURNING id, name;
"

# 8. Verificar fluxos existentes
echo "\n📊 Verificando fluxos existentes no banco..."
docker-compose exec -T db psql -U postgres -d zapclic -c "SELECT id, name, company_id, active, \"createdAt\" FROM \"FlowBuilders\" ORDER BY id;"

# 9. Iniciar todos os serviços
echo "\n🚀 Iniciando todos os serviços..."
docker-compose up -d

# Aguardar inicialização
echo "\n⏳ Aguardando inicialização completa..."
sleep 60

# 10. Verificar status final
echo "\n📊 Status final dos serviços..."
docker-compose ps

echo "\n🌐 Testando conectividade..."
curl -f http://localhost:4000/health 2>/dev/null && echo "✅ Backend respondendo" || echo "❌ Backend não responde"
curl -f http://localhost:3000 2>/dev/null && echo "✅ Frontend respondendo" || echo "❌ Frontend não responde"

echo "\n✅ Correção concluída!"
echo "\n📋 Próximos passos:"
echo "1. Testar login no frontend"
echo "2. Verificar se fluxos aparecem na interface"
echo "3. Testar criação de novo fluxo"
echo "4. Verificar logs se houver problemas: docker-compose logs -f"

echo "\n🔗 URLs para testar:"
echo "Frontend: https://zap.meulink.lat"
echo "Backend: https://apizap.meulink.lat"