#!/bin/bash

# Script para corrigir problemas no servidor de produção via SSH
# Servidor: 31.97.91.232
# Usuário: root
# Senha: Da05As02He02@

echo "=== COMANDOS PARA EXECUTAR NO SERVIDOR DE PRODUÇÃO ==="
echo "1. Conectar via SSH:"
echo "ssh root@31.97.91.232"
echo "Senha: Da05As02He02@"
echo ""

echo "2. Navegar para o diretório do projeto:"
echo "cd /opt/zapclic || cd /home/deploy/zapclic || cd /var/www/zapclic"
echo ""

echo "3. Verificar status dos serviços:"
echo "docker ps -a"
echo "docker-compose ps"
echo ""

echo "4. Parar todos os serviços:"
echo "docker-compose down"
echo ""

echo "5. Verificar logs de erro:"
echo "docker-compose logs backend | tail -50"
echo "docker-compose logs frontend | tail -50"
echo ""

echo "6. Corrigir migração problemática:"
echo "# Conectar ao banco de dados"
echo "docker-compose exec postgres psql -U postgres -d zapclic"
echo ""
echo "# Verificar se a coluna já existe"
echo "\\d FlowBuilders;"
echo ""
echo "# Se a coluna company_id já existir, remover da migração:"
echo "# Editar o arquivo de migração ou executar:"
echo "ALTER TABLE \"FlowBuilders\" DROP COLUMN IF EXISTS company_id;"
echo "ALTER TABLE \"FlowBuilders\" ADD COLUMN company_id INTEGER REFERENCES \"Companies\"(id);"
echo "\\q"
echo ""

echo "7. Reiniciar serviços:"
echo "docker-compose up -d"
echo ""

echo "8. Verificar se os serviços subiram:"
echo "docker-compose ps"
echo "docker-compose logs backend | tail -20"
echo "docker-compose logs frontend | tail -20"
echo ""

echo "9. Testar conectividade:"
echo "curl -I http://localhost:3000"
echo "curl -I http://localhost:4000"
echo ""

echo "10. Verificar Nginx (se aplicável):"
echo "systemctl status nginx"
echo "nginx -t"
echo "systemctl restart nginx"
echo ""

echo "11. Testar criação de fluxo via API:"
echo "curl -X POST http://localhost:4000/flowbuilder \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer SEU_TOKEN' \\"
echo "  -d '{\"name\": \"Teste Fluxo\", \"isActive\": true}'"
echo ""

echo "=== COMANDOS ALTERNATIVOS SE DOCKER NÃO FUNCIONAR ==="
echo "# Verificar se é PM2:"
echo "pm2 list"
echo "pm2 restart all"
echo ""
echo "# Verificar se é systemd:"
echo "systemctl list-units | grep zapclic"
echo "systemctl restart zapclic-backend"
echo "systemctl restart zapclic-frontend"
echo ""

echo "=== VERIFICAÇÃO FINAL ==="
echo "# Acessar a aplicação:"
echo "# Frontend: http://31.97.91.232:3000"
echo "# Backend: http://31.97.91.232:4000"
echo "# Testar login e criação de fluxos"