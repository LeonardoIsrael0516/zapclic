const { FlowKeywordService } = require('./dist/services/FlowBuilderService/FlowKeywordService');
const ContactModel = require('./dist/models/Contact').default;
const TicketModel = require('./dist/models/Ticket').default;
const WhatsappModel = require('./dist/models/Whatsapp').default;
const { FlowBuilderModel } = require('./dist/models/FlowBuilder');
const sequelize = require('./dist/database').default;

async function testAutoSendNewContact() {
  try {
    console.log('🧪 Testando disparo automático para novo contato...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Buscar um contato existente
    const contact = await ContactModel.findOne({
      where: { companyId: 1 }
    });
    
    if (!contact) {
      console.log('❌ Nenhum contato encontrado');
      return;
    }
    
    console.log(`📞 Contato encontrado: ${contact.name} (${contact.number})`);
    
    // Buscar um ticket existente
    const ticket = await TicketModel.findOne({
      where: { 
        contactId: contact.id,
        companyId: 1
      }
    });
    
    if (!ticket) {
      console.log('❌ Nenhum ticket encontrado');
      return;
    }
    
    console.log(`🎫 Ticket encontrado: ${ticket.id}`);
    
    // Verificar fluxos com autoSend habilitado
    const flows = await FlowBuilderModel.findAll({
      where: { company_id: 1 }
    });
    
    console.log('\n🔄 Fluxos disponíveis:');
    flows.forEach(f => {
      const config = f.config;
      console.log(`ID: ${f.id}, Nome: ${f.name}, AutoSend: ${config?.autoSend?.enabled || false}`);
    });
    
    // Testar processMessage com isNewContact = true
    console.log('\n🔄 Testando processMessage com isNewContact = true...');
    const result = await FlowKeywordService.processMessage(
      'Olá, primeira mensagem',
      contact,
      ticket,
      1, // companyId
      true, // isNewContact
      ticket.whatsappId
    );
    
    console.log(`📊 Resultado do processMessage: ${result}`);
    
    if (result) {
      console.log('✅ Fluxo foi disparado com sucesso!');
    } else {
      console.log('❌ Fluxo não foi disparado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
  
  process.exit(0);
}

testAutoSendNewContact();