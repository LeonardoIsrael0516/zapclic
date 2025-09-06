# Solução para Erro de Migração - ZapClic

## Problema Identificado
A migração `20250111140000-add-missing-columns-flowbuilder` está falhando com o erro:
```
ERROR: column "company_id" of relation "FlowBuilders" already exists
```

## Causa
A migração foi parcialmente executada ou as colunas já existem na tabela, mas a migração não foi marcada como concluída na tabela `SequelizeMeta`.

## Soluções Implementadas

### 1. Migração Corrigida
✅ **Arquivo corrigido**: `src/database/migrations/20250111140000-add-missing-columns-flowbuilder.ts`
- Adicionadas verificações condicionais para evitar duplicação de colunas
- Corrigidos tipos TypeScript

### 2. Scripts de Correção Criados

#### `fix-migration-direct.js`
- Corrige automaticamente a migração compilada em JavaScript
- Adiciona tratamento de erros robusto
- **Status**: ✅ Executado com sucesso

#### `mark-migration-complete.sql`
- Script SQL para marcar a migração como executada manualmente
- Inclui verificações de estrutura da tabela

### 3. Problema de Autenticação PostgreSQL
❌ **Problema identificado**: Falha de autenticação com usuário `postgres`

**Configuração atual (.env)**:
```
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_PORT=5432
```

## Próximos Passos

### Opção 1: Corrigir Autenticação PostgreSQL
1. Verificar se o PostgreSQL está configurado para aceitar conexões com senha
2. Verificar arquivo `pg_hba.conf`
3. Reiniciar serviço PostgreSQL se necessário

### Opção 2: Executar Script SQL Manualmente
1. Conectar ao PostgreSQL usando cliente gráfico (pgAdmin, DBeaver, etc.)
2. Executar o conteúdo do arquivo `mark-migration-complete.sql`
3. Verificar se as colunas existem na tabela `FlowBuilders`

### Opção 3: Usar Cliente PostgreSQL
Se o `psql` estiver disponível:
```bash
psql -U postgres -d zapclic -f mark-migration-complete.sql
```

## Verificação Final
Após resolver o problema de autenticação, execute:
```bash
npx sequelize-cli db:migrate
```

## Arquivos Criados/Modificados
- ✅ `src/database/migrations/20250111140000-add-missing-columns-flowbuilder.ts` (corrigido)
- ✅ `fix-migration-direct.js` (script de correção)
- ✅ `mark-migration-complete.sql` (script SQL manual)
- ✅ `SOLUCAO_MIGRACAO.md` (este guia)

## Status do Sistema
- ✅ Migração corrigida e preparada
- ✅ Scripts de correção criados
- ⚠️ Aguardando resolução de autenticação PostgreSQL
- ✅ Backend e Frontend rodando nas portas corretas (4000 e 3000)