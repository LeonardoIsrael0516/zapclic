const { QueryInterface, DataTypes, Sequelize } = require('sequelize');
const config = require('./dist/config/database.js');

async function fixMigration() {
  console.log('🔧 Iniciando correção da migração...');
  
  // Conectar ao banco
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false
  });
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('📋 Verificando estrutura da tabela FlowBuilders...');
    const tableDescription = await queryInterface.describeTable('FlowBuilders');
    
    console.log('Colunas existentes:', Object.keys(tableDescription));
    
    const promises = [];
    
    // Verificar e adicionar company_id se não existir
    if (!tableDescription.company_id) {
      console.log('➕ Adicionando coluna company_id...');
      promises.push(
        queryInterface.addColumn('FlowBuilders', 'company_id', {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1
        })
      );
    } else {
      console.log('✅ Coluna company_id já existe');
    }
    
    // Verificar e adicionar variables se não existir
    if (!tableDescription.variables) {
      console.log('➕ Adicionando coluna variables...');
      promises.push(
        queryInterface.addColumn('FlowBuilders', 'variables', {
          type: DataTypes.JSON,
          allowNull: true
        })
      );
    } else {
      console.log('✅ Coluna variables já existe');
    }
    
    // Verificar e adicionar config se não existir
    if (!tableDescription.config) {
      console.log('➕ Adicionando coluna config...');
      promises.push(
        queryInterface.addColumn('FlowBuilders', 'config', {
          type: DataTypes.JSON,
          allowNull: true
        })
      );
    } else {
      console.log('✅ Coluna config já existe');
    }
    
    if (promises.length > 0) {
      console.log(`🔄 Executando ${promises.length} operação(ões)...`);
      await Promise.all(promises);
      console.log('✅ Colunas adicionadas com sucesso!');
    } else {
      console.log('✅ Todas as colunas já existem, nenhuma ação necessária');
    }
    
    // Marcar migração como executada
    console.log('📝 Marcando migração como executada...');
    await queryInterface.bulkInsert('SequelizeMeta', [
      { name: '20250111140000-add-missing-columns-flowbuilder.ts' }
    ], {
      ignoreDuplicates: true
    });
    
    console.log('🎉 Migração corrigida com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir migração:', error.message);
    if (error.original) {
      console.error('Erro original:', error.original.message);
    }
  } finally {
    await sequelize.close();
  }
}

fixMigration();