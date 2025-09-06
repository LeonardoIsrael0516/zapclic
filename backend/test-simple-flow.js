const { FlowKeywordService } = require('./dist/services/FlowBuilderService/FlowKeywordService');
const sequelize = require('./dist/database').default;

async function testSimpleFlow() {
  try {
    console.log('🧪 Testando FlowKeywordService...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Dados de teste
    const testData = {
      body: 'oii',
      contact: {
        id: 1,
        number: '5511999999999',
        name: 'Teste',
        companyId: 1
      },
      ticket: {
        id: 1,
        contactId: 1,
        whatsappId: 1,
        companyId: 1,
        status: 'open'
      },
      whatsappId: 1,
      companyId: 1
    };
    
    console.log('📝 Dados de teste:', JSON.stringify(testData, null, 2));
    
    // Testar o serviço
    console.log('🚀 Executando FlowKeywordService.processMessage...');
    const result = await FlowKeywordService.processMessage(
      testData.body,
      testData.contact,
      testData.ticket,
      testData.companyId,
      false,
      testData.whatsappId
    );
    
    console.log('✅ Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    // Fechar conexão
    await sequelize.close();
    console.log('🔌 Conexão com banco fechada');
    process.exit(0);
  }
}

testSimpleFlow();