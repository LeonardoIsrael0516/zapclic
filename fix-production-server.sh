#!/bin/bash

# Script para diagnosticar e corrigir problemas no servidor de produção
# Execute via SSH no servidor VPS

echo "🔍 Diagnóstico do servidor de produção ZapClic"
echo "================================================"

# 1. Verificar status dos serviços
echo "\n📊 Verificando status dos serviços..."
echo "Docker containers:"
docker ps -a

echo "\nServiços systemd:"
systemctl status nginx
systemctl status docker

# 2. Verificar logs dos containers
echo "\n📋 Verificando logs dos containers..."
echo "\n--- Logs do Backend ---"
docker logs zapclic-backend --tail 50

echo "\n--- Logs do Frontend ---"
docker logs zapclic-frontend --tail 50

echo "\n--- Logs do Banco de Dados ---"
docker logs zapclic-db --tail 50

# 3. Verificar conectividade de rede
echo "\n🌐 Verificando conectividade..."
echo "Portas em uso:"
netstat -tlnp | grep -E ':(3000|4000|5432|80|443)'

echo "\nProcessos usando as portas:"
lsof -i :4000 2>/dev/null || echo "Porta 4000 não está em uso"
lsof -i :3000 2>/dev/null || echo "Porta 3000 não está em uso"

# 4. Verificar espaço em disco
echo "\n💾 Verificando espaço em disco..."
df -h

echo "\nUso de disco por diretório:"
du -sh /var/lib/docker 2>/dev/null || echo "Docker directory not found"
du -sh ~/zapclic 2>/dev/null || echo "ZapClic directory not found"

# 5. Verificar configuração do Nginx
echo "\n⚙️ Verificando configuração do Nginx..."
nginx -t

echo "\nArquivos de configuração do Nginx:"
ls -la /etc/nginx/sites-enabled/

echo "\n📄 Configuração do site:"
cat /etc/nginx/sites-enabled/zapclic 2>/dev/null || echo "Arquivo de configuração não encontrado"

echo "\n🔍 Diagnóstico concluído!"
echo "\n💡 Próximos passos sugeridos:"
echo "1. Se containers estão parados: docker-compose up -d"
echo "2. Se há erro de migração: verificar logs do backend"
echo "3. Se Nginx com problema: systemctl restart nginx"
echo "4. Se falta espaço: limpar logs e imagens antigas"
echo "5. Se porta ocupada: identificar e parar processo conflitante"