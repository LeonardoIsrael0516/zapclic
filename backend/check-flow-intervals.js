const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const sequelize = require('./dist/database').default;

async function checkFlowIntervals() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    const flows = await FlowBuilderModel.findAll({
      where: {
        company_id: 1,
        active: true
      }
    });
    
    console.log(`📊 Total de fluxos encontrados: ${flows.length}`);
    
    flows.forEach((flow, index) => {
      console.log(`\n🔧 Fluxo ${index + 1}: ${flow.name} (ID: ${flow.id})`);
      
      const nodes = flow.flow.nodes || [];
      console.log(`📋 Total de nós: ${nodes.length}`);
      
      nodes.forEach((node, nodeIndex) => {
        console.log(`\n  📦 Nó ${nodeIndex + 1} (ID: ${node.id}):`);
        console.log(`     Tipo: ${node.type}`);
        
        if (node.data && node.data.elements) {
          console.log(`     Elementos: ${node.data.elements.length}`);
          
          node.data.elements.forEach((element, elemIndex) => {
            console.log(`       🔹 Elemento ${elemIndex + 1}:`);
            console.log(`          Tipo: ${element.type}`);
            console.log(`          Número: ${element.number}`);
            console.log(`          Valor: ${element.value}`);
            
            // Verificar se é um elemento de intervalo
            if (element.type === 'interval' || element.number.includes('interval')) {
              console.log(`          ⏰ INTERVALO ENCONTRADO! Valor: ${element.value} segundos`);
            }
          });
        }
      });
    });
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkFlowIntervals();