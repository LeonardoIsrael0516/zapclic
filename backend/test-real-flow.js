const sequelize = require('./dist/database').default;
const Contact = require('./dist/models/Contact').default;
const Ticket = require('./dist/models/Ticket').default;
const Whatsapp = require('./dist/models/Whatsapp').default;
const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const FlowKeywordService = require('./dist/services/FlowBuilderService/FlowKeywordService').default;

// Mock do Socket IO para evitar erro
const mockIO = {
  emit: () => {},
  to: () => mockIO,
  in: () => mockIO
};

// Substituir getIO por mock
const socketLib = require('./dist/libs/socket');
socketLib.getIO = () => mockIO;

async function testRealFlow() {
  try {
    console.log('🔍 [TEST] Testando fluxo real com FlowKeywordService...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar um ticket existente
    const ticket = await Ticket.findOne({
      where: { status: 'pending' },
      include: [{ model: Contact, as: 'contact' }]
    });
    
    if (!ticket) {
      console.log('❌ Nenhum ticket encontrado');
      return;
    }
    
    console.log('📋 Usando ticket:', {
      id: ticket.id,
      status: ticket.status,
      contactId: ticket.contactId,
      whatsappId: ticket.whatsappId
    });
    
    // Buscar fluxos ativos
    const flows = await FlowBuilderModel.findAll({
      where: {
        company_id: 1,
        active: true
      }
    });
    
    console.log('📊 Total de fluxos encontrados:', flows.length);
    
    if (flows.length === 0) {
      console.log('❌ Nenhum fluxo encontrado');
      return;
    }
    
    // Usar o primeiro fluxo disponível
    const flow = flows[0];
    console.log('🔧 Usando fluxo:', {
      id: flow.id,
      name: flow.name
    });
    
    // Simular mensagem recebida
    const messageData = {
      body: 'teste',
      fromMe: false,
      id: 'test_message_id',
      timestamp: Date.now()
    };
    
    console.log('🚀 Testando FlowKeywordService...');
    
    // Instanciar o serviço
    const flowKeywordService = new FlowKeywordService();
    
    // Testar o processamento
    const result = await flowKeywordService.flowKeyword(
      messageData,
      ticket,
      ticket.contact,
      ticket.whatsappId
    );
    
    console.log('📊 Resultado do FlowKeywordService:', result);
    
    // Verificar status do ticket após processamento
    await ticket.reload();
    console.log('📋 Status do ticket após processamento:', {
      id: ticket.id,
      status: ticket.status,
      chatbot: ticket.chatbot,
      flowWebhook: ticket.flowWebhook
    });
    
    if (ticket.status === 'chatbot') {
      console.log('✅ Sucesso! Ticket foi para status "chatbot"');
    } else {
      console.log(`❌ Falha! Ticket não foi para status "chatbot". Status atual: ${ticket.status}`);
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testRealFlow();