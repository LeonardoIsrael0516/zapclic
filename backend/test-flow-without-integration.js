const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const Whatsapp = require('./dist/models/Whatsapp').default;
const sequelize = require('./dist/database/index').default;

async function testFlowWithoutIntegration() {
  try {
    console.log('🧪 Testando execução de fluxo sem integração configurada...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar todos os fluxos com suas configurações
    const allFlows = await FlowBuilderModel.findAll();
    
    console.log(`🔄 Total de fluxos: ${allFlows.length}`);
    
    if (allFlows.length > 0) {
      console.log('\n📋 Fluxos e suas configurações:');
      allFlows.forEach(flow => {
        console.log(`\n   - ID: ${flow.id}, Nome: ${flow.name}, Ativo: ${flow.active}`);
        
        if (flow.config) {
          const config = flow.config;
          console.log(`     Config:`, JSON.stringify(config, null, 2));
          
          // Verificar se tem palavras-chave configuradas
          if (config.keywords && config.keywords.enabled) {
            console.log(`     ✅ Palavras-chave ativadas:`, config.keywords.list);
          } else {
            console.log(`     ❌ Palavras-chave não configuradas ou desativadas`);
          }
          
          // Verificar se tem autoStart
          if (config.autoStart && config.autoStart.enabled) {
            console.log(`     ✅ AutoStart ativado`);
          } else {
            console.log(`     ❌ AutoStart não configurado ou desativado`);
          }
        } else {
          console.log(`     ❌ Sem configuração`);
        }
      });
    }
    
    // Buscar conexões WhatsApp
    const allWhatsapps = await Whatsapp.findAll();
    
    console.log(`\n📱 Total de conexões WhatsApp: ${allWhatsapps.length}`);
    
    if (allWhatsapps.length > 0) {
      console.log('\n📱 Conexões WhatsApp:');
      allWhatsapps.forEach(whatsapp => {
        console.log(`   - ID: ${whatsapp.id}, Nome: ${whatsapp.name}`);
        console.log(`     flowIdWelcome: ${whatsapp.flowIdWelcome || 'Não configurado'}`);
        console.log(`     flowIdNotPhrase: ${whatsapp.flowIdNotPhrase || 'Não configurado'}`);
        console.log('');
      });
    }
    
    console.log('\n🎯 Diagnóstico:');
    
    // Verificar se há fluxos com palavras-chave
    const flowsWithKeywords = allFlows.filter(flow => 
      flow.config && 
      flow.config.keywords && 
      flow.config.keywords.enabled && 
      flow.config.keywords.list && 
      flow.config.keywords.list.length > 0
    );
    
    console.log(`📝 Fluxos com palavras-chave configuradas: ${flowsWithKeywords.length}`);
    
    if (flowsWithKeywords.length === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: Nenhum fluxo tem palavras-chave configuradas!');
      console.log('\n💡 Solução:');
      console.log('1. Acesse um fluxo no FlowBuilder');
      console.log('2. Configure palavras-chave na seção de configurações');
      console.log('3. Ative as palavras-chave');
      console.log('4. Teste enviando uma das palavras-chave configuradas');
    } else {
      console.log('\n✅ Fluxos com palavras-chave encontrados:');
      flowsWithKeywords.forEach(flow => {
        console.log(`   - ${flow.name}: ${JSON.stringify(flow.config.keywords.list)}`);
      });
    }
    
    // Verificar se há conexões com fluxos configurados
    const whatsappsWithFlows = allWhatsapps.filter(w => w.flowIdWelcome || w.flowIdNotPhrase);
    console.log(`\n🔗 Conexões com fluxos configurados: ${whatsappsWithFlows.length}`);
    
    if (whatsappsWithFlows.length === 0) {
      console.log('\n⚠️  AVISO: Nenhuma conexão WhatsApp tem fluxos configurados');
      console.log('Isso significa que nossa modificação não será testada.');
    }
    
    console.log('\n🎯 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexão com banco fechada');
  }
}

testFlowWithoutIntegration();