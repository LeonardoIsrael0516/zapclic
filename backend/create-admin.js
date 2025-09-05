const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Configuração do banco
const sequelize = new Sequelize('zapclic4', 'postgres', '12345678', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');

    // Verificar se o usuário admin já existe
    const [results] = await sequelize.query(
      'SELECT id, email FROM "Users" WHERE email = \'admin@admin.com\';'
    );

    if (results.length > 0) {
      console.log('Usuário admin já existe:', results[0]);
      
      // Atualizar a senha do usuário existente
      const passwordHash = await bcrypt.hash('123456', 8);
      await sequelize.query(
        'UPDATE "Users" SET "passwordHash" = :passwordHash WHERE email = \'admin@admin.com\';',
        {
          replacements: { passwordHash },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      console.log('Senha do usuário admin atualizada para: 123456');
    } else {
      // Criar novo usuário admin
      const passwordHash = await bcrypt.hash('123456', 8);
      const now = new Date();
      
      await sequelize.query(
        `INSERT INTO "Users" (name, email, profile, "passwordHash", "companyId", "createdAt", "updatedAt", "super") 
         VALUES (:name, :email, :profile, :passwordHash, :companyId, :createdAt, :updatedAt, :super);`,
        {
          replacements: {
            name: 'Admin',
            email: 'admin@admin.com',
            profile: 'admin',
            passwordHash,
            companyId: 1,
            createdAt: now,
            updatedAt: now,
            super: true
          },
          type: sequelize.QueryTypes.INSERT
        }
      );
      console.log('Usuário admin criado com sucesso!');
    }

    // Verificar se a empresa existe
    const [companies] = await sequelize.query(
      'SELECT id, name FROM "Companies" WHERE id = 1;'
    );

    if (companies.length === 0) {
      console.log('Empresa não encontrada. Criando empresa padrão...');
      const now = new Date();
      
      await sequelize.query(
        `INSERT INTO "Companies" (id, name, "planId", "dueDate", "createdAt", "updatedAt") 
         VALUES (:id, :name, :planId, :dueDate, :createdAt, :updatedAt);`,
        {
          replacements: {
            id: 1,
            name: 'Empresa 1',
            planId: 1,
            dueDate: '2093-03-14 04:00:00+01',
            createdAt: now,
            updatedAt: now
          },
          type: sequelize.QueryTypes.INSERT
        }
      );
      console.log('Empresa criada com sucesso!');
    } else {
      console.log('Empresa encontrada:', companies[0]);
      
      // Atualizar data de vencimento da empresa
      await sequelize.query(
        'UPDATE "Companies" SET "dueDate" = \'2093-03-14 04:00:00+01\' WHERE id = 1;'
      );
      console.log('Data de vencimento da empresa atualizada.');
    }

    console.log('\n=== CREDENCIAIS DE LOGIN ===');
    console.log('Email: admin@admin.com');
    console.log('Senha: 123456');
    console.log('============================\n');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();