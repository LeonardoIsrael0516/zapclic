import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("AIAgents", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "openai"
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "gpt-3.5-turbo"
      },
      apiKey: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      prompt: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      responseInterval: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1000
      },
      functions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      activeFunctions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      queueId: {
        type: DataTypes.INTEGER,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("AIAgents");
  }
};