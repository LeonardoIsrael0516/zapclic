"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        try {
            // Verifica se a coluna já existe
            const tableDescription = await queryInterface.describeTable("FlowBuilders");
            if (!tableDescription.company_id) {
                // Adiciona a coluna se ela não existir
                await queryInterface.addColumn("FlowBuilders", "company_id", {
                    type: sequelize_1.DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0
                });
            }
        }
        catch (error) {
            console.log("Erro ao verificar/adicionar coluna company_id:", error);
            throw error;
        }
    },
    down: async (queryInterface) => {
        try {
            const tableDescription = await queryInterface.describeTable("FlowBuilders");
            if (tableDescription.company_id) {
                await queryInterface.removeColumn("FlowBuilders", "company_id");
            }
        }
        catch (error) {
            console.log("Erro ao remover coluna company_id:", error);
            throw error;
        }
    }
};
