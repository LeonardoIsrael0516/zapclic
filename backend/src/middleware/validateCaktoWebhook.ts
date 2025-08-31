import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import Setting from "../models/Setting";

export const validateCaktoWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info("=== INICIANDO VALIDAÇÃO WEBHOOK CAKTO ===");
    logger.info("URL:", req.url);
    logger.info("Method:", req.method);
    logger.info("Body:", JSON.stringify(req.body, null, 2));

    const { body } = req;

    // Verificar se o payload contém os campos obrigatórios
    if (!body.data || !body.event || !body.secret) {
      logger.error("Webhook Cakto inválido - campos obrigatórios ausentes:", body);
      return res.status(400).json({
        error: "Payload inválido - campos obrigatórios ausentes"
      });
    }

    logger.info("Secret recebido:", body.secret);

    // Buscar o token configurado no painel admin (busca na empresa 1 como padrão)
    const caktoTokenSetting = await Setting.findOne({
      where: { key: "caktoToken", companyId: 1 }
    });

    let expectedSecret: string;

    if (caktoTokenSetting && caktoTokenSetting.value) {
      // Usar o token configurado no painel admin
      expectedSecret = caktoTokenSetting.value;
      logger.info("Usando token da Cakto configurado no painel admin");
    } else {
      // Fallback para o .env se não estiver configurado no painel
      expectedSecret = process.env.CAKTO_WEBHOOK_SECRET;
      if (!expectedSecret) {
        logger.error("Token da Cakto não configurado nem no painel admin nem no .env");
        return res.status(500).json({
          error: "Token da Cakto não configurado. Configure no painel admin em Configurações > Integrações > CAKTO"
        });
      }
      logger.info("Usando token da Cakto do arquivo .env (configure no painel admin para melhor gerenciamento)");
    }

    logger.info("Token esperado:", expectedSecret);
    logger.info("Tokens são iguais?", body.secret === expectedSecret);

    if (body.secret !== expectedSecret) {
      logger.error("Webhook Cakto inválido - secret incorreto:", {
        received: body.secret,
        expectedLength: expectedSecret.length
      });
      return res.status(401).json({
        error: "Secret inválido"
      });
    }

    // Verificar se contém dados do cliente
    if (!body.data.customer || !body.data.customer.email) {
      logger.error("Webhook Cakto inválido - dados do cliente ausentes:", body);
      return res.status(400).json({
        error: "Dados do cliente ausentes no payload"
      });
    }

    // Verificar se contém valor do pagamento
    if (!body.data.amount) {
      logger.error("Webhook Cakto inválido - valor do pagamento ausente:", body);
      return res.status(400).json({
        error: "Valor do pagamento ausente no payload"
      });
    }

    // Log para debug
    logger.info("Webhook Cakto validado com sucesso");

    next();
  } catch (error) {
    logger.error("Erro na validação do webhook Cakto:", error);
    return res.status(500).json({
      error: "Erro interno na validação do webhook"
    });
  }
};
