"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Yup = __importStar(require("yup"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const AIAgent_1 = __importDefault(require("../../models/AIAgent"));
const ShowAIAgentService_1 = __importDefault(require("./ShowAIAgentService"));
const CreateAIAgentService = async (agentData) => {
    const { name, provider, model, apiKey, prompt, companyId, responseInterval = 1000, functions = {}, activeFunctions = [], isActive = true, queueId } = agentData;
    const agentSchema = Yup.object().shape({
        name: Yup.string().required("ERR_AI_AGENT_NAME_REQUIRED"),
        provider: Yup.string().required("ERR_AI_AGENT_PROVIDER_REQUIRED"),
        model: Yup.string().required("ERR_AI_AGENT_MODEL_REQUIRED"),
        apiKey: Yup.string().required("ERR_AI_AGENT_API_KEY_REQUIRED"),
        prompt: Yup.string().required("ERR_AI_AGENT_PROMPT_REQUIRED"),
        companyId: Yup.number().required("ERR_AI_AGENT_COMPANY_ID_REQUIRED"),
        responseInterval: Yup.number().min(100).max(10000)
    });
    try {
        await agentSchema.validate({
            name,
            provider,
            model,
            apiKey,
            prompt,
            companyId,
            responseInterval
        });
    }
    catch (err) {
        throw new AppError_1.default(`${JSON.stringify(err, undefined, 2)}`);
    }
    let aiAgent = await AIAgent_1.default.create({
        name,
        provider,
        model,
        apiKey,
        prompt,
        responseInterval,
        functions,
        activeFunctions,
        isActive,
        companyId,
        queueId
    });
    aiAgent = await (0, ShowAIAgentService_1.default)({ agentId: aiAgent.id, companyId });
    return aiAgent;
};
exports.default = CreateAIAgentService;
