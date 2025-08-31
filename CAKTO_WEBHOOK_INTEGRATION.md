# Integração Webhook Cakto - ZapClic

## Visão Geral

Esta integração permite que o ZapClic receba notificações automáticas da Cakto quando um pagamento é aprovado, criando automaticamente contas de usuário e atribuindo planos com base no valor pago.

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione no seu arquivo `.env`:

```bash
# CAKTO WEBHOOK
CAKTO_WEBHOOK_SECRET=seu_secret_da_cakto_aqui
```

**Importante:** O `CAKTO_WEBHOOK_SECRET` deve ser o mesmo valor que vem no campo `secret` do payload da Cakto.

### 2. Endpoints Disponíveis

#### 🔒 Webhook de Produção (COM validação de secret)
```
POST /cakto/webhook
```
- **Autenticação:** Valida o campo `secret` do payload
- **Uso:** Para receber webhooks reais da Cakto

#### 🧪 Webhook de Teste (SEM validação de secret)
```
POST /cakto/webhook/test
```
- **Autenticação:** Nenhuma
- **Uso:** Para testes durante desenvolvimento

#### ✅ Verificação de Status
```
GET /cakto/webhook/test
```
- **Retorna:** Status de funcionamento do webhook

## 🧪 Como Testar

### Para testar SEM validação de secret (desenvolvimento):
```bash
curl -X POST http://seu-servidor/cakto/webhook/test \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "amount": 29.90,
      "customer": {
        "name": "Teste Usuario",
        "email": "teste@email.com",
        "phone": "5585999999999"
      },
      "offer": {
        "name": "Plano Teste"
      },
      "status": "paid"
    },
    "event": "purchase_approved"
  }'
```

### Para testar COM validação de secret (produção):
```bash
curl -X POST http://seu-servidor/cakto/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "amount": 29.90,
      "customer": {
        "name": "Teste Usuario",
        "email": "teste@email.com",
        "phone": "5585999999999"
      },
      "offer": {
        "name": "Plano Teste"
      },
      "status": "paid"
    },
    "event": "purchase_approved",
    "secret": "seu_secret_da_cakto_aqui"
  }'
```

## 🔧 Configuração na Cakto

1. Acesse o painel da Cakto
2. Vá em **Configurações > Webhooks**
3. Configure a URL do webhook como: `https://seu-dominio.com/cakto/webhook`
4. Copie o secret gerado e coloque no `.env` como `CAKTO_WEBHOOK_SECRET`

## Como Funciona

### Eventos Monitorados
- `purchase_approved` - Pagamento aprovado

## Estrutura do Payload

O webhook da Cakto envia o seguinte payload:

```json
{
  "data": {
    "id": "dfa3e1a1-6307-4158-b29c-b11586ee4940",
    "amount": 29.90,
    "status": "paid",
    "paidAt": "2025-08-30T15:05:13.651882-03:00",
    "customer": {
      "name": "Nome do Cliente",
      "email": "cliente@email.com",
      "phone": "5585921813661",
      "docType": "cpf",
      "docNumber": "03071296320"
    },
    "product": {
      "id": "ec4290a8-5236-4213-8cbd-70dfc6d80793",
      "name": "Nome do Produto",
      "type": "subscription"
    },
    "subscription": {
      "id": "daf3eaa5-cc8f-468e-b8e6-9aafc1555bb6",
      "status": "active",
      "next_payment_date": "2025-09-29T15:05:17.426535-03:00"
    }
  },
  "event": "purchase_approved",
  "secret": "d98c17f9-76a1-473c-bb18-3b7239a0bd72"
}
```

## Lógica de Processamento

### 1. Validação do Webhook
- Verifica se o evento é `purchase_approved`
- Verifica se o status é `paid`
- Valida campos obrigatórios

### 2. Identificação do Plano
- Busca plano no banco com `value = amount`
- Se não encontrar, retorna erro

### 3. Processamento da Empresa
- Busca empresa existente por email
- **Se existir**: Atualiza plano e data de vencimento
- **Se não existir**: Cria nova empresa + usuário admin

### 4. Criação de Recursos Padrão (somente para novas empresas)
- Configurações padrão do sistema
- Fila de atendimento padrão
- Usuário administrador

## Estrutura dos Planos

Os planos devem estar cadastrados no banco com valores exatos:

```sql
-- Exemplo de planos
INSERT INTO Plans (name, value, users, connections, queues) VALUES
('Básico', 29.90, 3, 1, 3),
('Profissional', 49.90, 5, 3, 5),
('Empresarial', 99.90, 10, 5, 10);
```

## Dados Criados Automaticamente

### Para Nova Empresa:
- **Empresa**: Nome, email, telefone do cliente
- **Usuário Admin**: Mesmo nome/email, senha padrão `zapclic123`
- **Plano**: Baseado no valor pago
- **Validade**: 30 dias a partir do pagamento
- **Fila Padrão**: "Atendimento" com cor #1DCC91
- **Configurações**: Padrões do sistema

### Para Empresa Existente:
- **Atualiza**: Plano e data de vencimento
- **Mantém**: Usuários e configurações existentes

## Endpoints da API

### POST /cakto/webhook
Recebe webhooks da Cakto

**Headers:**
```
Content-Type: application/json
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Webhook processado com sucesso",
  "isNewCompany": true,
  "company": {
    "id": 123,
    "name": "Nome da Empresa",
    "email": "empresa@email.com",
    "plan": "Nome do Plano",
    "planValue": 29.90,
    "dueDate": "2025-09-30 15:05:13"
  },
  "user": {
    "id": 456,
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "profile": "admin"
  }
}
```

### GET /cakto/webhook/test
Testa se o webhook está funcionando

**Response (200):**
```json
{
  "message": "Webhook Cakto funcionando",
  "timestamp": "2025-08-30T18:05:13.000Z",
  "environment": "production"
}
```

## Logs e Monitoramento

Todos os webhooks são registrados na tabela `CaktoWebhookLogs`:

- **orderId**: ID do pedido na Cakto
- **event**: Tipo do evento
- **status**: Status do pagamento
- **amount**: Valor pago
- **customerEmail/Name/Phone**: Dados do cliente
- **payload**: Payload completo do webhook
- **processed**: Se foi processado com sucesso
- **processingStatus**: 'success', 'error', 'pending'
- **processingMessage**: Mensagem detalhada
- **companyId**: ID da empresa criada/atualizada

## Tratamento de Erros

### Plano Não Encontrado
```json
{
  "error": "Nenhum plano encontrado para o valor: R$ 29.90"
}
```

### Payload Inválido
```json
{
  "error": "Payload inválido - campos obrigatórios ausentes"
}
```

### Erro Interno
```json
{
  "error": "Erro interno do servidor ao processar webhook",
  "details": "Mensagem de erro específica"
}
```

## Segurança

1. **Validação de Payload**: Verifica estrutura obrigatória
2. **Logs Completos**: Registra todos os webhooks recebidos
3. **Transações**: Operações em banco são atômicas
4. **Idempotência**: Múltiplos webhooks não criam duplicatas

## Configuração no Ambiente

### Variáveis de Ambiente
```env
NODE_ENV=production
BACKEND_URL=https://seudominio.com
DB_HOST=localhost
DB_NAME=zapclic
DB_USER=usuario
DB_PASS=senha
```

### Executar Migrações
```bash
cd backend
npm run db:migrate
```

## Testes

### Teste Manual do Endpoint
```bash
curl -X GET https://seudominio.com/cakto/webhook/test
```

### Simular Webhook
```bash
curl -X POST https://seudominio.com/cakto/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "id": "test-123",
      "amount": 29.90,
      "status": "paid",
      "paidAt": "2025-08-30T15:05:13.000Z",
      "customer": {
        "name": "Cliente Teste",
        "email": "teste@email.com",
        "phone": "11999999999"
      }
    },
    "event": "purchase_approved"
  }'
```

## Monitoramento

- Verificar logs na tabela `CaktoWebhookLogs`
- Monitorar logs do servidor para erros
- Validar criação de empresas e usuários
- Verificar atribuição correta de planos

---

**Desenvolvido para ZapClic - Sistema de Atendimento via WhatsApp**
