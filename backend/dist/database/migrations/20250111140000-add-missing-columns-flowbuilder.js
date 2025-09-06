"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        const tableDescription = await queryInterface.describeTable("FlowBuilders");
        const promises = [];
        // Adicionar company_id apenas se não existir
        if (!tableDescription.company_id) {
            promises.push(queryInterface.addColumn("FlowBuilders", "company_id", {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            }));
        }
        // Adicionar variables apenas se não existir
        if (!tableDescription.variables) {
            promises.push(queryInterface.addColumn("FlowBuilders", "variables", {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true
            }));
        }
        // Adicionar config apenas se não existir
        if (!tableDescription.config) {
            promises.push(queryInterface.addColumn("FlowBuilders", "config", {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true
            }));
        }
        return Promise.all(promises);
    },
    down: (queryInterface) => {
        return Promise.all([
            queryInterface.removeColumn("FlowBuilders", "company_id"),
            queryInterface.removeColumn("FlowBuilders", "variables"),
            queryInterface.removeColumn("FlowBuilders", "config")
        ]);
    }
};
