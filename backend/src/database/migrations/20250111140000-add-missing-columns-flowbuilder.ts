import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.describeTable("FlowBuilders").then((tableDescription: any) => {
      const promises: Promise<any>[] = [];
      
      // Adicionar company_id apenas se não existir
      if (!tableDescription.company_id) {
        promises.push(
          queryInterface.addColumn("FlowBuilders", "company_id", {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
          })
        );
      }
      
      // Adicionar variables apenas se não existir
      if (!tableDescription.variables) {
        promises.push(
          queryInterface.addColumn("FlowBuilders", "variables", {
            type: DataTypes.JSON,
            allowNull: true
          })
        );
      }
      
      // Adicionar config apenas se não existir
      if (!tableDescription.config) {
        promises.push(
          queryInterface.addColumn("FlowBuilders", "config", {
            type: DataTypes.JSON,
            allowNull: true
          })
        );
      }
      
      return Promise.all(promises);
    });
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("FlowBuilders", "company_id"),
      queryInterface.removeColumn("FlowBuilders", "variables"),
      queryInterface.removeColumn("FlowBuilders", "config")
    ]);
  }
};