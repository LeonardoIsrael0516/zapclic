#!/bin/bash

# Script simples para executar migrações no servidor de produção
# Opção mais segura que não reseta o banco

echo "=== EXECUTANDO MIGRAÇÕES NO SERVIDOR DE PRODUÇÃO ==="

# Navegar para o diretório do projeto
echo "1. Localizando diretório do projeto..."
if [ -d "/opt/zapclic/backend" ]; then
    cd /opt/zapclic/backend
    echo "Encontrado em: /opt/zapclic/backend"
elif [ -d "/home/zapclic/backend" ]; then
    cd /home/zapclic/backend
    echo "Encontrado em: /home/zapclic/backend"
elif [ -d "/var/www/zapclic/backend" ]; then
    cd /var/www/zapclic/backend
    echo "Encontrado em: /var/www/zapclic/backend"
else
    echo "Procurando automaticamente..."
    PROJECT_DIR=$(find / -name "package.json" -path "*/backend/*" 2>/dev/null | head -1 | xargs dirname)
    if [ -n "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        echo "Encontrado em: $PROJECT_DIR"
    else
        echo "Erro: Diretório do projeto não encontrado!"
        echo "Execute manualmente: find / -name 'package.json' -path '*/backend/*'"
        exit 1
    fi
fi

echo "Diretório atual: $(pwd)"

# Verificar arquivos essenciais
echo "\n2. Verificando arquivos..."
if [ ! -f "package.json" ]; then
    echo "Erro: package.json não encontrado!"
    exit 1
fi

if [ ! -d "src/database/migrations" ] && [ ! -d "database/migrations" ]; then
    echo "Erro: Diretório de migrações não encontrado!"
    echo "Procurando migrações..."
    find . -name "*migration*" -type d
    exit 1
fi

echo "✓ Arquivos encontrados"

# Verificar status das migrações
echo "\n3. Verificando status atual das migrações..."

# Tentar diferentes comandos do Sequelize
if [ -f "node_modules/.bin/sequelize" ]; then
    SEQUELIZE_CMD="./node_modules/.bin/sequelize"
elif command -v sequelize >/dev/null 2>&1; then
    SEQUELIZE_CMD="sequelize"
elif command -v npx >/dev/null 2>&1; then
    SEQUELIZE_CMD="npx sequelize-cli"
else
    echo "Sequelize CLI não encontrado. Instalando..."
    npm install sequelize-cli
    SEQUELIZE_CMD="npx sequelize-cli"
fi

echo "Usando: $SEQUELIZE_CMD"

# Verificar status das migrações
echo "\nStatus das migrações:"
$SEQUELIZE_CMD db:migrate:status 2>/dev/null || echo "Não foi possível verificar status"

# Executar migrações pendentes
echo "\n4. Executando migrações pendentes..."
$SEQUELIZE_CMD db:migrate

if [ $? -eq 0 ]; then
    echo "✓ Migrações executadas com sucesso!"
else
    echo "✗ Erro ao executar migrações!"
    echo "\nDetalhes do erro:"
    $SEQUELIZE_CMD db:migrate --verbose
    
    echo "\nTentando corrigir problemas comuns..."
    
    # Verificar se a tabela SequelizeMeta existe
    echo "Verificando tabela SequelizeMeta..."
    if command -v docker >/dev/null 2>&1; then
        docker-compose exec postgres psql -U postgres -d zapclic -c "SELECT * FROM \"SequelizeMeta\" LIMIT 5;" 2>/dev/null || \
        docker exec $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic -c "SELECT * FROM \"SequelizeMeta\" LIMIT 5;" 2>/dev/null || \
        echo "Tabela SequelizeMeta não encontrada ou erro de conexão"
    else
        psql -U postgres -h localhost -d zapclic -c "SELECT * FROM \"SequelizeMeta\" LIMIT 5;" 2>/dev/null || \
        echo "Tabela SequelizeMeta não encontrada ou erro de conexão"
    fi
    
    # Tentar executar migração específica problemática
    echo "\nTentando executar migração específica..."
    $SEQUELIZE_CMD db:migrate --to 20250111140000-add-missing-columns-flowbuilder.js 2>/dev/null || \
    echo "Migração específica não encontrada ou já executada"
fi

# Verificar estrutura da tabela FlowBuilders
echo "\n5. Verificando tabela FlowBuilders..."
if command -v docker >/dev/null 2>&1; then
    echo "Estrutura da tabela FlowBuilders:"
    docker-compose exec postgres psql -U postgres -d zapclic -c "\\d FlowBuilders" 2>/dev/null || \
    docker exec $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic -c "\\d FlowBuilders" 2>/dev/null || \
    echo "Erro ao verificar tabela FlowBuilders"
else
    psql -U postgres -h localhost -d zapclic -c "\\d FlowBuilders" 2>/dev/null || \
    echo "Erro ao verificar tabela FlowBuilders"
fi

# Verificar se há dados na tabela
echo "\nVerificando dados na tabela FlowBuilders:"
if command -v docker >/dev/null 2>&1; then
    docker-compose exec postgres psql -U postgres -d zapclic -c "SELECT COUNT(*) FROM \"FlowBuilders\";" 2>/dev/null || \
    docker exec $(docker ps -q --filter "name=postgres") psql -U postgres -d zapclic -c "SELECT COUNT(*) FROM \"FlowBuilders\";" 2>/dev/null || \
    echo "Erro ao contar registros"
else
    psql -U postgres -h localhost -d zapclic -c "SELECT COUNT(*) FROM \"FlowBuilders\";" 2>/dev/null || \
    echo "Erro ao contar registros"
fi

# Status final
echo "\n6. Status final das migrações:"
$SEQUELIZE_CMD db:migrate:status

echo "\n=== EXECUÇÃO DE MIGRAÇÕES CONCLUÍDA ==="
echo "\nPróximos passos:"
echo "1. Reiniciar o backend: docker-compose restart backend"
echo "2. Verificar logs: docker-compose logs backend"
echo "3. Testar API: curl http://localhost:4000/flowbuilder"
echo "4. Testar frontend: acessar http://IP_SERVIDOR:3000/flowbuilder"