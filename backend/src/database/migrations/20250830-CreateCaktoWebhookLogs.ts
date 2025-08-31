import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("CaktoWebhookLogs", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      event: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      customerEmail: {
        type: DataTypes.STRING,
        allowNull: false
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      customerPhone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      processingStatus: {
        type: DataTypes.STRING,
        allowNull: false
      },
      processingMessage: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
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
    return queryInterface.dropTable("CaktoWebhookLogs");
  }
};
