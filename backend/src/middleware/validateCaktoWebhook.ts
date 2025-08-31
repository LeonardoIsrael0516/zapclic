import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const validateCaktoWebhook = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req;

    // Verificar se o payload contém os campos obrigatórios
    if (!body.data || !body.event || !body.secret) {
      logger.error("Webhook Cakto inválido - campos obrigatórios ausentes:", body);
      return res.status(400).json({
        error: "Payload inválido - campos obrigatórios ausentes"
      });
    }

    // Validar o secret da Cakto (você deve configurar isso no .env)
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET;
    if (!expectedSecret) {
      logger.error("CAKTO_WEBHOOK_SECRET não configurado no .env");
      return res.status(500).json({
        error: "Configuração do webhook não encontrada"
      });
    }

    if (body.secret !== expectedSecret) {
      logger.error("Webhook Cakto inválido - secret incorreto:", {
        received: body.secret,
        expected: expectedSecret
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
