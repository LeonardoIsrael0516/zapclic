const { Sequelize, DataTypes } = require('sequelize');

// Configuração do banco
const sequelize = new Sequelize('zapclic', 'postgres', '12345678', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: console.log
});

// Modelo FlowBuilder
const FlowBuilder = sequelize.define('FlowBuilder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  flow: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  variables: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  config: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'FlowBuilders',
  timestamps: true
});

async function testFlowCreation() {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    console.log('\n📊 Verificando fluxos existentes...');
    const existingFlows = await FlowBuilder.findAll();
    console.log(`Total de fluxos existentes: ${existingFlows.length}`);
    
    if (existingFlows.length > 0) {
      console.log('\n📋 Fluxos encontrados:');
      existingFlows.forEach((flow, index) => {
        console.log(`${index + 1}. ID: ${flow.id}, Nome: ${flow.name}, Ativo: ${flow.active}`);
      });
    }
    
    console.log('\n🔧 Tentando criar um novo fluxo de teste...');
    const newFlow = await FlowBuilder.create({
      name: 'Fluxo de Teste - ' + new Date().toISOString(),
      user_id: 1,
      company_id: 1,
      active: true,
      flow: JSON.stringify({
        nodes: [],
        edges: []
      }),
      variables: JSON.stringify({}),
      config: JSON.stringify({})
    });
    
    console.log('✅ Fluxo criado com sucesso!');
    console.log('📄 Detalhes do fluxo criado:');
    console.log(`   ID: ${newFlow.id}`);
    console.log(`   Nome: ${newFlow.name}`);
    console.log(`   Ativo: ${newFlow.active}`);
    console.log(`   Criado em: ${newFlow.createdAt}`);
    
    console.log('\n📊 Verificando total após criação...');
    const totalAfter = await FlowBuilder.count();
    console.log(`Total de fluxos após criação: ${totalAfter}`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexão com banco fechada.');
  }
}

testFlowCreation();