const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('zapclic', 'postgres', '12345678', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false
});

async function checkFlows() {
  try {
    const flows = await sequelize.query(
      'SELECT id, name FROM "FlowBuilders" LIMIT 5',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Fluxos encontrados:', flows);
    
    if (flows.length === 0) {
      console.log('Nenhum fluxo encontrado. Criando um fluxo de teste...');
      
      await sequelize.query(
        'INSERT INTO "FlowBuilders" (name, "userId", "companyId", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        {
          bind: ['Fluxo Teste', 1, 1],
          type: sequelize.QueryTypes.INSERT
        }
      );
      
      console.log('Fluxo de teste criado!');
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkFlows();