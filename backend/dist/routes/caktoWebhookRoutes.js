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
const express_1 = __importDefault(require("express"));
const CaktoWebhookController = __importStar(require("../controllers/CaktoWebhookController"));
const validateCaktoWebhook_1 = require("../middleware/validateCaktoWebhook");
const caktoWebhookRoutes = express_1.default.Router();
// Rota para receber webhooks da Cakto (COM validação de secret)
caktoWebhookRoutes.post("/cakto/webhook", validateCaktoWebhook_1.validateCaktoWebhook, CaktoWebhookController.processWebhook);
// Rota GET para verificação inicial do webhook (algumas plataformas testam com GET)
caktoWebhookRoutes.get("/cakto/webhook", CaktoWebhookController.testWebhook);
// Rota para testar o webhook (SEM validação de secret - apenas para testes)
caktoWebhookRoutes.post("/cakto/webhook/test", CaktoWebhookController.processWebhook);
// Rota para verificar se o webhook está funcionando
caktoWebhookRoutes.get("/cakto/webhook/test", CaktoWebhookController.testWebhook);
exports.default = caktoWebhookRoutes;
