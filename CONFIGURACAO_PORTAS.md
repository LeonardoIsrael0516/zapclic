# Configuração de Portas - ZapClic

## Problema Identificado
O sistema tinha configurações inconsistentes de porta, com alguns arquivos usando 8080 e outros usando 4000, causando problemas de conexão entre frontend e backend em produção.

## Mudanças Realizadas

### 1. Arquivos de Configuração Atualizados

#### Backend:
- ✅ `.env` - Já configurado com PORT=4000
- ✅ `.env.example` - Atualizado de 8080 para 4000
- ✅ `src/controllers/CaktoWebhookController.ts` - Porta padrão alterada para 4000
- ✅ `dist/controllers/CaktoWebhookController.js` - Porta padrão alterada para 4000

#### Frontend:
- ✅ `.env` - Criado com REACT_APP_BACKEND_URL=http://localhost:4000
- ✅ `server.js` - URLs padrão alteradas de 8080 para 4000
- ✅ `src/services/api.js` - Já usa process.env.REACT_APP_BACKEND_URL

#### Arquivos de Teste:
- ✅ `test-flow-config.js` - URLs alteradas para porta 4000
- ✅ `test-flow-import.js` - URLs alteradas para porta 4000
- ✅ `backend/test-socket-direct-emission.js` - URL alterada para porta 4000
- ✅ `backend/test-frontend-token.js` - URL alterada para porta 4000
- ✅ `backend/test-notification-flow.js` - URLs alteradas para porta 4000

### 2. Configuração para Produção

#### No Servidor de Produção (72.60.57.22):

1. **Backend (.env)**:
   ```
   PORT=4000
   BACKEND_URL=http://72.60.57.22:4000
   ```

2. **Frontend (.env)**:
   ```
   REACT_APP_BACKEND_URL=http://72.60.57.22:4000
   ```

### 3. Verificações Necessárias

#### Desenvolvimento Local:
- Backend deve rodar na porta 4000: `npm run dev:server`
- Frontend deve rodar na porta 3000: `npm start`
- Verificar se REACT_APP_BACKEND_URL aponta para http://localhost:4000

#### Produção:
- Backend deve rodar na porta 4000
- Frontend deve apontar para http://72.60.57.22:4000
- Verificar se o firewall permite acesso à porta 4000
- Verificar se o Nginx está configurado para proxy reverso na porta 4000

### 4. Comandos de Verificação

```bash
# Verificar se o backend está rodando na porta 4000
netstat -tlnp | grep :4000

# Testar conexão com o backend
curl http://localhost:4000/api/health

# No frontend, verificar variável de ambiente
echo $REACT_APP_BACKEND_URL
```

### 5. Próximos Passos

1. **Reiniciar os serviços** após as mudanças
2. **Testar o login** para verificar se a conexão está funcionando
3. **Verificar logs** do backend e frontend para erros de conexão
4. **Atualizar configuração do Nginx** se necessário

### 6. Arquivos que NÃO foram alterados

- `scripts/install-nginx.sh` - Contém referência informativa sobre macOS usar porta 8080
- `frontend/src/components/ColorPicker/index.js` - Cor #808080 (não relacionado à porta)
- `check-server-status.sh` - Script de verificação que monitora múltiplas portas

## Resumo

Todas as configurações agora usam consistentemente a **porta 4000** para o backend, eliminando conflitos e garantindo que o frontend se conecte corretamente ao backend tanto em desenvolvimento quanto em produção.