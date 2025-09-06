#!/bin/bash

# Script para Diagnóstico Remoto do Servidor de Produção
# Servidor: 72.60.57.22
# Usuário: root

SERVER_IP="72.60.57.22"
SERVER_USER="root"

echo "=== DIAGNÓSTICO REMOTO ZAPCLIC ==="
echo "Servidor: $SERVER_IP"
echo "Usuário: $SERVER_USER"
echo "Data: $(date)"
echo ""

# Função para executar comandos remotos
execute_remote() {
    local command="$1"
    local description="$2"
    
    echo "--- $description ---"
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$command"
    echo ""
}

# Função para transferir e executar script
transfer_and_execute() {
    local script_name="$1"
    local description="$2"
    
    echo "--- $description ---"
    
    # Transferir script
    scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$script_name" "$SERVER_USER@$SERVER_IP:/tmp/"
    
    if [ $? -eq 0 ]; then
        echo "Script transferido com sucesso"
        
        # Executar script
        ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "chmod +x /tmp/$script_name && /tmp/$script_name"
    else
        echo "Erro ao transferir script"
    fi
    echo ""
}

echo "Verificando conectividade com o servidor..."
if ping -c 1 "$SERVER_IP" >/dev/null 2>&1; then
    echo "✓ Servidor responde ao ping"
else
    echo "✗ Servidor não responde ao ping"
    exit 1
fi

echo "Testando conexão SSH..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "echo 'Conexão SSH OK'" >/dev/null 2>&1; then
    echo "✓ Conexão SSH estabelecida"
else
    echo "✗ Falha na conexão SSH"
    echo "Verifique:"
    echo "1. Se o servidor SSH está rodando"
    echo "2. Se a chave SSH está configurada"
    echo "3. Se o firewall permite conexões na porta 22"
    exit 1
fi

echo ""
echo "=== INICIANDO DIAGNÓSTICO REMOTO ==="
echo ""

# 1. Informações básicas do sistema
execute_remote "hostname && date && uptime" "Informações do Sistema"

# 2. Verificar serviços essenciais
execute_remote "systemctl status redis postgresql nginx --no-pager -l" "Status dos Serviços"

# 3. Verificar processos Node.js e PM2
execute_remote "ps aux | grep -E '(node|pm2)' | grep -v grep" "Processos Node.js"

# 4. Verificar portas em uso
execute_remote "netstat -tlnp | grep -E ':(3000|4000|5432|6379|80|443)'" "Portas em Uso"

# 5. Verificar logs recentes do PM2
execute_remote "pm2 status && pm2 logs --lines 20 --nostream" "Status e Logs PM2"

# 6. Verificar arquivos de configuração
execute_remote "find /var/www /opt /home -name '.env' -type f 2>/dev/null | head -5" "Localizar arquivos .env"

# 7. Verificar configuração do Nginx
execute_remote "nginx -t && ls -la /etc/nginx/sites-*/zapclic* 2>/dev/null" "Configuração Nginx"

# 8. Verificar logs de erro
execute_remote "tail -20 /var/log/nginx/error.log 2>/dev/null" "Logs de Erro Nginx"

# 9. Testar conectividade Redis
execute_remote "redis-cli ping 2>/dev/null || echo 'Redis não responde'" "Teste Redis"

# 10. Verificar espaço em disco e memória
execute_remote "df -h && echo '---' && free -h" "Recursos do Sistema"

# 11. Testar URLs localmente
execute_remote "curl -I http://localhost:4000/health 2>/dev/null | head -1" "Teste Backend Local"
execute_remote "curl -I http://localhost:3000 2>/dev/null | head -1" "Teste Frontend Local"

# 12. Verificar se existe arquivo .env no backend
execute_remote "ls -la /var/www/zapclic/backend/.env 2>/dev/null || echo 'Arquivo .env não encontrado'" "Verificar .env Backend"

echo ""
echo "=== OPÇÕES DE CORREÇÃO REMOTA ==="
echo ""

echo "Para executar correções automáticas, escolha uma opção:"
echo "1. Transferir e executar diagnóstico completo"
echo "2. Transferir e executar correção automática"
echo "3. Executar comandos manuais específicos"
echo ""

read -p "Digite sua opção (1-3) ou Enter para pular: " option

case $option in
    1)
        if [ -f "diagnose-production.sh" ]; then
            transfer_and_execute "diagnose-production.sh" "Diagnóstico Completo"
        else
            echo "Arquivo diagnose-production.sh não encontrado"
        fi
        ;;
    2)
        if [ -f "fix-production-error500.sh" ]; then
            transfer_and_execute "fix-production-error500.sh" "Correção Automática"
        else
            echo "Arquivo fix-production-error500.sh não encontrado"
        fi
        ;;
    3)
        echo "Comandos manuais úteis:"
        echo "ssh root@72.60.57.22 'systemctl restart redis postgresql nginx'"
        echo "ssh root@72.60.57.22 'pm2 restart all'"
        echo "ssh root@72.60.57.22 'pm2 logs backend --lines 50'"
        ;;
    *)
        echo "Diagnóstico concluído. Analise os resultados acima."
        ;;
esac

echo ""
echo "=== RESUMO ==="
echo "Diagnóstico remoto concluído em $(date)"
echo "Servidor: $SERVER_IP"
echo ""
echo "Próximos passos recomendados:"
echo "1. Analise os logs do PM2 para erros específicos"
echo "2. Verifique se o arquivo .env existe e está configurado"
echo "3. Confirme se Redis e PostgreSQL estão rodando"
echo "4. Teste o acesso direto: https://apizap.meulink.lat/auth/login"
echo "5. Execute a correção automática se necessário"

echo ""
echo "Para conectar diretamente ao servidor:"
echo "ssh root@72.60.57.22"