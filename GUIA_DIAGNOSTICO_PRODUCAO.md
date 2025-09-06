# Guia de Diagnóstico para Erro 500 em Produção

## Problema Identificado
- **Erro 500** ao acessar `apizap.meulink.lat/auth/login`
- **Erro no frontend**: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde"
- **Local**: Servidor VPS de produção (não local)

## Scripts de Diagnóstico Criados

### Para Servidores Linux/Ubuntu
```bash
# Fazer upload do arquivo para o servidor
scp diagnose-production.sh usuario@servidor:/tmp/

# Conectar ao servidor e executar
ssh usuario@servidor
chmod +x /tmp/diagnose-production.sh
sudo /tmp/diagnose-production.sh
```

### Para Servidores Windows
```powershell
# Fazer upload do arquivo para o servidor
# Executar no servidor via RDP ou PowerShell remoto
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\diagnose-production.ps1
```

## Principais Causas Prováveis do Erro 500

Baseado na análise anterior, as causas mais prováveis são:

### 1. **Problema de Conexão com Redis** (Mais Provável)
- Redis não está rodando no servidor
- Configuração incorreta da URL do Redis no `.env`
- Firewall bloqueando a porta 6379
- Senha do Redis incorreta

**Verificações:**
```bash
# Verificar se Redis está rodando
sudo systemctl status redis

# Testar conexão
redis-cli ping

# Verificar configuração no .env
grep REDIS /var/www/zapclic/backend/.env
```

### 2. **Problema de Conexão com Banco de Dados**
- PostgreSQL não está rodando
- Credenciais incorretas no `.env`
- Banco de dados não existe
- Migrações não foram executadas

**Verificações:**
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Testar conexão com banco
psql -h localhost -U usuario_db -d nome_db

# Verificar migrações
cd /var/www/zapclic/backend
npm run sequelize db:migrate:status
```

### 3. **Arquivo .env Ausente ou Incorreto**
- Arquivo `.env` não existe no backend
- Variáveis de ambiente incorretas
- URLs mal configuradas

**Verificações:**
```bash
# Verificar se arquivo existe
ls -la /var/www/zapclic/backend/.env

# Verificar variáveis principais
grep -E '^(NODE_ENV|BACKEND_URL|FRONTEND_URL|DB_|REDIS_)' /var/www/zapclic/backend/.env
```

### 4. **Problemas de CORS**
- Frontend e backend em domínios diferentes
- Configuração CORS incorreta
- Headers não configurados no Nginx

## Passos para Resolução

### Passo 1: Executar Diagnóstico
1. Faça upload do script apropriado para seu servidor
2. Execute o script de diagnóstico
3. Analise os resultados

### Passo 2: Verificar Logs em Tempo Real
```bash
# Logs do PM2
pm2 logs backend --lines 50
pm2 logs frontend --lines 50

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Logs do sistema
sudo journalctl -u redis -f
sudo journalctl -u postgresql -f
```

### Passo 3: Correções Mais Comuns

#### Se Redis não estiver rodando:
```bash
sudo systemctl start redis
sudo systemctl enable redis
redis-cli ping
```

#### Se arquivo .env não existir:
```bash
cd /var/www/zapclic/backend
cp .env.example .env
# Editar .env com as configurações corretas
nano .env
```

#### Se houver problema de CORS:
```bash
# Verificar configuração do Nginx
sudo nano /etc/nginx/sites-available/zapclic

# Adicionar headers CORS se necessário
# Reiniciar Nginx
sudo systemctl restart nginx
```

#### Reiniciar serviços após correções:
```bash
# Reiniciar aplicações
pm2 restart backend
pm2 restart frontend

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Passo 4: Testar Após Correções
```bash
# Testar backend diretamente
curl -I http://localhost:4000/health

# Testar endpoint de login
curl -I https://apizap.meulink.lat/auth/login

# Verificar logs após teste
pm2 logs backend --lines 20
```

## Informações Necessárias para Análise

Para uma análise mais precisa, envie:

1. **Resultado completo do script de diagnóstico**
2. **Logs do PM2 do backend** (últimas 50 linhas)
3. **Configuração do Nginx** para o domínio
4. **Arquivo .env do backend** (sem senhas)
5. **Versão do Node.js** no servidor

## Comandos Rápidos de Verificação

```bash
# Status geral dos serviços
sudo systemctl status redis postgresql nginx

# Processos Node.js rodando
ps aux | grep node

# Portas em uso
netstat -tlnp | grep -E ':(3000|4000|5432|6379|80|443)'

# Espaço em disco
df -h

# Memória disponível
free -h
```

## Contato para Suporte

Após executar o diagnóstico, envie os resultados para análise detalhada e resolução específica do problema.

---

**Nota**: Este guia foi criado baseado na análise dos problemas identificados no instalador ZapClic. Execute o diagnóstico primeiro para identificar a causa exata do erro 500.