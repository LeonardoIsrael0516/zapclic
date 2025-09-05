// Usar a configuração de banco existente do projeto
require('dotenv').config();
const sequelize = require('./dist/database').default;

// Importar modelos
const Ticket = require('./dist/models/Ticket').default;
const Contact = require('./dist/models/Contact').default;
const Whatsapp = require('./dist/models/Whatsapp').default;
const Queue = require('./dist/models/Queue').default;
const Company = require('./dist/models/Company').default;

// Importar serviços
const UpdateTicketService = require('./dist/services/TicketServices/UpdateTicketService').default;

async function testChatbotStatusFix() {
  try {
    console.log('🧪 Testando correção do status chatbot...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar um ticket com status chatbot
    const chatbotTicket = await Ticket.findOne({
      where: {
        status: 'chatbot'
      },
      include: [
        { model: Contact, as: 'contact' },
        { model: Queue, as: 'queue' },
        { model: Company, as: 'company' }
      ]
    });
    
    if (!chatbotTicket) {
      console.log('❌ Nenhum ticket com status chatbot encontrado');
      
      // Criar um ticket de teste
      const testContact = await Contact.findOne();
      const testCompany = await Company.findOne();
      const testWhatsapp = await Whatsapp.findOne();
      
      if (!testContact || !testCompany || !testWhatsapp) {
        console.log('❌ Dados necessários não encontrados para criar ticket de teste');
        return;
      }
      
      const testTicket = await Ticket.create({
        contactId: testContact.id,
        companyId: testCompany.id,
        whatsappId: testWhatsapp.id,
        status: 'chatbot',
        flowWebhook: true,
        lastMessage: 'Teste de status chatbot'
      });
      
      console.log('✅ Ticket de teste criado:', {
        id: testTicket.id,
        status: testTicket.status,
        flowWebhook: testTicket.flowWebhook
      });
      
      // Simular a lógica da função verifyQueue
      console.log('🔄 Simulando lógica da verifyQueue...');
      
      const statusToSet = testTicket.status === "chatbot" ? "chatbot" : "pending";
      console.log('📊 Status que será definido:', statusToSet);
      
      // Simular atualização com fila
      const firstQueue = await Queue.findOne({ where: { companyId: testCompany.id } });
      
      if (firstQueue) {
        await UpdateTicketService({
          ticketData: { 
            queueId: firstQueue.id, 
            chatbot: false, 
            status: statusToSet 
          },
          ticketId: testTicket.id,
          companyId: testTicket.companyId
        });
        
        // Verificar se o status foi preservado
        await testTicket.reload();
        
        console.log('✅ Resultado do teste:', {
          ticketId: testTicket.id,
          statusAnterior: 'chatbot',
          statusAtual: testTicket.status,
          queueId: testTicket.queueId,
          preservouStatus: testTicket.status === 'chatbot'
        });
        
        if (testTicket.status === 'chatbot') {
          console.log('🎉 SUCESSO: Status chatbot foi preservado!');
        } else {
          console.log('❌ FALHA: Status foi alterado para:', testTicket.status);
        }
        
        // Limpar ticket de teste
        await testTicket.destroy();
        console.log('🧹 Ticket de teste removido');
      } else {
        console.log('❌ Nenhuma fila encontrada para teste');
      }
    } else {
      console.log('✅ Ticket com status chatbot encontrado:', {
        id: chatbotTicket.id,
        status: chatbotTicket.status,
        contactName: chatbotTicket.contact?.name
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexão com banco fechada');
  }
}

// Executar teste
testChatbotStatusFix();