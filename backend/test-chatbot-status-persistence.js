const UpdateTicketService = require('./dist/services/TicketServices/UpdateTicketService').default;
const Ticket = require('./dist/models/Ticket').default;
const Contact = require('./dist/models/Contact').default;
const Queue = require('./dist/models/Queue').default;
const User = require('./dist/models/User').default;
const Company = require('./dist/models/Company').default;

async function testChatbotStatusPersistence() {
  try {
    console.log('🧪 Testando persistência do status chatbot...');
    
    // Buscar um ticket existente com status chatbot
    const chatbotTicket = await Ticket.findOne({
      where: {
        status: 'chatbot'
      },
      include: [
        { model: Contact, as: 'contact' },
        { model: Queue, as: 'queue' },
        { model: User, as: 'user' },
        { model: Company, as: 'company' }
      ]
    });
    
    if (!chatbotTicket) {
      console.log('❌ Nenhum ticket com status chatbot encontrado para teste');
      return;
    }
    
    console.log(`📋 Ticket encontrado: ID ${chatbotTicket.id}, Status: ${chatbotTicket.status}`);
    
    // Simular uma atualização que pode acontecer durante o fluxo
    console.log('🔄 Simulando atualização do ticket durante fluxo...');
    
    await UpdateTicketService({
      ticketData: {
        queueId: chatbotTicket.queueId,
        chatbot: true,
        status: 'chatbot' // Explicitamente manter como chatbot
      },
      ticketId: chatbotTicket.id,
      companyId: chatbotTicket.companyId
    });
    
    // Verificar se o status foi mantido
    await chatbotTicket.reload();
    
    console.log(`✅ Status após atualização: ${chatbotTicket.status}`);
    
    if (chatbotTicket.status === 'chatbot') {
      console.log('🎉 SUCESSO: Status chatbot foi preservado!');
    } else {
      console.log(`❌ FALHA: Status mudou para ${chatbotTicket.status}`);
    }
    
    // Teste 2: Simular atualização sem especificar status
    console.log('\n🔄 Testando atualização sem especificar status...');
    
    await UpdateTicketService({
      ticketData: {
        queueId: chatbotTicket.queueId,
        chatbot: true
        // Não especificar status para ver se é preservado
      },
      ticketId: chatbotTicket.id,
      companyId: chatbotTicket.companyId
    });
    
    await chatbotTicket.reload();
    
    console.log(`✅ Status após atualização sem especificar: ${chatbotTicket.status}`);
    
    if (chatbotTicket.status === 'chatbot') {
      console.log('🎉 SUCESSO: Status chatbot foi preservado mesmo sem especificar!');
    } else {
      console.log(`❌ FALHA: Status mudou para ${chatbotTicket.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

testChatbotStatusPersistence();