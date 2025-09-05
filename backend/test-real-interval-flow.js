const { FlowKeywordService } = require('./dist/services/FlowBuilderService/FlowKeywordService');
const Ticket = require('./dist/models/Ticket').default;
const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const sequelize = require('./dist/database').default;

// Mock do Socket IO
const mockSocket = {
  emit: (event, data) => {
    console.log(`📡 Socket emit: ${event}`, data);
  }
};

const mockIO = {
  to: () => mockSocket,
  emit: (event, data) => {
    console.log(`📡 IO emit: ${event}`, data);
  }
};

// Mock da função getIO
require('./dist/libs/socket').getIO = () => mockIO;

async function testRealIntervalFlow() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar um ticket com status pending
    const ticket = await TicketModel.findOne({
      where: {
        status: 'pending',
        companyId: 1
      },
      include: ['contact', 'whatsapp']
    });
    
    if (!ticket) {
      console.log('❌ Nenhum ticket pending encontrado');
      return;
    }
    
    console.log(`🎫 Ticket encontrado: ${ticket.id}`);
    
    // Buscar fluxos ativos
    const flows = await FlowBuilderModel.findAll({
      where: {
        company_id: 1,
        active: true
      }
    });
    
    if (flows.length === 0) {
      console.log('❌ Nenhum fluxo ativo encontrado');
      return;
    }
    
    console.log(`🔧 ${flows.length} fluxo(s) ativo(s) encontrado(s)`);
    
    // Verificar se há nó de intervalo
    const flow = flows[0];
    const intervalNode = flow.flow.nodes.find(node => node.type === 'interval');
    
    if (intervalNode) {
      console.log(`⏰ Nó de intervalo encontrado: ${intervalNode.data.sec} segundos`);
    }
    
    // Simular mensagem recebida
    const message = {
      body: 'oi',
      from: ticket.contact.number,
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    console.log('🚀 Iniciando processamento do fluxo...');
    const startTime = Date.now();
    
    // Processar via FlowKeywordService
    const flowKeywordService = new FlowKeywordService();
    
    try {
      await flowKeywordService.flowKeyword({
        msg: message,
        ticket: ticket,
        contact: ticket.contact,
        whatsapp: ticket.whatsapp
      });
      
      const endTime = Date.now();
      const elapsedTime = (endTime - startTime) / 1000;
      
      console.log(`🎯 Processamento concluído! Tempo decorrido: ${elapsedTime}s`);
      
      if (elapsedTime >= 60) {
        console.log('✅ Intervalo funcionou corretamente no fluxo real!');
      } else {
        console.log('⚠️ Fluxo processado rapidamente - verificar se intervalo foi aplicado');
      }
      
    } catch (error) {
      console.error('❌ Erro no processamento do fluxo:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

testRealIntervalFlow();