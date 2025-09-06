"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../../errors/AppError"));
const ShowAIAgentService_1 = __importDefault(require("./ShowAIAgentService"));
const DeleteAIAgentService = async ({ agentId, companyId }) => {
    const aiAgent = await (0, ShowAIAgentService_1.default)({ agentId, companyId });
    if (!aiAgent) {
        throw new AppError_1.default("ERR_NO_AI_AGENT_FOUND", 404);
    }
    await aiAgent.destroy();
};
exports.default = DeleteAIAgentService;
