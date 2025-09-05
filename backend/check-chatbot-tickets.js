const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do banco de dados
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: false
});

async function checkChatbotTickets() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com banco de dados estabelecida.');

    // Verificar tickets marcados como chatbot
    const [results] = await sequelize.query(`
      SELECT id, status, chatbot, "flowWebhook", "companyId", "updatedAt" 
      FROM "Tickets" 
      WHERE chatbot = true 
      ORDER BY "updatedAt" DESC 
      LIMIT 10
    `);

    console.log('\n=== TICKETS MARCADOS COMO CHATBOT ===');
    if (results.length === 0) {
      console.log('Nenhum ticket encontrado com chatbot = true');
    } else {
      console.log(`Encontrados ${results.length} tickets:`);
      results.forEach(ticket => {
        console.log(`ID: ${ticket.id}, Status: ${ticket.status}, Chatbot: ${ticket.chatbot}, FlowWebhook: ${ticket.flowWebhook}, CompanyId: ${ticket.companyId}, UpdatedAt: ${ticket.updatedAt}`);
      });
    }

    // Verificar total de tickets por status
    const [statusCount] = await sequelize.query(`
      SELECT status, COUNT(*) as total 
      FROM "Tickets" 
      GROUP BY status
    `);

    console.log('\n=== TOTAL DE TICKETS POR STATUS ===');
    statusCount.forEach(item => {
      console.log(`${item.status}: ${item.total}`);
    });

    // Verificar tickets pending com chatbot
    const [pendingChatbot] = await sequelize.query(`
      SELECT COUNT(*) as total 
      FROM "Tickets" 
      WHERE status = 'pending' AND chatbot = true
    `);

    console.log('\n=== TICKETS PENDING COM CHATBOT ===');
    console.log(`Total: ${pendingChatbot[0].total}`);

    // Verificar fluxos configurados
    const [flows] = await sequelize.query(`
      SELECT id, name, config 
      FROM "FlowBuilders" 
      LIMIT 5
    `);

    console.log('\n=== FLUXOS CONFIGURADOS ===');
    if (flows.length === 0) {
      console.log('Nenhum fluxo encontrado');
    } else {
      console.log(`Encontrados ${flows.length} fluxos:`);
      flows.forEach(flow => {
        console.log(`ID: ${flow.id}, Nome: ${flow.name}`);
        if (flow.config) {
          const config = typeof flow.config === 'string' ? JSON.parse(flow.config) : flow.config;
          console.log(`  - Keywords habilitadas: ${config.keywords?.enabled || false}`);
          console.log(`  - AutoStart habilitado: ${config.autoStart?.enabled || false}`);
          if (config.keywords?.list) {
            console.log(`  - Palavras-chave: ${config.keywords.list.join(', ')}`);
          }
        }
      });
    }

    // Verificar integrações configuradas
    const [integrations] = await sequelize.query(`
      SELECT id, name, type, "companyId"
      FROM "QueueIntegrations"
      LIMIT 10
    `);

    console.log('\n=== INTEGRAÇÕES CONFIGURADAS ===');
    if (integrations.length === 0) {
      console.log('Nenhuma integração encontrada');
    } else {
      console.log(`Encontradas ${integrations.length} integrações:`);
      integrations.forEach(integration => {
        console.log(`ID: ${integration.id}, Nome: ${integration.name}, Tipo: ${integration.type}, CompanyId: ${integration.companyId}`);
      });
    }

    // Verificar conexões WhatsApp
    const [whatsapps] = await sequelize.query(`
      SELECT id, name, "integrationId", "companyId"
      FROM "Whatsapps"
      LIMIT 5
    `);

    console.log('\n=== CONEXÕES WHATSAPP ===');
    if (whatsapps.length === 0) {
      console.log('Nenhuma conexão encontrada');
    } else {
      console.log(`Encontradas ${whatsapps.length} conexões:`);
      whatsapps.forEach(whatsapp => {
        console.log(`ID: ${whatsapp.id}, Nome: ${whatsapp.name}, IntegrationId: ${whatsapp.integrationId}, CompanyId: ${whatsapp.companyId}`);
      });
    }

  } catch (error) {
    console.error('Erro ao verificar tickets:', error);
  } finally {
    await sequelize.close();
  }
}

checkChatbotTickets();