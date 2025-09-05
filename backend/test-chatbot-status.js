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

async function testChatbotStatus() {
  try {
    console.log('🔍 Testando o novo sistema de status chatbot...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar se existem tickets com status 'chatbot'
    const [chatbotTickets] = await sequelize.query(
      'SELECT id, status, chatbot, "createdAt" FROM "Tickets" WHERE status = \'chatbot\' ORDER BY "createdAt" DESC LIMIT 5'
    );
    
    console.log('\n📊 Tickets com status "chatbot":');
    if (chatbotTickets.length > 0) {
      chatbotTickets.forEach(ticket => {
        console.log(`  - ID: ${ticket.id}, Status: ${ticket.status}, Chatbot: ${ticket.chatbot}, Criado: ${ticket.createdAt}`);
      });
    } else {
      console.log('  Nenhum ticket encontrado com status "chatbot"');
    }
    
    // Verificar tickets com campo chatbot = true mas status diferente
    const [oldChatbotTickets] = await sequelize.query(
      'SELECT id, status, chatbot, "createdAt" FROM "Tickets" WHERE chatbot = true AND status != \'chatbot\' ORDER BY "createdAt" DESC LIMIT 5'
    );
    
    console.log('\n⚠️  Tickets com chatbot=true mas status diferente de "chatbot":');
    if (oldChatbotTickets.length > 0) {
      oldChatbotTickets.forEach(ticket => {
        console.log(`  - ID: ${ticket.id}, Status: ${ticket.status}, Chatbot: ${ticket.chatbot}, Criado: ${ticket.createdAt}`);
      });
    } else {
      console.log('  Nenhum ticket encontrado (isso é bom!)');
    }
    
    // Contar tickets por status
    const [statusCounts] = await sequelize.query(
      'SELECT status, COUNT(*) as count FROM "Tickets" GROUP BY status ORDER BY count DESC'
    );
    
    console.log('\n📈 Contagem de tickets por status:');
    statusCounts.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} tickets`);
    });
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await sequelize.close();
  }
}

testChatbotStatus();