# Script PowerShell para conectar ao servidor de produção e transferir scripts
# Servidor: 31.97.91.232
# Usuário: root
# Senha: Da05As02He02@

Write-Host "=== CONEXÃO COM SERVIDOR DE PRODUÇÃO ===" -ForegroundColor Green
Write-Host "Servidor: 31.97.91.232" -ForegroundColor Yellow
Write-Host "Usuário: root" -ForegroundColor Yellow
Write-Host "Senha: Da05As02He02@" -ForegroundColor Yellow
Write-Host ""

# Verificar se o SSH está disponível
if (Get-Command ssh -ErrorAction SilentlyContinue) {
    Write-Host "SSH encontrado. Preparando conexão..." -ForegroundColor Green
} else {
    Write-Host "SSH não encontrado. Instale o OpenSSH ou use PuTTY." -ForegroundColor Red
    exit 1
}

# Função para transferir arquivos via SCP
function Transfer-Scripts {
    Write-Host "\n=== TRANSFERINDO SCRIPTS PARA O SERVIDOR ===" -ForegroundColor Green
    
    $scripts = @(
        "fix-production-server.sh",
        "fix-production-flows.sh", 
        "restart-production.sh"
    )
    
    foreach ($script in $scripts) {
        if (Test-Path $script) {
            Write-Host "Transferindo $script..." -ForegroundColor Yellow
            scp $script root@31.97.91.232:/tmp/
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ $script transferido com sucesso" -ForegroundColor Green
            } else {
                Write-Host "✗ Erro ao transferir $script" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ Arquivo $script não encontrado" -ForegroundColor Red
        }
    }
}

# Função para conectar via SSH
function Connect-SSH {
    Write-Host "\n=== CONECTANDO VIA SSH ===" -ForegroundColor Green
    Write-Host "Executando: ssh root@31.97.91.232" -ForegroundColor Yellow
    Write-Host "Digite a senha quando solicitado: Da05As02He02@" -ForegroundColor Yellow
    Write-Host ""
    
    # Conectar via SSH
    ssh root@31.97.91.232
}

# Menu de opções
Write-Host "=== OPÇÕES DISPONÍVEIS ===" -ForegroundColor Cyan
Write-Host "1. Transferir scripts para o servidor"
Write-Host "2. Conectar via SSH"
Write-Host "3. Transferir scripts E conectar via SSH"
Write-Host "4. Mostrar comandos manuais"
Write-Host ""

$choice = Read-Host "Escolha uma opção (1-4)"

switch ($choice) {
    "1" {
        Transfer-Scripts
    }
    "2" {
        Connect-SSH
    }
    "3" {
        Transfer-Scripts
        Write-Host "\nPressione qualquer tecla para conectar via SSH..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Connect-SSH
    }
    "4" {
        Write-Host "\n=== COMANDOS MANUAIS ===" -ForegroundColor Cyan
        Write-Host "1. Transferir scripts:"
        Write-Host "   scp fix-production-server.sh root@31.97.91.232:/tmp/"
        Write-Host "   scp fix-production-flows.sh root@31.97.91.232:/tmp/"
        Write-Host "   scp restart-production.sh root@31.97.91.232:/tmp/"
        Write-Host ""
        Write-Host "2. Conectar via SSH:"
        Write-Host "   ssh root@31.97.91.232"
        Write-Host "   Senha: Da05As02He02@"
        Write-Host ""
        Write-Host "3. No servidor, executar:"
        Write-Host "   chmod +x /tmp/*.sh"
        Write-Host "   /tmp/restart-production.sh"
        Write-Host ""
    }
    default {
        Write-Host "Opção inválida. Saindo..." -ForegroundColor Red
    }
}

Write-Host "\n=== COMANDOS PARA EXECUTAR NO SERVIDOR ===" -ForegroundColor Green
Write-Host "Após conectar via SSH, execute:"
Write-Host "1. chmod +x /tmp/*.sh"
Write-Host "2. /tmp/restart-production.sh (para reinicialização rápida)"
Write-Host "3. /tmp/fix-production-server.sh (para diagnóstico completo)"
Write-Host "4. /tmp/fix-production-flows.sh (para correção de migração)"
Write-Host ""