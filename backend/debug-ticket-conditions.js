const Ticket = require('./dist/models/Ticket').default;
const Whatsapp = require('./dist/models/Whatsapp').default;
const Contact = require('./dist/models/Contact').default;
const Queue = require('./dist/models/Queue').default;
const sequelize = require('./dist/database').default;
require('dotenv').config();

async function debugTicketConditions() {
  try {
    console.log('🔍 Investigando condições do ticket para disparo de fluxo...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Buscar o ticket mais recente
    const ticket = await Ticket.findOne({
      where: { companyId: 1 },
      order: [['id', 'DESC']],
      include: [
        { model: Contact, as: 'contact' },
        { model: Queue, as: 'queue' }
      ]
    });
    
    if (!ticket) {
      console.log('❌ Nenhum ticket encontrado');
      return;
    }
    
    console.log('\n📋 Estado do ticket mais recente:');
    console.log(`  - ID: ${ticket.id}`);
    console.log(`  - Status: ${ticket.status}`);
    console.log(`  - Queue ID: ${ticket.queueId}`);
    console.log(`  - Queue: ${ticket.queue ? ticket.queue.name : 'null'}`);
    console.log(`  - User ID: ${ticket.userId}`);
    console.log(`  - User: ${ticket.user ? 'SIM' : 'NÃO'}`);
    console.log(`  - Is Group: ${ticket.isGroup}`);
    console.log(`  - Use Integration: ${ticket.useIntegration}`);
    console.log(`  - Integration ID: ${ticket.integrationId}`);
    console.log(`  - Flow Stopped: ${ticket.flowStopped}`);
    console.log(`  - Last Flow ID: ${ticket.lastFlowId}`);
    console.log(`  - Contact: ${ticket.contact.name} (${ticket.contact.number})`);
    
    // Buscar informações do WhatsApp
    const whatsapp = await Whatsapp.findOne({
      where: { companyId: 1 }
    });
    
    if (whatsapp) {
      console.log('\n📱 Estado da conexão WhatsApp:');
      console.log(`  - ID: ${whatsapp.id}`);
      console.log(`  - Name: ${whatsapp.name}`);
      console.log(`  - Integration ID: ${whatsapp.integrationId}`);
      console.log(`  - Prompt ID: ${whatsapp.promptId}`);
    }
    
    // Verificar condições para disparo de integração
    console.log('\n🔧 Verificando condições para handleMessageIntegration:');
    
    const conditions = {
      'msg.key.fromMe': false, // Simulando mensagem recebida
      '!ticket.isGroup': !ticket.isGroup,
      '!ticket.queue': !ticket.queue,
      '!ticket.user': !ticket.user,
      '!isNil(whatsapp.integrationId)': whatsapp && whatsapp.integrationId !== null,
      '!ticket.useIntegration': !ticket.useIntegration
    };
    
    let allConditionsMet = true;
    
    for (const [condition, value] of Object.entries(conditions)) {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${condition}: ${value}`);
      if (!value) allConditionsMet = false;
    }
    
    console.log(`\n🎯 Resultado: ${allConditionsMet ? '✅ TODAS as condições atendidas - handleMessageIntegration DEVERIA ser chamada' : '❌ Algumas condições NÃO atendidas - handleMessageIntegration NÃO será chamada'}`);
    
    if (!allConditionsMet) {
      console.log('\n💡 Possíveis soluções:');
      if (ticket.queue) {
        console.log('  - Ticket está em um setor. Remover do setor ou configurar integração no setor.');
      }
      if (ticket.user) {
        console.log('  - Ticket está atribuído a um usuário. Desatribuir o ticket.');
      }
      if (!whatsapp || !whatsapp.integrationId) {
        console.log('  - WhatsApp não tem integração configurada. Configurar integração.');
      }
      if (ticket.useIntegration) {
        console.log('  - Ticket já está usando integração. Verificar se é a integração correta.');
      }
    }
    
    console.log('\n✅ Investigação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante investigação:', error);
  } finally {
    await sequelize.close();
  }
}

debugTicketConditions();