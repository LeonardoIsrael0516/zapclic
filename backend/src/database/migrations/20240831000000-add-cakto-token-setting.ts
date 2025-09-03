import { QueryInterface, DataTypes, QueryTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Primeiro, verificar se existe pelo menos uma empresa
    const companies: any[] = await queryInterface.sequelize.query(
      'SELECT id FROM "Companies" LIMIT 1',
      { type: QueryTypes.SELECT }
    );

    let companyId = 1;
    
    // Se não existir nenhuma empresa, criar uma empresa padrão
    if (companies.length === 0) {
      await queryInterface.bulkInsert("Companies", [
        {
          name: "Empresa Padrão",
          phone: "",
          email: "",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } else {
      companyId = companies[0].id;
    }

    // Agora inserir o setting
    return queryInterface.bulkInsert("Settings", [
      {
        key: "caktoToken",
        value: "",
        companyId: companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Settings", {
      key: "caktoToken"
    });
  }
};
