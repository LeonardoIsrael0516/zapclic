"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCaktoWebhook = void 0;
const logger_1 = require("../utils/logger");
const Setting_1 = __importDefault(require("../models/Setting"));
const validateCaktoWebhook = async (req, res, next) => {
    try {
        logger_1.logger.info("=== INICIANDO VALIDAÇÃO WEBHOOK CAKTO ===");
        logger_1.logger.info("URL:", req.url);
        logger_1.logger.info("Method:", req.method);
        logger_1.logger.info("Body:", JSON.stringify(req.body, null, 2));
        const { body } = req;
        // Verificar se o payload contém os campos obrigatórios
        if (!body.data || !body.event || !body.secret) {
            logger_1.logger.error("Webhook Cakto inválido - campos obrigatórios ausentes:", body);
            return res.status(400).json({
                error: "Payload inválido - campos obrigatórios ausentes"
            });
        }
        logger_1.logger.info("Secret recebido:", body.secret);
        // Buscar o token configurado no painel admin (busca na empresa 1 como padrão)
        const caktoTokenSetting = await Setting_1.default.findOne({
            where: { key: "caktoToken", companyId: 1 }
        });
        let expectedSecret;
        if (caktoTokenSetting && caktoTokenSetting.value) {
            // Usar o token configurado no painel admin
            expectedSecret = caktoTokenSetting.value;
            logger_1.logger.info("Usando token da Cakto configurado no painel admin");
        }
        else {
            // Fallback para o .env se não estiver configurado no painel
            expectedSecret = process.env.CAKTO_WEBHOOK_SECRET;
            if (!expectedSecret) {
                logger_1.logger.error("Token da Cakto não configurado nem no painel admin nem no .env");
                return res.status(500).json({
                    error: "Token da Cakto não configurado. Configure no painel admin em Configurações > Integrações > CAKTO"
                });
            }
            logger_1.logger.info("Usando token da Cakto do arquivo .env (configure no painel admin para melhor gerenciamento)");
        }
        logger_1.logger.info("Token esperado:", expectedSecret);
        logger_1.logger.info("Tokens são iguais?", body.secret === expectedSecret);
        if (body.secret !== expectedSecret) {
            logger_1.logger.error("Webhook Cakto inválido - secret incorreto:", {
                received: body.secret,
                expectedLength: expectedSecret.length
            });
            return res.status(401).json({
                error: "Secret inválido"
            });
        }
        // Verificar se contém dados do cliente
        if (!body.data.customer || !body.data.customer.email) {
            logger_1.logger.error("Webhook Cakto inválido - dados do cliente ausentes:", body);
            return res.status(400).json({
                error: "Dados do cliente ausentes no payload"
            });
        }
        // Verificar se contém valor do pagamento
        if (!body.data.amount) {
            logger_1.logger.error("Webhook Cakto inválido - valor do pagamento ausente:", body);
            return res.status(400).json({
                error: "Valor do pagamento ausente no payload"
            });
        }
        // Log para debug
        logger_1.logger.info("Webhook Cakto validado com sucesso");
        next();
    }
    catch (error) {
        logger_1.logger.error("Erro na validação do webhook Cakto:", error);
        return res.status(500).json({
            error: "Erro interno na validação do webhook"
        });
    }
};
exports.validateCaktoWebhook = validateCaktoWebhook;
