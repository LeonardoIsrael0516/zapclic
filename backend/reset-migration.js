const { QueryInterface, DataTypes, Sequelize } = require('sequelize');
const config = require('./dist/config/database.js');

async function resetMigration() {
  console.log('🔄 Resetando migração problemática...');
  
  // Conectar ao banco
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false
  });
  
  try {
    console.log('🗑️ Removendo entrada da migração da tabela SequelizeMeta...');
    
    await sequelize.query(
      "DELETE FROM \"SequelizeMeta\" WHERE name = '20250111140000-add-missing-columns-flowbuilder.ts'",
      { type: sequelize.QueryTypes.DELETE }
    );
    
    console.log('✅ Migração removida da tabela SequelizeMeta');
    console.log('📝 Agora você pode executar: npx sequelize-cli db:migrate');
    
  } catch (error) {
    console.error('❌ Erro ao resetar migração:', error.message);
    if (error.original) {
      console.error('Erro original:', error.original.message);
    }
    
    // Se der erro de autenticação, vamos tentar uma abordagem diferente
    if (error.message.includes('autentica') || error.message.includes('password')) {
      console.log('\n🔧 Problema de autenticação detectado!');
      console.log('\n📋 Soluções possíveis:');
      console.log('1. Verificar se o PostgreSQL está configurado corretamente');
      console.log('2. Verificar as credenciais no arquivo .env');
      console.log('3. Executar manualmente no PostgreSQL:');
      console.log('   DELETE FROM "SequelizeMeta" WHERE name = \'20250111140000-add-missing-columns-flowbuilder.ts\';');
      console.log('\n4. Ou alterar temporariamente a migração para verificar se as colunas já existem');
    }
  } finally {
    await sequelize.close();
  }
}

resetMigration();