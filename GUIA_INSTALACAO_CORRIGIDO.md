# 🚀 Guia de Instalação Corrigido - ZapClic

## 📋 Pré-requisitos

### Sistema Operacional
- Ubuntu 20.04 LTS ou superior
- Debian 10 ou superior
- CentOS 8 ou superior

### Recursos Mínimos
- **RAM**: 4GB (recomendado: 8GB)
- **CPU**: 2 cores (recomendado: 4 cores)
- **Disco**: 20GB livres (recomendado: 50GB)
- **Rede**: Conexão estável com internet

### Dependências Obrigatórias

#### 1. Node.js (versão 18+)
```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # deve mostrar v18.x.x ou superior
npm --version
```

#### 2. PostgreSQL (versão 12+)
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar senha do usuário postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'sua_senha_aqui';"

# Verificar instalação
sudo -u postgres psql -c "SELECT version();"
```

#### 3. Redis (via Docker)
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar:
newgrp docker

# Verificar instalação
docker --version
```

#### 4. Nginx
```bash
# Instalar Nginx
sudo apt update
sudo apt install -y nginx

# Iniciar serviço
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar instalação
sudo systemctl status nginx
```

#### 5. PM2
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalação
pm2 --version
```

#### 6. Certbot (para SSL)
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Verificar instalação
certbot --version
```

## 🔧 Preparação do Sistema

### 1. Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common
```

### 2. Configurar Firewall
```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 3. Configurar Limites do Sistema
```bash
# Aumentar limites de arquivo
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

## 📥 Download e Preparação

### 1. Clonar Repositório
```bash
# Clonar o projeto
git clone https://github.com/seu-usuario/zapclic.git
cd zapclic
```

### 2. Usar Instalador Corrigido
```bash
# Copiar arquivos corrigidos
cp instalador-corrigido/_backend-fixed.sh instalador/lib/_backend.sh
cp instalador-corrigido/_frontend-fixed.sh instalador/lib/_frontend.sh
cp instalador-corrigido/_system-fixed.sh instalador/lib/_system.sh
cp instalador-corrigido/_inquiry-fixed.sh instalador/lib/_inquiry.sh

# Dar permissões de execução
chmod +x instalador/install_primaria
chmod +x instalador/lib/*.sh
```

## 🚀 Instalação

### 1. Executar Diagnóstico Pré-Instalação
```bash
# Executar diagnóstico
bash diagnose-installation.sh

# Corrigir problemas encontrados se necessário
bash fix-installation-issues.sh
```

### 2. Executar Instalação Principal
```bash
# Navegar para o diretório do instalador
cd instalador

# Executar instalação
sudo bash install_primaria
```

### 3. Seguir o Assistente

O instalador irá solicitar as seguintes informações:

#### Configurações do Banco de Dados
- **Senha do PostgreSQL**: A senha configurada anteriormente

#### Configurações da Instância
- **Nome da instância**: Nome único (ex: `empresa1`)
- **Conexões simultâneas**: Número máximo (padrão: 100)
- **Usuários máximos**: Limite de usuários (padrão: 10)
- **WhatsApp máximos**: Limite de conexões WhatsApp (padrão: 5)

#### Configurações de Rede
- **URL do Frontend**: `https://app.seudominio.com`
- **Porta do Frontend**: `3000` (padrão)
- **URL do Backend**: `https://api.seudominio.com`
- **Porta do Backend**: `4000` (padrão)
- **Email para SSL**: Seu email para certificados Let's Encrypt

## ✅ Verificação Pós-Instalação

### 1. Verificar Serviços
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar Nginx
sudo systemctl status nginx

# Verificar Redis (Docker)
docker ps | grep redis

# Verificar PM2
sudo -u deploy pm2 list
```

### 2. Testar Conectividade
```bash
# Testar backend
curl -I http://localhost:4000/health

# Testar frontend
curl -I http://localhost:3000/health

# Testar Redis
docker exec nome_instancia_redis redis-cli ping
```

### 3. Verificar Logs
```bash
# Logs do backend
sudo -u deploy pm2 logs nome_instancia-backend

# Logs do frontend
sudo -u deploy pm2 logs nome_instancia-frontend

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Configuração SSL

### 1. Configurar DNS
Antes de configurar SSL, certifique-se de que:
- O domínio aponta para o IP do servidor
- Os subdomínios (app.dominio.com, api.dominio.com) estão configurados

### 2. Gerar Certificados
```bash
# Para o frontend
sudo certbot --nginx -d app.seudominio.com

# Para o backend
sudo certbot --nginx -d api.seudominio.com
```

### 3. Configurar Renovação Automática
```bash
# Testar renovação
sudo certbot renew --dry-run

# Configurar cron para renovação automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🔧 Solução de Problemas Comuns

### 1. Erro de Conexão Frontend-Backend

**Sintomas**: Frontend não consegue se conectar ao backend

**Soluções**:
```bash
# Verificar configuração CORS no backend
grep -r "cors" /home/deploy/nome_instancia/backend/

# Verificar URLs no .env do frontend
cat /home/deploy/nome_instancia/frontend/.env

# Corrigir URLs se necessário
sudo -u deploy nano /home/deploy/nome_instancia/frontend/.env

# Recompilar frontend
sudo -u deploy bash -c "cd /home/deploy/nome_instancia/frontend && npm run build"

# Reiniciar serviços
sudo -u deploy pm2 restart nome_instancia-frontend
sudo -u deploy pm2 restart nome_instancia-backend
```

### 2. Erro de Banco de Dados

**Sintomas**: Backend não consegue conectar ao banco

**Soluções**:
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
PGPASSWORD="sua_senha" psql -h localhost -U postgres -c "\l"

# Verificar configuração do backend
cat /home/deploy/nome_instancia/backend/.env | grep DB_

# Executar migrações se necessário
sudo -u deploy bash -c "cd /home/deploy/nome_instancia/backend && npm run db:migrate"
```

### 3. Erro de Redis

**Sintomas**: Erro de conexão com Redis

**Soluções**:
```bash
# Verificar container Redis
docker ps | grep redis

# Reiniciar Redis se necessário
docker restart nome_instancia_redis

# Testar conexão
docker exec nome_instancia_redis redis-cli ping
```

### 4. Problemas de Permissão

**Sintomas**: Erros de permissão de arquivo

**Soluções**:
```bash
# Corrigir permissões
sudo chown -R deploy:deploy /home/deploy/nome_instancia
sudo chmod -R 755 /home/deploy/nome_instancia

# Corrigir permissões específicas
sudo chmod +x /home/deploy/nome_instancia/backend/node_modules/.bin/*
```

## 📊 Monitoramento

### 1. Configurar Monitoramento PM2
```bash
# Instalar PM2 Plus (opcional)
sudo -u deploy pm2 install pm2-server-monit

# Configurar logs
sudo -u deploy pm2 install pm2-logrotate
```

### 2. Configurar Logs do Nginx
```bash
# Configurar logrotate para Nginx
sudo nano /etc/logrotate.d/nginx
```

### 3. Script de Monitoramento
```bash
# Criar script de monitoramento
cat > /home/deploy/monitor.sh << 'EOF'
#!/bin/bash
echo "=== Status dos Serviços ==="
systemctl status postgresql --no-pager -l
systemctl status nginx --no-pager -l
docker ps | grep redis
pm2 list
EOF

chmod +x /home/deploy/monitor.sh
```

## 🔄 Backup e Manutenção

### 1. Script de Backup
```bash
# Criar script de backup
cat > /home/deploy/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups/$DATE"

mkdir -p $BACKUP_DIR

# Backup do banco de dados
pg_dump -h localhost -U postgres nome_instancia > $BACKUP_DIR/database.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files.tar.gz /home/deploy/nome_instancia

echo "Backup criado em: $BACKUP_DIR"
EOF

chmod +x /home/deploy/backup.sh
```

### 2. Configurar Backup Automático
```bash
# Adicionar ao crontab
echo "0 2 * * * /home/deploy/backup.sh" | sudo -u deploy crontab -
```

## 📞 Suporte

Se você encontrar problemas durante a instalação:

1. **Execute o diagnóstico**: `bash diagnose-installation.sh`
2. **Verifique os logs**: Consulte os logs dos serviços
3. **Consulte a documentação**: Revise este guia
4. **Execute correções**: Use `bash fix-installation-issues.sh`

## 🎯 Checklist Final

- [ ] Todos os pré-requisitos instalados
- [ ] Sistema atualizado
- [ ] Firewall configurado
- [ ] Repositório clonado
- [ ] Instalador executado com sucesso
- [ ] Serviços rodando (PostgreSQL, Nginx, Redis, PM2)
- [ ] Frontend e Backend respondendo
- [ ] SSL configurado (se aplicável)
- [ ] Backup configurado
- [ ] Monitoramento ativo

---

**✅ Instalação Concluída com Sucesso!**

Seu sistema ZapClic está pronto para uso. Acesse através das URLs configuradas e comece a usar a plataforma.

**Próximos Passos**:
1. Configurar usuários administrativos
2. Configurar integrações WhatsApp
3. Personalizar configurações da empresa
4. Treinar equipe de atendimento