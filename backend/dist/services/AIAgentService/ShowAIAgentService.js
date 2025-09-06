"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../../errors/AppError"));
const AIAgent_1 = __importDefault(require("../../models/AIAgent"));
const Company_1 = __importDefault(require("../../models/Company"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const ShowAIAgentService = async ({ agentId, companyId }) => {
    const aiAgent = await AIAgent_1.default.findOne({
        where: {
            id: agentId,
            companyId
        },
        include: [
            {
                model: Company_1.default,
                as: "company",
                attributes: ["id", "name"]
            },
            {
                model: Queue_1.default,
                as: "queue",
                attributes: ["id", "name", "color"]
            }
        ]
    });
    if (!aiAgent) {
        throw new AppError_1.default("ERR_NO_AI_AGENT_FOUND", 404);
    }
    return aiAgent;
};
exports.default = ShowAIAgentService;
