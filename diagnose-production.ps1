# Script de Diagnóstico para Produção ZapClic (Windows)
# Execute este script no servidor VPS Windows para identificar problemas

Write-Host "=== DIAGNÓSTICO DE PRODUÇÃO ZAPCLIC (Windows) ===" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date)" -ForegroundColor White
Write-Host "Servidor: $env:COMPUTERNAME" -ForegroundColor White
Write-Host ""

# Função para log colorido
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host "[ERRO] $message" -ForegroundColor Red
}

function Write-Warning($message) {
    Write-Host "[AVISO] $message" -ForegroundColor Yellow
}

# 1. Verificar serviços essenciais
Write-Info "Verificando serviços essenciais..."

Write-Host "--- Redis ---" -ForegroundColor Yellow
$redisService = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
if ($redisService -and $redisService.Status -eq "Running") {
    Write-Success "Redis está rodando"
    # Testar conexão Redis
    try {
        $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
        if ($redisTest.TcpTestSucceeded) {
            Write-Success "Redis responde na porta 6379"
        } else {
            Write-Error "Redis não responde na porta 6379"
        }
    } catch {
        Write-Warning "Não foi possível testar conexão Redis"
    }
} else {
    Write-Error "Redis não está rodando ou não está instalado"
}

Write-Host ""
Write-Host "--- PostgreSQL ---" -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Success "PostgreSQL está rodando"
} else {
    Write-Error "PostgreSQL não está rodando"
}

Write-Host ""
Write-Host "--- IIS/Nginx ---" -ForegroundColor Yellow
$iisService = Get-Service -Name "W3SVC" -ErrorAction SilentlyContinue
if ($iisService -and $iisService.Status -eq "Running") {
    Write-Success "IIS está rodando"
} else {
    Write-Warning "IIS não está rodando (pode estar usando Nginx)"
}

Write-Host ""
Write-Host "--- PM2 ---" -ForegroundColor Yellow
try {
    $pm2Status = pm2 status 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PM2 está instalado e funcionando"
        pm2 status
    } else {
        Write-Error "PM2 não está funcionando corretamente"
    }
} catch {
    Write-Error "PM2 não está instalado"
}

# 2. Verificar portas
Write-Info "Verificando portas..."
Write-Host "--- Portas em uso ---" -ForegroundColor Yellow
$ports = @(3000, 4000, 5432, 6379, 80, 443)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Success "Porta $port está em uso"
    } else {
        Write-Warning "Porta $port não está em uso"
    }
}

# 3. Verificar arquivos de configuração
Write-Info "Verificando configurações..."

Write-Host "--- Backend .env ---" -ForegroundColor Yellow
$backendEnv = "C:\inetpub\wwwroot\zapclic\backend\.env"
if (Test-Path $backendEnv) {
    Write-Success "Arquivo .env do backend existe"
    Write-Host "Variáveis principais:"
    Get-Content $backendEnv | Select-String -Pattern "^(NODE_ENV|BACKEND_URL|FRONTEND_URL|DB_|REDIS_)" | Select-Object -First 10
} else {
    Write-Error "Arquivo .env do backend não encontrado em $backendEnv"
    # Tentar outros caminhos comuns
    $alternatePaths = @(
        "C:\zapclic\backend\.env",
        "C:\www\zapclic\backend\.env",
        "D:\zapclic\backend\.env"
    )
    foreach ($path in $alternatePaths) {
        if (Test-Path $path) {
            Write-Success "Arquivo .env encontrado em $path"
            Get-Content $path | Select-String -Pattern "^(NODE_ENV|BACKEND_URL|FRONTEND_URL|DB_|REDIS_)" | Select-Object -First 10
            break
        }
    }
}

Write-Host ""
Write-Host "--- Frontend .env ---" -ForegroundColor Yellow
$frontendEnv = "C:\inetpub\wwwroot\zapclic\frontend\.env"
if (Test-Path $frontendEnv) {
    Write-Success "Arquivo .env do frontend existe"
    Write-Host "Variáveis principais:"
    Get-Content $frontendEnv | Select-String -Pattern "^(REACT_APP_|NODE_ENV)" | Select-Object -First 5
} else {
    Write-Error "Arquivo .env do frontend não encontrado em $frontendEnv"
}

# 4. Verificar logs recentes do PM2
Write-Info "Verificando logs recentes..."

Write-Host "--- Logs do PM2 (Backend) ---" -ForegroundColor Yellow
try {
    $pm2List = pm2 list 2>$null
    if ($pm2List -match "backend") {
        pm2 logs backend --lines 20 --nostream
    } else {
        Write-Warning "Processo backend não encontrado no PM2"
    }
} catch {
    Write-Error "Erro ao acessar logs do PM2"
}

Write-Host ""
Write-Host "--- Logs do PM2 (Frontend) ---" -ForegroundColor Yellow
try {
    $pm2List = pm2 list 2>$null
    if ($pm2List -match "frontend") {
        pm2 logs frontend --lines 20 --nostream
    } else {
        Write-Warning "Processo frontend não encontrado no PM2"
    }
} catch {
    Write-Error "Erro ao acessar logs do PM2"
}

# 5. Testar conectividade
Write-Info "Testando conectividade..."

Write-Host "--- Teste Backend ---" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "Backend responde localmente"
    } else {
        Write-Error "Backend retornou código $($response.StatusCode)"
    }
} catch {
    Write-Error "Backend não responde localmente: $($_.Exception.Message)"
}

Write-Host "--- Teste Frontend ---" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "Frontend responde localmente"
    } else {
        Write-Error "Frontend retornou código $($response.StatusCode)"
    }
} catch {
    Write-Error "Frontend não responde localmente: $($_.Exception.Message)"
}

# 6. Verificar recursos do sistema
Write-Info "Verificando recursos do sistema..."

Write-Host "--- Espaço em disco ---" -ForegroundColor Yellow
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}, @{Name="%Free";Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}}

Write-Host ""
Write-Host "--- Memória ---" -ForegroundColor Yellow
$memory = Get-WmiObject -Class Win32_ComputerSystem
$totalMemory = [math]::Round($memory.TotalPhysicalMemory/1GB, 2)
Write-Host "Memória Total: $totalMemory GB"

Write-Host ""
Write-Host "--- Processos Node.js ---" -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, CPU, WorkingSet

Write-Host ""
Write-Host "=== RESUMO DO DIAGNÓSTICO ==="
Write-Host "Execute este relatório e envie os resultados para análise." -ForegroundColor Cyan
Write-Host "Data: $(Get-Date)" -ForegroundColor White
Write-Host "Diagnóstico concluído." -ForegroundColor Green