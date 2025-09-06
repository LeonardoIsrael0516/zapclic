const { FlowKeywordService } = require('./dist/services/FlowBuilderService/FlowKeywordService');
const Contact = require('./dist/models/Contact').default;
const Ticket = require('./dist/models/Ticket').default;
const sequelize = require('./dist/database/index').default;

async function testKeywordDebug() {
  try {
    console.log('🧪 Testando FlowKeywordService diretamente...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar um contato e ticket existente
    const contact = await Contact.findOne();
    const ticket = await Ticket.findOne({
      where: {
        whatsappId: 1
      }
    });
    
    if (!contact || !ticket) {
      console.log('❌ Não foi possível encontrar contato ou ticket para teste');
      return;
    }
    
    console.log('📋 Dados do teste:');
    console.log(`   - Contact ID: ${contact.id}`);
    console.log(`   - Ticket ID: ${ticket.id}`);
    console.log(`   - WhatsApp ID: ${ticket.whatsappId}`);
    console.log(`   - Company ID: ${ticket.companyId}`);
    
    // Testar com a palavra-chave "oii"
    console.log('\n🔍 Testando palavra-chave "oii"...');
    
    const result = await FlowKeywordService.processMessage(
      'oii',
      contact,
      ticket,
      ticket.companyId,
      false,
      ticket.whatsappId
    );
    
    console.log(`\n📊 Resultado: ${result ? 'Fluxo disparado!' : 'Nenhum fluxo disparado'}`);
    
    // Testar com a palavra-chave "boa tarde"
    console.log('\n🔍 Testando palavra-chave "boa tarde"...');
    
    const result2 = await FlowKeywordService.processMessage(
      'boa tarde',
      contact,
      ticket,
      ticket.companyId,
      false,
      ticket.whatsappId
    );
    
    console.log(`\n📊 Resultado: ${result2 ? 'Fluxo disparado!' : 'Nenhum fluxo disparado'}`);
    
    // Testar com palavra que não existe
    console.log('\n🔍 Testando palavra-chave "teste123" (não existe)...');
    
    const result3 = await FlowKeywordService.processMessage(
      'teste123',
      contact,
      ticket,
      ticket.companyId,
      false,
      ticket.whatsappId
    );
    
    console.log(`\n📊 Resultado: ${result3 ? 'Fluxo disparado!' : 'Nenhum fluxo disparado'}`);
    
    console.log('\n🎯 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexão com banco fechada');
  }
}

testKeywordDebug();