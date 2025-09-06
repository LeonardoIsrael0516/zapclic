const { FlowKeywordService } = require('./dist/services/FlowBuilderService/FlowKeywordService');
const ContactModel = require('./dist/models/Contact').default;
const TicketModel = require('./dist/models/Ticket').default;
const sequelize = require('./dist/database').default;

async function testMultipleMessages() {
  try {
    console.log('🧪 Testando múltiplas mensagens para o mesmo contato...');
    
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
    
    console.log(`📞 Contato encontrado: ${contact.name} (${contact.number})`);
    
    // Buscar um ticket existente
    const ticket = await TicketModel.findOne({
      where: { 
        contactId: contact.id,
        companyId: 1
      }
    });
    
    if (!ticket) {
      console.log('❌ Nenhum ticket encontrado');
      return;
    }
    
    console.log(`🎫 Ticket encontrado: ${ticket.id}, Chatbot: ${ticket.chatbot}`);
    
    // Primeira mensagem (como novo contato)
    console.log('\n📨 Primeira mensagem (isNewContact = true):');
    const result1 = await FlowKeywordService.processMessage(
      'Primeira mensagem',
      contact,
      ticket,
      1, // companyId
      true, // isNewContact
      ticket.whatsappId
    );
    
    console.log(`📊 Resultado da primeira mensagem: ${result1}`);
    
    // Recarregar o ticket para ver se foi atualizado
    await ticket.reload();
    console.log(`🎫 Ticket após primeira mensagem - Chatbot: ${ticket.chatbot}`);
    
    // Segunda mensagem (não é mais novo contato)
    console.log('\n📨 Segunda mensagem (isNewContact = false):');
    const result2 = await FlowKeywordService.processMessage(
      'Segunda mensagem',
      contact,
      ticket,
      1, // companyId
      false, // isNewContact
      ticket.whatsappId
    );
    
    console.log(`📊 Resultado da segunda mensagem: ${result2}`);
    
    // Terceira mensagem (simulando novo contato novamente)
    console.log('\n📨 Terceira mensagem (isNewContact = true, mas ticket já em chatbot):');
    const result3 = await FlowKeywordService.processMessage(
      'Terceira mensagem',
      contact,
      ticket,
      1, // companyId
      true, // isNewContact
      ticket.whatsappId
    );
    
    console.log(`📊 Resultado da terceira mensagem: ${result3}`);
    
    console.log('\n📊 Resumo dos testes:');
    console.log(`- Primeira mensagem (novo contato): ${result1}`);
    console.log(`- Segunda mensagem (não novo): ${result2}`);
    console.log(`- Terceira mensagem (novo, mas já em chatbot): ${result3}`);
    
    if (result1 && !result3) {
      console.log('✅ Controle de execução múltipla funcionando corretamente!');
    } else {
      console.log('❌ Problema no controle de execução múltipla');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
  
  process.exit(0);
}

testMultipleMessages();