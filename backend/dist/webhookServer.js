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
const cors_1 = __importDefault(require("cors"));
const CaktoWebhookController = __importStar(require("./controllers/CaktoWebhookController"));
const webhookApp = (0, express_1.default)();
// Middleware
webhookApp.use((0, cors_1.default)());
webhookApp.use(express_1.default.json({ limit: '10mb' }));
// Log de requisições
webhookApp.use((req, res, next) => {
    console.log(`WEBHOOK: ${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log("Body:", JSON.stringify(req.body, null, 2));
    }
    next();
});
// Rotas do webhook Cakto
webhookApp.post("/webhook", CaktoWebhookController.processWebhook);
webhookApp.post("/webhook/test", CaktoWebhookController.processWebhook);
webhookApp.get("/webhook/test", CaktoWebhookController.testWebhook);
// Teste simples
webhookApp.get("/test", (req, res) => {
    res.json({
        message: "🚀 Webhook Cakto funcionando!",
        timestamp: new Date().toISOString(),
        endpoints: {
            "GET /test": "Este endpoint",
            "GET /webhook/test": "Teste do webhook",
            "POST /webhook/test": "Webhook de teste",
            "POST /webhook": "Webhook de produção"
        }
    });
});
webhookApp.post("/test", (req, res) => {
    res.json({
        message: "✅ Dados recebidos!",
        received: req.body,
        timestamp: new Date().toISOString()
    });
});
// Iniciar servidor na porta 9090
const PORT = process.env.WEBHOOK_PORT || 9090;
webhookApp.listen(PORT, () => {
    console.log(`🎯 Webhook server rodando na porta ${PORT}`);
    console.log(`📡 URLs disponíveis:`);
    console.log(`   GET  http://localhost:${PORT}/test`);
    console.log(`   POST http://localhost:${PORT}/webhook/test`);
    console.log(`   POST http://localhost:${PORT}/webhook`);
});
exports.default = webhookApp;
