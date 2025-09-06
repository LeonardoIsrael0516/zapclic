# Script PowerShell para Diagnóstico Remoto do Servidor de Produção
# Servidor: 72.60.57.22
# Usuário: root

$ServerIP = "72.60.57.22"
$ServerUser = "root"
$SSHConnection = "$ServerUser@$ServerIP"

Write-Host "=== DIAGNÓSTICO REMOTO ZAPCLIC ===" -ForegroundColor Cyan
Write-Host "Servidor: $ServerIP" -ForegroundColor White
Write-Host "Usuário: $ServerUser" -ForegroundColor White
Write-Host "Data: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Função para executar comandos SSH
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "--- $Description ---" -ForegroundColor Yellow
    try {
        $result = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SSHConnection $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host $result -ForegroundColor Green
        } else {
            Write-Host "Erro ao executar comando" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
    } catch {
        Write-Host "Erro na conexão SSH: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Função para transferir e executar script
function Transfer-AndExecute {
    param(
        [string]$ScriptName,
        [string]$Description
    )
    
    Write-Host "--- $Description ---" -ForegroundColor Yellow
    
    if (Test-Path $ScriptName) {
        Write-Host "Transferindo $ScriptName..." -ForegroundColor Blue
        
        try {
            scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no $ScriptName "${SSHConnection}:/tmp/"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Script transferido com sucesso" -ForegroundColor Green
                
                # Executar script
                Write-Host "Executando script..." -ForegroundColor Blue
                ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SSHConnection "chmod +x /tmp/$ScriptName && /tmp/$ScriptName"
            } else {
                Write-Host "Erro ao transferir script" -ForegroundColor Red
            }
        } catch {
            Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Arquivo $ScriptName não encontrado" -ForegroundColor Red
    }
    Write-Host ""
}

# Verificar se SSH está disponível
Write-Host "Verificando disponibilidade do SSH..." -ForegroundColor Blue
try {
    $sshVersion = ssh -V 2>&1
    Write-Host "✓ SSH disponível: $sshVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ SSH não está disponível. Instale o OpenSSH Client." -ForegroundColor Red
    Write-Host "Execute: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Yellow
    exit 1
}

# Verificar conectividade
Write-Host "Verificando conectividade com o servidor..." -ForegroundColor Blue
$pingResult = Test-NetConnection -ComputerName $ServerIP -Port 22 -WarningAction SilentlyContinue

if ($pingResult.TcpTestSucceeded) {
    Write-Host "✓ Servidor responde na porta 22 (SSH)" -ForegroundColor Green
} else {
    Write-Host "✗ Servidor não responde na porta 22" -ForegroundColor Red
    Write-Host "Verifique se o servidor está online e o SSH está rodando" -ForegroundColor Yellow
    exit 1
}

# Testar conexão SSH
Write-Host "Testando conexão SSH..." -ForegroundColor Blue
try {
    $sshTest = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SSHConnection "echo 'Conexão SSH OK'"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Conexão SSH estabelecida" -ForegroundColor Green
    } else {
        Write-Host "✗ Falha na conexão SSH" -ForegroundColor Red
        Write-Host "Verifique as credenciais e configuração SSH" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Erro na conexão SSH: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== INICIANDO DIAGNÓSTICO REMOTO ===" -ForegroundColor Cyan
Write-Host ""

# 1. Informações básicas do sistema
Invoke-SSHCommand "hostname && date && uptime" "Informações do Sistema"

# 2. Verificar serviços essenciais
Invoke-SSHCommand "systemctl status redis postgresql nginx --no-pager -l" "Status dos Serviços"

# 3. Verificar processos Node.js e PM2
Invoke-SSHCommand "ps aux | grep -E '(node|pm2)' | grep -v grep" "Processos Node.js"

# 4. Verificar portas em uso
Invoke-SSHCommand "netstat -tlnp | grep -E ':(3000|4000|5432|6379|80|443)'" "Portas em Uso"

# 5. Verificar PM2
Invoke-SSHCommand "pm2 status" "Status PM2"

# 6. Verificar logs recentes do backend
Invoke-SSHCommand "pm2 logs backend --lines 20 --nostream 2>/dev/null || echo 'Backend não encontrado no PM2'" "Logs Backend"

# 7. Verificar arquivos .env
Invoke-SSHCommand "find /var/www /opt /home -name '.env' -type f 2>/dev/null | head -5" "Localizar arquivos .env"

# 8. Verificar configuração do Nginx
Invoke-SSHCommand "nginx -t 2>&1 && ls -la /etc/nginx/sites-*/zapclic* 2>/dev/null" "Configuração Nginx"

# 9. Verificar logs de erro do Nginx
Invoke-SSHCommand "tail -20 /var/log/nginx/error.log 2>/dev/null || echo 'Log do Nginx não encontrado'" "Logs de Erro Nginx"

# 10. Testar Redis
Invoke-SSHCommand "redis-cli ping 2>/dev/null || echo 'Redis não responde'" "Teste Redis"

# 11. Verificar recursos do sistema
Invoke-SSHCommand "df -h && echo '---' && free -h" "Recursos do Sistema"

# 12. Testar URLs localmente
Invoke-SSHCommand "curl -I http://localhost:4000/health 2>/dev/null | head -1 || echo 'Backend não responde'" "Teste Backend Local"
Invoke-SSHCommand "curl -I http://localhost:3000 2>/dev/null | head -1 || echo 'Frontend não responde'" "Teste Frontend Local"

# 13. Verificar arquivo .env específico
Invoke-SSHCommand "ls -la /var/www/zapclic/backend/.env 2>/dev/null || echo 'Arquivo .env do backend não encontrado'" "Verificar .env Backend"

# 14. Verificar variáveis críticas do .env
Invoke-SSHCommand "grep -E '^(REDIS_|DB_|NODE_ENV)' /var/www/zapclic/backend/.env 2>/dev/null | head -10 || echo 'Não foi possível ler .env'" "Variáveis Críticas"

Write-Host ""
Write-Host "=== OPÇÕES DE CORREÇÃO REMOTA ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Escolha uma opção para continuar:" -ForegroundColor White
Write-Host "1. Executar diagnóstico completo (diagnose-production.sh)" -ForegroundColor Yellow
Write-Host "2. Executar correção automática (fix-production-error500.sh)" -ForegroundColor Yellow
Write-Host "3. Comandos manuais específicos" -ForegroundColor Yellow
Write-Host "4. Conectar diretamente via SSH" -ForegroundColor Yellow
Write-Host "5. Sair" -ForegroundColor Yellow
Write-Host ""

$option = Read-Host "Digite sua opção (1-5)"

switch ($option) {
    "1" {
        Transfer-AndExecute "diagnose-production.sh" "Diagnóstico Completo"
    }
    "2" {
        Transfer-AndExecute "fix-production-error500.sh" "Correção Automática"
    }
    "3" {
        Write-Host "Comandos manuais úteis:" -ForegroundColor Cyan
        Write-Host "ssh root@72.60.57.22 'systemctl restart redis postgresql nginx'" -ForegroundColor White
        Write-Host "ssh root@72.60.57.22 'pm2 restart all'" -ForegroundColor White
        Write-Host "ssh root@72.60.57.22 'pm2 logs backend --lines 50'" -ForegroundColor White
        Write-Host "ssh root@72.60.57.22 'tail -f /var/log/nginx/error.log'" -ForegroundColor White
        
        Write-Host ""
        $manualCmd = Read-Host "Digite um comando para executar (ou Enter para pular)"
        if ($manualCmd) {
            Invoke-SSHCommand $manualCmd "Comando Manual"
        }
    }
    "4" {
        Write-Host "Conectando diretamente ao servidor..." -ForegroundColor Green
        Write-Host "Para sair da sessão SSH, digite 'exit'" -ForegroundColor Yellow
        ssh $SSHConnection
    }
    default {
        Write-Host "Diagnóstico concluído." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== RESUMO ===" -ForegroundColor Cyan
Write-Host "Diagnóstico remoto concluído em $(Get-Date)" -ForegroundColor White
Write-Host "Servidor: $ServerIP" -ForegroundColor White
Write-Host ""
Write-Host "Próximos passos recomendados:" -ForegroundColor Yellow
Write-Host "1. Analise os logs do PM2 para erros específicos" -ForegroundColor White
Write-Host "2. Verifique se o arquivo .env existe e está configurado" -ForegroundColor White
Write-Host "3. Confirme se Redis e PostgreSQL estão rodando" -ForegroundColor White
Write-Host "4. Teste o acesso direto: https://apizap.meulink.lat/auth/login" -ForegroundColor White
Write-Host "5. Execute a correção automática se necessário" -ForegroundColor White

Write-Host ""
Write-Host "Para conectar diretamente ao servidor:" -ForegroundColor Cyan
Write-Host "ssh root@72.60.57.22" -ForegroundColor Green