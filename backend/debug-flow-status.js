const { Sequelize } = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '12345678',
  database: 'zapclic',
  logging: false
});

async function debugFlowStatus() {
  try {
    console.log('🔍 [DEBUG] Iniciando debug do status do fluxo...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // Listar todas as tabelas para encontrar a tabela de tickets
    console.log('\n📋 Listando tabelas disponíveis...');
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%icket%';"
    );
    
    console.log('🔍 Tabelas encontradas com "icket":', results);
    
    // Tentar diferentes variações do nome da tabela
    const tableVariations = ['Tickets', 'tickets', 'Ticket', 'ticket'];
    let correctTableName = null;
    
    for (const tableName of tableVariations) {
      try {
        const [testResults] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}" LIMIT 1;`);
        console.log(`✅ Tabela "${tableName}" existe! Registros: ${testResults[0].count}`);
        correctTableName = tableName;
        break;
      } catch (error) {
        console.log(`❌ Tabela "${tableName}" não existe`);
      }
    }
    
    if (!correctTableName) {
      console.log('❌ Nenhuma tabela de tickets encontrada');
      return;
    }
    
    // Buscar tickets existentes
    console.log(`\n📊 Buscando tickets na tabela "${correctTableName}"...`);
    const [tickets] = await sequelize.query(
      `SELECT id, status, "contactId", "whatsappId" FROM "${correctTableName}" ORDER BY id DESC LIMIT 5;`
    );
    
    console.log(`📊 Total de tickets encontrados: ${tickets.length}`);
    
    if (tickets.length === 0) {
      console.log('❌ Nenhum ticket encontrado');
      return;
    }
    
    const ticket = tickets[0];
    console.log('📋 Usando ticket:', ticket);
    
    console.log('\n🔧 Testando atualização direta do status para "chatbot"...');
    
    // Testar atualização direta no banco
    const [updateResult] = await sequelize.query(
      `UPDATE "${correctTableName}" SET status = $1 WHERE id = $2;`,
      {
        bind: ['chatbot', ticket.id]
      }
    );
    
    console.log('✅ Comando de atualização executado');
    
    // Verificar se a atualização funcionou
    const [updatedTickets] = await sequelize.query(
      `SELECT id, status FROM "${correctTableName}" WHERE id = $1;`,
      {
        bind: [ticket.id]
      }
    );
    
    const updatedTicket = updatedTickets[0];
    console.log('📋 Status após atualização:', updatedTicket.status);
    
    if (updatedTicket.status === 'chatbot') {
      console.log('✅ Status "chatbot" foi definido com sucesso!');
    } else {
      console.log('❌ Falha ao definir status "chatbot"');
    }
    
    // Testar mudança de volta para pending
    console.log('\n🔄 Testando mudança de volta para "pending"...');
    await sequelize.query(
      `UPDATE "${correctTableName}" SET status = $1 WHERE id = $2;`,
      {
        bind: ['pending', ticket.id]
      }
    );
    
    const [revertedTickets] = await sequelize.query(
      `SELECT id, status FROM "${correctTableName}" WHERE id = $1;`,
      {
        bind: [ticket.id]
      }
    );
    
    const revertedTicket = revertedTickets[0];
    console.log('📋 Status após reversão:', revertedTicket.status);
    
    console.log('\n✅ Teste de status concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

debugFlowStatus();