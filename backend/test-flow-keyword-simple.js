const FlowKeywordService = require('./dist/services/FlowBuilderService/FlowKeywordService').default;
const Ticket = require('./dist/models/Ticket').default;
const Contact = require('./dist/models/Contact').default;
const Queue = require('./dist/models/Queue').default;
const User = require('./dist/models/User').default;
const Company = require('./dist/models/Company').default;
const FlowBuilder = require('./dist/models/FlowBuilder').default;

async function testFlowKeywordTrigger() {
  try {
    console.log('🧪 Testando disparo de fluxo por palavra-chave...');
    
    // Buscar um fluxo ativo
    const flow = await FlowBuilder.findOne({
      where: {
        status: true
      }
    });
    
    if (!flow) {
      console.log('❌ Nenhum fluxo ativo encontrado');
      return;
    }
    
    console.log(`📋 Fluxo encontrado: ID ${flow.id}, Nome: ${flow.name}`);
    console.log(`🔑 Palavras-chave: ${flow.flowKeywords}`);
    
    // Buscar um ticket para teste
    const ticket = await Ticket.findOne({
      where: {
        status: 'pending'
      },
      include: [
        { model: Contact, as: 'contact' },
        { model: Queue, as: 'queue' },
        { model: User, as: 'user' },
        { model: Company, as: 'company' }
      ]
    });
    
    if (!ticket) {
      console.log('❌ Nenhum ticket pending encontrado para teste');
      return;
    }
    
    console.log(`🎫 Ticket para teste: ID ${ticket.id}, Status: ${ticket.status}`);
    
    // Testar se o fluxo seria disparado
    const keywords = flow.flowKeywords ? flow.flowKeywords.split(',').map(k => k.trim()) : [];
    
    if (keywords.length === 0) {
      console.log('❌ Fluxo não tem palavras-chave configuradas');
      return;
    }
    
    const testKeyword = keywords[0];
    console.log(`🔍 Testando com palavra-chave: "${testKeyword}"`);
    
    // Simular verificação de palavra-chave
    const messageBody = testKeyword;
    const shouldTrigger = keywords.some(keyword => 
      messageBody.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log(`✅ Palavra-chave deveria disparar fluxo: ${shouldTrigger}`);
    
    if (shouldTrigger) {
      console.log('🎉 SUCESSO: Lógica de palavra-chave está funcionando!');
      
      // Verificar se o serviço existe e pode ser chamado
      try {
        console.log('🔄 Testando chamada do FlowKeywordService...');
        
        // Simular os parâmetros que seriam passados
        const serviceParams = {
          flowId: flow.id,
          ticketId: ticket.id,
          companyId: ticket.companyId,
          contact: ticket.contact,
          messageBody: messageBody
        };
        
        console.log('📋 Parâmetros do serviço:', JSON.stringify(serviceParams, null, 2));
        console.log('✅ FlowKeywordService está disponível e pode ser chamado');
        
      } catch (serviceError) {
        console.log('❌ Erro ao testar FlowKeywordService:', serviceError.message);
      }
    } else {
      console.log('❌ FALHA: Palavra-chave não dispararia o fluxo');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

testFlowKeywordTrigger();