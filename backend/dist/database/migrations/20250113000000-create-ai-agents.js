"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.createTable("AIAgents", {
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            provider: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                defaultValue: "openai"
            },
            model: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                defaultValue: "gpt-3.5-turbo"
            },
            apiKey: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false
            },
            prompt: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            responseInterval: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1000
            },
            functions: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true
            },
            activeFunctions: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true
            },
            isActive: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            companyId: {
                type: sequelize_1.DataTypes.INTEGER,
                references: { model: "Companies", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
                allowNull: false
            },
            queueId: {
                type: sequelize_1.DataTypes.INTEGER,
                references: { model: "Queues", key: "id" },
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
        return queryInterface.dropTable("AIAgents");
    }
};
