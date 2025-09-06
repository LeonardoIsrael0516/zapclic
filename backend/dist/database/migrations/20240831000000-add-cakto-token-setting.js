"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert("Settings", [
            {
                key: "caktoToken",
                value: "",
                companyId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },
    down: (queryInterface) => {
        return queryInterface.bulkDelete("Settings", {
            key: "caktoToken"
        });
    }
};
