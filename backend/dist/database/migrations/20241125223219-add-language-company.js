"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.addColumn("Companies", "language", {
            type: sequelize_1.DataTypes.STRING,
            defaultValue: "pt"
        });
    },
    down: async (queryInterface) => {
        await queryInterface.removeColumn("Campaigns", "language");
    }
};
