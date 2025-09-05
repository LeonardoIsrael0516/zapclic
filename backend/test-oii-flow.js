const { FlowKeywordService } = require('./dist/services/FlowBuilderService/FlowKeywordService');
const { ContactModel } = require('./dist/models/Contact');
const { TicketModel } = require('./dist/models/Ticket');
const { WhatsappModel } = require('./dist/models/Whatsapp');
const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const sequelize = require('./dist/database').default;

async function testOiiFlow() {
  try {
    console.log('🧪 Testando disparo do fluxo com palavra "oii"...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Buscar um contato existente
    const contact = await ContactModel.findOne({
      where: { companyId: 1 }
    });
    
    if (!contact) {
      console.log('❌ Nenhum contato encontrado');
      return;
    }
    
    console.log(`📞 Usando contato: ${contact.name} (${contact.number})`);
    
    // Buscar um ticket existente ou criar um novo
    let ticket = await TicketModel.findOne({
      where: {
        contactId: contact.id,
        companyId: 1
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!ticket) {
      console.log('❌ Nenhum ticket encontrado para este contato');
      return;
    }
    
    console.log(`🎫 Usando ticket: ${ticket.id} (status atual: ${ticket.status})`);
    
    // Testar o FlowKeywordService
    console.log('\n🔄 Chamando FlowKeywordService.processMessage...');
    const result = await FlowKeywordService.processMessage(
      'oii',
      contact,
      ticket,
      1, // companyId
      false // isFirstMsg
    );
    
    console.log(`📊 Resultado do processMessage: ${result}`);
    
    // Verificar o status do ticket após o processamento
    await ticket.reload();
    console.log(`\n🎫 Status do ticket após processamento: ${ticket.status}`);
    console.log(`🤖 flowWebhook: ${ticket.flowWebhook}`);
    
    if (ticket.status === 'chatbot') {
      console.log('✅ SUCESSO! Ticket foi definido como "chatbot"');
    } else {
      console.log('❌ FALHA! Ticket não foi definido como "chatbot"');
    }
    
    // Verificar se há fluxos configurados para a palavra "oii"
    console.log('\n🔍 Verificando fluxos configurados...');
    const flows = await FlowBuilderModel.findAll({
      where: { companyId: 1 }
    });
    
    for (const flow of flows) {
      if (flow.config && flow.config.keywords && flow.config.keywords.enabled) {
        const keywords = flow.config.keywords.list || [];
        if (keywords.some(keyword => keyword.toLowerCase() === 'oii')) {
          console.log(`✅ Fluxo ${flow.id} (${flow.name}) tem palavra-chave "oii" configurada`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔚 Teste concluído!');
  }
}

testOiiFlow();