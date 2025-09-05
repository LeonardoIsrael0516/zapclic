const QueueIntegrations = require('./dist/models/QueueIntegrations').default;
const sequelize = require('./dist/database').default;
require('dotenv').config();

async function debugIntegrationConfig() {
  try {
    console.log('🔍 Investigando configuração da integração...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Buscar a integração ID 3 (que está configurada no WhatsApp)
    const integration = await QueueIntegrations.findByPk(3);
    
    if (!integration) {
      console.log('❌ Integração ID 3 não encontrada');
      return;
    }
    
    console.log('\n📋 Configuração da integração:');
    console.log(`  - ID: ${integration.id}`);
    console.log(`  - Name: ${integration.name}`);
    console.log(`  - Type: ${integration.type}`);
    console.log(`  - URL Webhook: ${integration.urlWebhook}`);
    console.log(`  - Auth Token: ${integration.authToken ? 'Configurado' : 'Não configurado'}`);
    console.log(`  - Company ID: ${integration.companyId}`);
    
    // Verificar se é do tipo flowbuilder
    const isFlowbuilder = integration.type === 'flowbuilder';
    console.log(`\n🎯 É integração flowbuilder? ${isFlowbuilder ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!isFlowbuilder) {
      console.log('\n💡 Problema identificado:');
      console.log('  - A integração não é do tipo "flowbuilder"');
      console.log('  - Para que os fluxos funcionem, a integração deve ser do tipo "flowbuilder"');
      console.log('  - Tipos disponíveis: flowbuilder, webhook, etc.');
    } else {
      console.log('\n✅ Integração está configurada corretamente como flowbuilder');
      console.log('\n🔍 Próximos passos para debug:');
      console.log('  1. Verificar se handleMessageIntegration está sendo chamada');
      console.log('  2. Verificar se flowbuilderIntegration está sendo executada');
      console.log('  3. Verificar logs do FlowKeywordService.processMessage');
    }
    
    console.log('\n✅ Investigação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante investigação:', error);
  } finally {
    await sequelize.close();
  }
}

debugIntegrationConfig();