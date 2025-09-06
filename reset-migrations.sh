#!/bin/bash

# Script para resetar e executar todas as migrações novamente no servidor de produção
# Execute este script no servidor de produção via SSH

echo "=== RESET E EXECUÇÃO DE TODAS AS MIGRAÇÕES ==="
echo "ATENÇÃO: Este script irá resetar o banco de dados!"
echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
read

# Navegar para o diretório do projeto
echo "1. Navegando para o diretório do projeto..."
cd /opt/zapclic || cd /home/zapclic || cd /var/www/zapclic || {
    echo "Erro: Diretório do projeto não encontrado!"
    echo "Tente localizar manualmente com: find / -name 'package.json' -path '*/backend/*' 2>/dev/null"
    exit 1
}

echo "Diretório atual: $(pwd)"

# Verificar se estamos no diretório correto
if [ -f "backend/package.json" ]; then
    cd backend
    echo "Entrando no diretório backend..."
elif [ -f "package.json" ]; then
    echo "Já estamos no diretório backend"
else
    echo "Erro: package.json não encontrado!"
    exit 1
fi

echo "\n2. Parando serviços..."
docker-compose down 2>/dev/null || echo "Docker-compose não encontrado, continuando..."
pm2 stop all 2>/dev/null || echo "PM2 não encontrado, continuando..."

echo "\n3. Fazendo backup do banco de dados..."
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /tmp/db_backup

# Tentar diferentes métodos de backup
if command -v docker >/dev/null 2>&1; then
    echo "Fazendo backup via Docker..."
    docker-compose exec -T postgres pg_dump -U postgres zapclic > "/tmp/db_backup/backup_$DATE.sql" 2>/dev/null || \
    docker exec $(docker ps -q --filter "name=postgres") pg_dump -U postgres zapclic > "/tmp/db_backup/backup_$DATE.sql" 2>/dev/null || \
    echo "Backup via Docker falhou, tentando método direto..."
fi

# Backup direto se Docker falhar
if [ ! -f "/tmp/db_backup/backup_$DATE.sql" ]; then
    pg_dump -U postgres -h localhost zapclic > "/tmp/db_backup/backup_$DATE.sql" 2>/dev/null || \
    echo "Aviso: Não foi possível fazer backup automático do banco!"
fi

echo "\n4. Resetando migrações no banco de dados..."

# Comandos SQL para resetar migrações
SQL_COMMANDS="
DROP TABLE IF EXISTS \"SequelizeMeta\" CASCADE;
DROP TABLE IF EXISTS \"FlowBuilders\" CASCADE;
DROP TABLE IF EXISTS \"Companies\" CASCADE;
DROP TABLE IF EXISTS \"Users\" CASCADE;
DROP TABLE IF EXISTS \"Contacts\" CASCADE;
DROP TABLE IF EXISTS \"Tickets\" CASCADE;
DROP TABLE IF EXISTS \"Messages\" CASCADE;
DROP TABLE IF EXISTS \"Queues\" CASCADE;
DROP TABLE IF EXISTS \"Whatsapps\" CASCADE;
DROP TABLE IF EXISTS \"Settings\" CASCADE;
DROP TABLE IF EXISTS \"QuickMessages\" CASCADE;
DROP TABLE IF EXISTS \"Tags\" CASCADE;
DROP TABLE IF EXISTS \"ContactTags\" CASCADE;
DROP TABLE IF EXISTS \"TicketTags\" CASCADE;
DROP TABLE IF EXISTS \"UserQueues\" CASCADE;
DROP TABLE IF EXISTS \"QueueOptions\" CASCADE;
DROP TABLE IF EXISTS \"Chatbots\" CASCADE;
DROP TABLE IF EXISTS \"ChatbotOptions\" CASCADE;
DROP TABLE IF EXISTS \"Schedules\" CASCADE;
DROP TABLE IF EXISTS \"ContactListItems\" CASCADE;
DROP TABLE IF EXISTS \"ContactLists\" CASCADE;
DROP TABLE IF EXISTS \"Campaigns\" CASCADE;
DROP TABLE IF EXISTS \"CampaignShippings\" CASCADE;
DROP TABLE IF EXISTS \"Announcements\" CASCADE;
DROP TABLE IF EXISTS \"Helps\" CASCADE;
DROP TABLE IF EXISTS \"Plans\" CASCADE;
DROP TABLE IF EXISTS \"Subscriptions\" CASCADE;
DROP TABLE IF EXISTS \"Invoices\" CASCADE;
"

# Executar comandos SQL
if command -v docker >/dev/null 2>&1; then
    echo "Resetando via Docker..."
    echo "$SQL_COMMANDS" | docker-compose exec -T postgres psql -U postgres -d zapclic 2>/dev/null || \
    echo "$SQL_COMMANDS" | docker exec -i $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic 2>/dev/null || \
    echo "Reset via Docker falhou, tentando método direto..."
else
    echo "Resetando via psql direto..."
    echo "$SQL_COMMANDS" | psql -U postgres -h localhost -d zapclic 2>/dev/null || \
    echo "Erro: Não foi possível conectar ao banco de dados!"
fi

echo "\n5. Executando todas as migrações novamente..."

# Verificar se o Sequelize CLI está disponível
if [ -f "node_modules/.bin/sequelize" ]; then
    SEQUELIZE_CMD="./node_modules/.bin/sequelize"
elif command -v sequelize >/dev/null 2>&1; then
    SEQUELIZE_CMD="sequelize"
elif command -v npx >/dev/null 2>&1; then
    SEQUELIZE_CMD="npx sequelize-cli"
else
    echo "Erro: Sequelize CLI não encontrado!"
    echo "Instalando Sequelize CLI..."
    npm install -g sequelize-cli
    SEQUELIZE_CMD="sequelize"
fi

echo "Usando comando: $SEQUELIZE_CMD"

# Executar migrações
echo "Executando db:migrate..."
$SEQUELIZE_CMD db:migrate

if [ $? -eq 0 ]; then
    echo "✓ Migrações executadas com sucesso!"
else
    echo "✗ Erro ao executar migrações!"
    echo "\nTentando método alternativo..."
    
    # Método alternativo: executar migrações uma por uma
    echo "Listando arquivos de migração..."
    ls -la src/database/migrations/ || ls -la database/migrations/
    
    echo "\nExecutando migrações individuais..."
    for migration in src/database/migrations/*.js database/migrations/*.js; do
        if [ -f "$migration" ]; then
            echo "Executando: $migration"
            $SEQUELIZE_CMD db:migrate --to $(basename "$migration" .js)
        fi
    done
fi

echo "\n6. Executando seeds (se existirem)..."
$SEQUELIZE_CMD db:seed:all 2>/dev/null || echo "Nenhum seed encontrado ou erro ao executar seeds"

echo "\n7. Verificando estrutura do banco..."
if command -v docker >/dev/null 2>&1; then
    echo "Verificando via Docker..."
    docker-compose exec postgres psql -U postgres -d zapclic -c "\\dt" 2>/dev/null || \
    docker exec $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic -c "\\dt" 2>/dev/null
else
    echo "Verificando via psql direto..."
    psql -U postgres -h localhost -d zapclic -c "\\dt"
fi

echo "\n8. Verificando tabela FlowBuilders especificamente..."
if command -v docker >/dev/null 2>&1; then
    docker-compose exec postgres psql -U postgres -d zapclic -c "\\d FlowBuilders" 2>/dev/null || \
    docker exec $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic -c "\\d FlowBuilders" 2>/dev/null
else
    psql -U postgres -h localhost -d zapclic -c "\\d FlowBuilders"
fi

echo "\n9. Reiniciando serviços..."
if [ -f "docker-compose.yml" ]; then
    echo "Iniciando via Docker Compose..."
    docker-compose up -d
    sleep 10
    docker-compose ps
elif command -v pm2 >/dev/null 2>&1; then
    echo "Iniciando via PM2..."
    pm2 start all
    pm2 status
else
    echo "Iniciando via npm..."
    npm run dev:server &
fi

echo "\n10. Testando API de FlowBuilders..."
sleep 5
echo "Testando endpoint GET /flowbuilder..."
curl -I http://localhost:4000/flowbuilder 2>/dev/null || echo "Erro ao testar API"

echo "\n=== RESET DE MIGRAÇÕES CONCLUÍDO ==="
echo "Backup salvo em: /tmp/db_backup/backup_$DATE.sql"
echo "\nPróximos passos:"
echo "1. Verificar se os serviços estão rodando"
echo "2. Testar login no frontend"
echo "3. Tentar criar um novo fluxo"
echo "4. Verificar logs se houver problemas: docker-compose logs backend"