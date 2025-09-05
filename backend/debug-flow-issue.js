require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configurar conexão com o banco usando variáveis de ambiente
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: false
});

async function debugFlowIssue() {
  try {
    console.log('🔍 Investigando problema com disparo de fluxos...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar tickets com flowStopped ou lastFlowId definidos
    const [ticketsWithFlow] = await sequelize.query(
      'SELECT id, status, "flowStopped", "lastFlowId", "contactId", "companyId", "createdAt" FROM "Tickets" WHERE "flowStopped" IS NOT NULL OR "lastFlowId" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 10'
    );
    
    console.log('\n📋 Tickets com fluxo ativo ou parado:');
    if (ticketsWithFlow.length === 0) {
      console.log('  Nenhum ticket encontrado com fluxo ativo');
    } else {
      ticketsWithFlow.forEach(ticket => {
        console.log(`  - Ticket ${ticket.id}: status=${ticket.status}, flowStopped=${ticket.flowStopped}, lastFlowId=${ticket.lastFlowId}`);
      });
    }
    
    // Verificar fluxos configurados
    const [flows] = await sequelize.query(
      'SELECT id, name, config, "company_id" FROM "FlowBuilders" WHERE config IS NOT NULL LIMIT 5'
    );
    
    console.log('\n🔧 Fluxos configurados:');
    if (flows.length === 0) {
      console.log('  Nenhum fluxo encontrado');
    } else {
      flows.forEach(flow => {
        const config = typeof flow.config === 'string' ? JSON.parse(flow.config) : flow.config;
        const hasKeywords = config?.keywords?.enabled && config.keywords.list?.length > 0;
        const hasAutoStart = config?.autoStart?.enabled;
        console.log(`  - Fluxo ${flow.id} (${flow.name}): keywords=${hasKeywords ? 'SIM' : 'NÃO'}, autoStart=${hasAutoStart ? 'SIM' : 'NÃO'}`);
        if (hasKeywords) {
          console.log(`    Palavras-chave: ${config.keywords.list.join(', ')}`);
        }
      });
    }
    
    // Verificar tickets recentes
    const [recentTickets] = await sequelize.query(
      'SELECT id, status, "flowStopped", "lastFlowId", "contactId", "companyId", "createdAt" FROM "Tickets" ORDER BY "createdAt" DESC LIMIT 5'
    );
    
    console.log('\n📅 Tickets mais recentes:');
    recentTickets.forEach(ticket => {
      console.log(`  - Ticket ${ticket.id}: status=${ticket.status}, flowStopped=${ticket.flowStopped}, lastFlowId=${ticket.lastFlowId}`);
    });
    
    console.log('\n✅ Investigação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a investigação:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugFlowIssue();