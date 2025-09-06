-- Script SQL para marcar a migração como executada
-- Execute este script diretamente no PostgreSQL

-- Verificar se a migração já está marcada como executada
SELECT * FROM "SequelizeMeta" WHERE name = '20250111140000-add-missing-columns-flowbuilder.ts';

-- Se não estiver, inserir a entrada
INSERT INTO "SequelizeMeta" (name) 
VALUES ('20250111140000-add-missing-columns-flowbuilder.ts')
ON CONFLICT (name) DO NOTHING;

-- Verificar se as colunas existem na tabela FlowBuilders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'FlowBuilders' 
AND column_name IN ('company_id', 'variables', 'config');

-- Se as colunas não existirem, adicionar manualmente:
-- ALTER TABLE "FlowBuilders" ADD COLUMN IF NOT EXISTS company_id INTEGER NOT NULL DEFAULT 1;
-- ALTER TABLE "FlowBuilders" ADD COLUMN IF NOT EXISTS variables JSON;
-- ALTER TABLE "FlowBuilders" ADD COLUMN IF NOT EXISTS config JSON;