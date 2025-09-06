"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.createTable("CaktoWebhookLogs", {
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            orderId: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            event: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            status: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            amount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            customerEmail: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            customerName: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            customerPhone: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true
            },
            payload: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: false
            },
            processed: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            processingStatus: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            processingMessage: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            companyId: {
                type: sequelize_1.DataTypes.INTEGER,
                references: { model: "Companies", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
                allowNull: true
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false
            }
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable("CaktoWebhookLogs");
    }
};
