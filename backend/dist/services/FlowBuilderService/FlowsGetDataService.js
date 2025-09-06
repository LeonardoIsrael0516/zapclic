"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FlowBuilder_1 = require("../../models/FlowBuilder");
const FlowsGetDataService = async ({ companyId, idFlow }) => {
    try {
        // Realiza a consulta com paginação usando findAndCountAll
        const { count, rows } = await FlowBuilder_1.FlowBuilderModel.findAndCountAll({
            where: {
                company_id: companyId,
                id: idFlow
            }
        });
        let flow = rows[0];
        if (!flow) {
            throw new Error(`Fluxo com ID ${idFlow} não encontrado para a empresa ${companyId}`);
        }
        return {
            flow: flow
        };
    }
    catch (error) {
        console.error('Erro ao consultar Fluxo:', error);
        throw error;
    }
};
exports.default = FlowsGetDataService;
