const { QueryInterface, DataTypes } = require('sequelize');
const { Client } = require('pg');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'zapclic',
  user: 'postgres',
  password: '12345678'
};

async function addFlowColumns() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');
    
    // Verificar se as colunas já existem
    const checkColumns = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Whatsapps' 
      AND column_name IN ('flowIdWelcome', 'flowIdNotPhrase')
    `;
    
    const existingColumns = await client.query(checkColumns);
    const columnNames = existingColumns.rows.map(row => row.column_name);
    
    // Adicionar flowIdWelcome se não existir
    if (!columnNames.includes('flowIdWelcome')) {
      await client.query(`
        ALTER TABLE "Whatsapps" 
        ADD COLUMN "flowIdWelcome" INTEGER REFERENCES "FlowBuilders"("id") ON DELETE SET NULL
      `);
      console.log('Coluna flowIdWelcome adicionada com sucesso!');
    } else {
      console.log('Coluna flowIdWelcome já existe');
    }
    
    // Adicionar flowIdNotPhrase se não existir
    if (!columnNames.includes('flowIdNotPhrase')) {
      await client.query(`
        ALTER TABLE "Whatsapps" 
        ADD COLUMN "flowIdNotPhrase" INTEGER REFERENCES "FlowBuilders"("id") ON DELETE SET NULL
      `);
      console.log('Coluna flowIdNotPhrase adicionada com sucesso!');
    } else {
      console.log('Coluna flowIdNotPhrase já existe');
    }
    
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  } finally {
    await client.end();
  }
}

addFlowColumns();