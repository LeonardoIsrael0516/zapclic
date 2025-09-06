const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const Whatsapp = require('./dist/models/Whatsapp').default;
const sequelize = require('./dist/database').default;

async function checkIntegration() {
  try {
    console.log('🔍 Verificando configurações de integração...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    const whatsapps = await Whatsapp.findAll({
      attributes: ['id', 'name', 'integrationId']
    });
    
    console.log('\n📱 WhatsApps e suas integrações:');
    whatsapps.forEach(w => {
      console.log(`ID: ${w.id}, Nome: ${w.name}, IntegrationId: ${w.integrationId}`);
    });
    
    const flows = await FlowBuilderModel.findAll({
      attributes: ['id', 'name', 'config']
    });
    
    console.log('\n🔄 Fluxos com autoSend habilitado:');
    flows.forEach(f => {
      const config = f.config;
      if (config?.autoSend?.enabled) {
        console.log(`ID: ${f.id}, Nome: ${f.name}, AutoSend: ${config.autoSend.enabled}`);
      }
    });
    
    console.log('\n📊 Resumo:');
    console.log(`Total de WhatsApps: ${whatsapps.length}`);
    console.log(`WhatsApps com integração: ${whatsapps.filter(w => w.integrationId).length}`);
    console.log(`Total de fluxos: ${flows.length}`);
    console.log(`Fluxos com autoSend: ${flows.filter(f => f.config?.autoSend?.enabled).length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
  
  process.exit(0);
}

checkIntegration();