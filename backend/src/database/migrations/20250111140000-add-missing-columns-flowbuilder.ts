import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("FlowBuilders", "company_id", {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      }),
      queryInterface.addColumn("FlowBuilders", "variables", {
        type: DataTypes.JSON,
        allowNull: true
      }),
      queryInterface.addColumn("FlowBuilders", "config", {
        type: DataTypes.JSON,
        allowNull: true
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("FlowBuilders", "company_id"),
      queryInterface.removeColumn("FlowBuilders", "variables"),
      queryInterface.removeColumn("FlowBuilders", "config")
    ]);
  }
};