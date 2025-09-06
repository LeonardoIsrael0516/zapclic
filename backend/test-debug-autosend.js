const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const sequelize = require('./dist/database').default;

async function debugAutoSend() {
  try {
    console.log('🔍 Debugando configuração de autoSend...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Buscar todos os fluxos
    const allFlows = await FlowBuilderModel.findAll({
      where: { company_id: 1 }
    });
    
    console.log(`\n📊 Total de fluxos encontrados: ${allFlows.length}`);
    
    allFlows.forEach(flow => {
      console.log(`\n🔄 Fluxo ID: ${flow.id}`);
      console.log(`📝 Nome: ${flow.name}`);
      console.log(`🏢 Company ID: ${flow.company_id}`);
      console.log(`⚙️ Config:`, JSON.stringify(flow.config, null, 2));
      
      const config = flow.config;
      if (config && config.autoSend) {
        console.log(`✅ AutoSend configurado: ${config.autoSend.enabled}`);
      } else {
        console.log(`❌ AutoSend não configurado`);
      }
    });
    
    // Testar a função findAutoStartFlows manualmente
    console.log('\n🔍 Testando findAutoStartFlows...');
    const autoStartFlows = allFlows.filter(flow => {
      const config = flow.config;
      return config?.autoSend?.enabled === true;
    });
    
    console.log(`📊 Fluxos com autoSend habilitado: ${autoStartFlows.length}`);
    autoStartFlows.forEach(flow => {
      console.log(`- ID: ${flow.id}, Nome: ${flow.name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
  
  process.exit(0);
}

debugAutoSend();