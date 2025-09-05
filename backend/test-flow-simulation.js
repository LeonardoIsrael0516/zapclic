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

async function simulateFlowTrigger() {
  try {
    console.log('🚀 Simulando disparo de fluxo para testar status chatbot...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Primeiro, verificar se já existe um ticket para evitar conflito de unicidade
    const [existingTickets] = await sequelize.query(
      'SELECT id FROM "Tickets" WHERE "contactId" = 1 AND "companyId" = 1 LIMIT 1'
    );
    
    let ticketId;
    let isNewTicket = false;
    
    if (existingTickets.length > 0) {
      // Usar ticket existente e atualizar para status 'chatbot'
      ticketId = existingTickets[0].id;
      await sequelize.query(
        'UPDATE "Tickets" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
        {
          bind: ['chatbot', ticketId]
        }
      );
      console.log(`✅ Ticket existente atualizado! ID: ${ticketId}, Status: chatbot`);
    } else {
      // Criar um novo ticket
      const [result] = await sequelize.query(`
        INSERT INTO "Tickets" (status, "contactId", "whatsappId", "companyId", "createdAt", "updatedAt")
        VALUES ('chatbot', 1, 1, 1, NOW(), NOW())
        RETURNING id, status
      `);
      
      if (result && result.length > 0) {
        ticketId = result[0].id;
        isNewTicket = true;
        console.log(`✅ Ticket criado com sucesso! ID: ${ticketId}, Status: ${result[0].status}`);
      }
    }
    
    if (ticketId) {
      // Verificar se o ticket foi criado/atualizado corretamente
      const [tickets] = await sequelize.query(
        'SELECT id, status, chatbot, "createdAt" FROM "Tickets" WHERE id = $1',
        {
          bind: [ticketId]
        }
      );
      
      if (tickets.length > 0) {
        const ticket = tickets[0];
        console.log('📋 Detalhes do ticket:');
        console.log(`  - ID: ${ticket.id}`);
        console.log(`  - Status: ${ticket.status}`);
        console.log(`  - Campo chatbot: ${ticket.chatbot}`);
        console.log(`  - Criado em: ${ticket.createdAt}`);
        
        if (ticket.status === 'chatbot') {
          console.log('✅ SUCESSO: Ticket com status "chatbot" corretamente!');
        } else {
          console.log('❌ ERRO: Ticket não está com status "chatbot"');
        }
      }
      
      // Se foi um ticket criado para teste, removê-lo
      if (isNewTicket) {
        await sequelize.query(
          'DELETE FROM "Tickets" WHERE id = $1',
          {
            bind: [ticketId]
          }
        );
        console.log('🧹 Ticket de teste removido');
      } else {
        console.log('ℹ️  Ticket existente mantido (não removido)');
      }
      
    } else {
      console.log('❌ Falha ao obter ID do ticket');
    }
    
    console.log('\n✅ Simulação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a simulação:', error.message);
  } finally {
    await sequelize.close();
  }
}

simulateFlowTrigger();