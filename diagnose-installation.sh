#!/bin/bash

# Script de Diagnóstico da Instalação ZapClic
# Identifica problemas comuns que causam falha de conexão frontend-backend

echo "=== DIAGNÓSTICO DA INSTALAÇÃO ZAPCLIC ==="
echo "Data: $(date)"
echo ""

# Função para verificar se um serviço está rodando
check_service() {
    local service_name=$1
    local port=$2
    
    echo "Verificando $service_name na porta $port..."
    if netstat -tlnp | grep ":$port " > /dev/null; then
        echo "✅ $service_name está rodando na porta $port"
        return 0
    else
        echo "❌ $service_name NÃO está rodando na porta $port"
        return 1
    fi
}

# Função para verificar conectividade
check_connectivity() {
    local url=$1
    local name=$2
    
    echo "Testando conectividade: $name ($url)"
    if curl -s --connect-timeout 5 "$url" > /dev/null; then
        echo "✅ $name está acessível"
        return 0
    else
        echo "❌ $name NÃO está acessível"
        return 1
    fi
}

echo "1. VERIFICANDO SERVIÇOS PM2..."
pm2 list
echo ""

echo "2. VERIFICANDO PORTAS EM USO..."
netstat -tlnp | grep -E ":(3[0-9]{3}|4[0-9]{3}|5[0-9]{3})"
echo ""

echo "3. VERIFICANDO NGINX..."
sudo nginx -t
sudo systemctl status nginx --no-pager
echo ""

echo "4. VERIFICANDO SITES NGINX HABILITADOS..."
ls -la /etc/nginx/sites-enabled/
echo ""

echo "5. VERIFICANDO LOGS DO NGINX..."
echo "--- Últimas 10 linhas do error.log ---"
sudo tail -10 /var/log/nginx/error.log
echo ""
echo "--- Últimas 10 linhas do access.log ---"
sudo tail -10 /var/log/nginx/access.log
echo ""

echo "6. VERIFICANDO BANCO DE DADOS..."
sudo -u postgres psql -c "\l" | grep -v template
echo ""

echo "7. VERIFICANDO REDIS..."
docker ps | grep redis
echo ""

echo "8. VERIFICANDO VARIÁVEIS DE AMBIENTE..."
echo "Procurando arquivos .env..."
find /home/deploy -name ".env" -type f 2>/dev/null
echo ""

# Verificar se há instâncias instaladas
if [ -d "/home/deploy" ]; then
    echo "9. INSTÂNCIAS ENCONTRADAS:"
    ls -la /home/deploy/ | grep -v "^total\|^d.*\.$"
    echo ""
    
    # Para cada instância, verificar configurações
    for instance in /home/deploy/*/; do
        if [ -d "$instance" ]; then
            instance_name=$(basename "$instance")
            echo "=== VERIFICANDO INSTÂNCIA: $instance_name ==="
            
            # Verificar .env do backend
            if [ -f "$instance/backend/.env" ]; then
                echo "✅ Backend .env encontrado"
                echo "Configurações do backend:"
                grep -E "^(BACKEND_URL|FRONTEND_URL|PORT|DB_|REDIS_)" "$instance/backend/.env" | head -10
            else
                echo "❌ Backend .env NÃO encontrado"
            fi
            
            # Verificar .env do frontend
            if [ -f "$instance/frontend/.env" ]; then
                echo "✅ Frontend .env encontrado"
                echo "Configurações do frontend:"
                cat "$instance/frontend/.env"
            else
                echo "❌ Frontend .env NÃO encontrado"
            fi
            
            # Verificar se os builds existem
            if [ -d "$instance/backend/dist" ]; then
                echo "✅ Backend compilado (dist/ existe)"
            else
                echo "❌ Backend NÃO compilado (dist/ não existe)"
            fi
            
            if [ -d "$instance/frontend/build" ]; then
                echo "✅ Frontend compilado (build/ existe)"
            else
                echo "❌ Frontend NÃO compilado (build/ não existe)"
            fi
            
            echo ""
        fi
    done
fi

echo "10. VERIFICANDO LOGS PM2..."
pm2 logs --lines 20
echo ""

echo "11. PROBLEMAS COMUNS IDENTIFICADOS:"
problems_found=0

# Verificar se PM2 está rodando
if ! pm2 list > /dev/null 2>&1; then
    echo "❌ PM2 não está funcionando corretamente"
    problems_found=$((problems_found + 1))
fi

# Verificar se Nginx está rodando
if ! sudo systemctl is-active nginx > /dev/null 2>&1; then
    echo "❌ Nginx não está rodando"
    problems_found=$((problems_found + 1))
fi

# Verificar se PostgreSQL está rodando
if ! sudo systemctl is-active postgresql > /dev/null 2>&1; then
    echo "❌ PostgreSQL não está rodando"
    problems_found=$((problems_found + 1))
fi

# Verificar se há containers Redis
if ! docker ps | grep redis > /dev/null; then
    echo "❌ Nenhum container Redis encontrado"
    problems_found=$((problems_found + 1))
fi

if [ $problems_found -eq 0 ]; then
    echo "✅ Nenhum problema óbvio detectado"
else
    echo "⚠️  $problems_found problema(s) detectado(s)"
fi

echo ""
echo "=== DIAGNÓSTICO CONCLUÍDO ==="
echo "Para mais detalhes, execute os comandos específicos mostrados acima."
echo "Se o problema persistir, verifique:"
echo "1. Configurações de CORS no backend"
echo "2. URLs corretas no .env do frontend"
echo "3. Certificados SSL se usando HTTPS"
echo "4. Firewall e portas abertas"
echo "5. Logs detalhados: pm2 logs [nome-da-instancia]"