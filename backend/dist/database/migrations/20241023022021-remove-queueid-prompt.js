"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.removeColumn('Prompts', 'queueId');
    },
    down: async (queryInterface) => {
        await queryInterface.addColumn('Prompts', 'queueId', {
            type: sequelize_1.DataTypes.INTEGER,
            references: { model: "Queues", key: "id" },
            onUpdate: "NO ACTION",
            onDelete: "NO ACTION",
            allowNull: false
        });
    }
};
