"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.show = exports.store = exports.index = void 0;
const CreateAIAgentService_1 = __importDefault(require("../services/AIAgentService/CreateAIAgentService"));
const DeleteAIAgentService_1 = __importDefault(require("../services/AIAgentService/DeleteAIAgentService"));
const ListAIAgentsService_1 = __importDefault(require("../services/AIAgentService/ListAIAgentsService"));
const ShowAIAgentService_1 = __importDefault(require("../services/AIAgentService/ShowAIAgentService"));
const UpdateAIAgentService_1 = __importDefault(require("../services/AIAgentService/UpdateAIAgentService"));
const index = async (req, res) => {
    const { companyId } = req.user;
    const { searchParam, pageNumber } = req.query;
    const { aiAgents, count, hasMore } = await (0, ListAIAgentsService_1.default)({
        searchParam,
        pageNumber,
        companyId
    });
    return res.json({ aiAgents, count, hasMore });
};
exports.index = index;
const store = async (req, res) => {
    const { companyId } = req.user;
    const agentData = req.body;
    const aiAgent = await (0, CreateAIAgentService_1.default)({
        ...agentData,
        companyId
    });
    return res.status(200).json(aiAgent);
};
exports.store = store;
const show = async (req, res) => {
    const { agentId } = req.params;
    const { companyId } = req.user;
    const aiAgent = await (0, ShowAIAgentService_1.default)({ agentId, companyId });
    return res.status(200).json(aiAgent);
};
exports.show = show;
const update = async (req, res) => {
    const { companyId } = req.user;
    const agentData = req.body;
    const { agentId } = req.params;
    const aiAgent = await (0, UpdateAIAgentService_1.default)({
        agentData,
        agentId,
        companyId
    });
    return res.status(200).json(aiAgent);
};
exports.update = update;
const remove = async (req, res) => {
    const { agentId } = req.params;
    const { companyId } = req.user;
    await (0, DeleteAIAgentService_1.default)({ agentId, companyId });
    return res.status(200).json({ message: "AI Agent deleted" });
};
exports.remove = remove;
