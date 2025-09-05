const UpdateTicketService = require('./dist/services/TicketServices/UpdateTicketService').default;
const Contact = require('./dist/models/Contact').default;
const Ticket = require('./dist/models/Ticket').default;
const sequelize = require('./dist/database').default;
require('dotenv').config();

async function testUpdateTicketService() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com banco de dados estabelecida.');

    // Buscar um ticket existente
    const ticket = await Ticket.findOne({
      where: { status: 'pending' },
      include: [{ model: Contact, as: 'contact' }]
    });

    if (!ticket) {
      console.log('Nenhum ticket encontrado para teste');
      return;
    }

    console.log(`\nTestando com ticket ID: ${ticket.id}`);
    console.log(`Status inicial - Status: ${ticket.status}, FlowWebhook: ${ticket.flowWebhook}`);

    // Testar UpdateTicketService com novo status 'chatbot'
    console.log('\nTestando UpdateTicketService com status chatbot...');
    const updateResult = await UpdateTicketService({
      ticketData: {
        status: 'chatbot',
        flowWebhook: true
      },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });

    console.log('Resultado do UpdateTicketService:');
    console.log(`- Status: ${updateResult?.ticket?.status}`);
    console.log(`- FlowWebhook: ${updateResult?.ticket?.flowWebhook}`);

    // Verificar no banco de dados
    const [results] = await sequelize.query(`
      SELECT id, status, chatbot, "flowWebhook" 
      FROM "Tickets" 
      WHERE id = ${ticket.id}
    `);

    console.log('\nStatus no banco de dados:');
    console.log(results[0]);

    // Resetar para pending
    console.log('\nResetando para pending...');
    const resetResult = await UpdateTicketService({
      ticketData: {
        status: 'pending',
        flowWebhook: false
      },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });

    const [resetResults] = await sequelize.query(`
      SELECT id, status, chatbot, "flowWebhook" 
      FROM "Tickets" 
      WHERE id = ${ticket.id}
    `);

    console.log('Status após reset:');
    console.log(resetResults[0]);

  } catch (error) {
    console.error('Erro ao testar:', error);
  } finally {
    await sequelize.close();
  }
}

testUpdateTicketService();