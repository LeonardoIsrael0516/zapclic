"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.removeColumn('Prompts', 'voice');
        await queryInterface.removeColumn('Prompts', 'voiceKey');
        await queryInterface.removeColumn('Prompts', 'voiceRegion');
        await queryInterface.changeColumn('Prompts', 'temperature', {
            type: sequelize_1.DataTypes.FLOAT
        });
        await queryInterface.addColumn("Prompts", 'model', {
            type: sequelize_1.DataTypes.STRING
        });
    },
    down: async (queryInterface) => {
        await queryInterface.addColumn('Prompts', 'voice', {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true
        });
        await queryInterface.addColumn('Prompts', 'voiceKey', {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true
        });
        await queryInterface.addColumn('Prompts', 'voiceRegion', {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true
        });
        await queryInterface.removeColumn('Prompts', 'model');
        await queryInterface.changeColumn('Prompts', 'temperature', {
            type: sequelize_1.DataTypes.INTEGER
        });
    }
};
