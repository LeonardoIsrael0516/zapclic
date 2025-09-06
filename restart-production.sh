#!/bin/bash

# Script simples para reiniciar serviços no servidor de produção
# Execute via SSH no servidor VPS

echo "🔄 Reiniciando serviços do ZapClic no servidor de produção"
echo "===================================================="

# 1. Ir para o diretório do projeto
echo "📁 Navegando para o diretório do projeto..."
cd ~/zapclic || cd /opt/zapclic || cd /var/www/zapclic || {
    echo "❌ Diretório do projeto não encontrado!"
    echo "💡 Localize o diretório com: find / -name 'docker-compose.yml' -path '*/zapclic/*' 2>/dev/null"
    exit 1
}

echo "✅ Diretório encontrado: $(pwd)"

# 2. Verificar se docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Arquivo docker-compose.yml não encontrado!"
    ls -la
    exit 1
fi

# 3. Parar todos os serviços
echo "\n⏹️ Parando todos os serviços..."
docker-compose down

# 4. Limpar containers órfãos
echo "\n🧹 Limpando containers órfãos..."
docker system prune -f

# 5. Verificar imagens
echo "\n🖼️ Verificando imagens Docker..."
docker images | grep zapclic

# 6. Iniciar serviços
echo "\n🚀 Iniciando serviços..."
docker-compose up -d

# 7. Aguardar inicialização
echo "\n⏳ Aguardando inicialização (60 segundos)..."
sleep 60

# 8. Verificar status
echo "\n📊 Status dos containers..."
docker-compose ps

# 9. Verificar logs
echo "\n📋 Últimos logs do backend..."
docker-compose logs backend --tail 20

echo "\n📋 Últimos logs do frontend..."
docker-compose logs frontend --tail 10

# 10. Testar conectividade
echo "\n🌐 Testando conectividade..."
echo "Backend (porta 4000):"
curl -f http://localhost:4000/health 2>/dev/null && echo "✅ OK" || echo "❌ Falhou"

echo "Frontend (porta 3000):"
curl -f http://localhost:3000 2>/dev/null && echo "✅ OK" || echo "❌ Falhou"

# 11. Verificar Nginx
echo "\n⚙️ Verificando Nginx..."
systemctl status nginx --no-pager

echo "\n🔄 Reiniciando Nginx..."
sudo systemctl restart nginx

echo "\n✅ Reinicialização concluída!"
echo "\n🔗 Teste as URLs:"
echo "Frontend: https://zap.meulink.lat"
echo "Backend: https://apizap.meulink.lat"
echo "\n📋 Se ainda houver problemas, execute:"
echo "./fix-production-server.sh (para diagnóstico completo)"
echo "./fix-production-flows.sh (para corrigir problemas de fluxos)"