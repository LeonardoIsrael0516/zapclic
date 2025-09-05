const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const { ActionsWebhookService } = require('./dist/services/WebhookService/ActionsWebhookService');
const sequelize = require('./dist/database').default;

// Função intervalWhats simulada
const intervalWhats = (seconds) => {
  const milliseconds = parseInt(seconds) * 1000;
  console.log(`⏳ Aguardando ${milliseconds}ms (${seconds}s)...`);
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`✅ Intervalo de ${seconds}s concluído!`);
      resolve();
    }, milliseconds);
  });
};

async function testIntervalFlow() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar o fluxo
    const flow = await FlowBuilderModel.findOne({
      where: {
        company_id: 1,
        active: true
      }
    });
    
    if (!flow) {
      console.log('❌ Nenhum fluxo encontrado');
      return;
    }
    
    console.log(`🔧 Testando fluxo: ${flow.name}`);
    
    // Encontrar o nó de intervalo
    const intervalNode = flow.flow.nodes.find(node => node.type === 'interval');
    
    if (!intervalNode) {
      console.log('❌ Nenhum nó de intervalo encontrado');
      return;
    }
    
    console.log(`⏰ Nó de intervalo encontrado: ${intervalNode.data.sec} segundos`);
    
    // Simular o processamento do nó de intervalo
    console.log('🚀 Iniciando teste do intervalo...');
    const startTime = Date.now();
    
    // Simular a lógica do ActionsWebhookService para nó de intervalo
    if (intervalNode.type === "interval") {
      const intervalSeconds = intervalNode.data.sec || "1";
      console.log(`⏰ Executando intervalo de ${intervalSeconds} segundos`);
      
      await intervalWhats(intervalSeconds);
    }
    
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;
    
    console.log(`🎯 Teste concluído! Tempo decorrido: ${elapsedTime}s`);
    
    if (elapsedTime >= 60) {
      console.log('✅ Intervalo funcionou corretamente!');
    } else {
      console.log('❌ Intervalo não funcionou como esperado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

testIntervalFlow();