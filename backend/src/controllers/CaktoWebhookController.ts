import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import CaktoIntegrationService from "../services/CaktoIntegrationService";

interface CaktoWebhookPayload {
  data: {
    id: string;
    amount: number;
    status: string;
    paidAt: string;
    customer: {
      name: string;
      email: string;
      phone: string;
      docType: string;
      docNumber: string;
    };
    product: {
      id: string;
      name: string;
      type: string;
    };
    subscription?: {
      id: string;
      status: string;
      next_payment_date: string;
    };
  };
  event: string;
  secret: string;
}

export const processWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const payload: CaktoWebhookPayload = req.body;

    // Log do payload recebido
    logger.info("=== CAKTO WEBHOOK RECEBIDO ===");
    logger.info("URL:", req.url);
    logger.info("Method:", req.method);
    logger.info("Headers:", JSON.stringify(req.headers, null, 2));
    logger.info("Payload:", JSON.stringify(payload, null, 2));

    // Verificar se é um evento de pagamento aprovado
    if (payload.event !== "purchase_approved") {
      logger.info(`Evento ${payload.event} ignorado - não é purchase_approved`);
      return res.status(200).json({ message: "Evento ignorado", received: true });
    }

    // Verificar se o pagamento foi realmente aprovado OU se é um teste
    const validStatuses = ["paid", "waiting_payment"]; // Incluindo waiting_payment para testes
    if (!validStatuses.includes(payload.data.status)) {
      logger.info(`Status ${payload.data.status} ignorado - deve ser paid ou waiting_payment`);
      return res.status(200).json({ message: "Status inválido", received: true });
    }

    const { data } = payload;

    logger.info("=== INICIANDO PROCESSAMENTO ===");
    logger.info(`Cliente: ${data.customer.name} (${data.customer.email})`);
    logger.info(`Valor: R$ ${data.amount}`);
    logger.info(`Status: ${data.status}`);

    // Processar pagamento através do serviço
    const result = await CaktoIntegrationService.processPayment({
      amount: data.amount,
      customer: data.customer,
      paidAt: data.paidAt || new Date().toISOString(),
      orderId: data.id,
      event: payload.event,
      payload: payload
    });

    // Resposta de sucesso
    const response = {
      success: true,
      message: "Webhook processado com sucesso",
      isNewCompany: result.isNewCompany,
      company: {
        id: result.company.id,
        name: result.company.name,
        email: result.company.email,
        plan: result.plan.name,
        planValue: result.plan.value,
        dueDate: result.company.dueDate
      },
      user: result.user ? {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        profile: result.user.profile
      } : null
    };

    logger.info("Webhook Cakto processado com sucesso:", JSON.stringify(response, null, 2));

    return res.status(200).json(response);

  } catch (error) {
    logger.error("Erro ao processar webhook Cakto:", error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: "Erro interno do servidor ao processar webhook",
      details: error.message
    });
  }
};

export const testWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info("=== TESTE WEBHOOK CAKTO ===");
  logger.info("URL:", req.url);
  logger.info("Method:", req.method);
  logger.info("Headers:", JSON.stringify(req.headers, null, 2));
  
  // Se for POST, simular processamento
  if (req.method === "POST") {
    logger.info("Body:", JSON.stringify(req.body, null, 2));
    
    try {
      // Tentar processar se tiver dados
      if (req.body && req.body.data && req.body.data.customer) {
        const result = await CaktoIntegrationService.processPayment({
          amount: req.body.data.amount,
          customer: req.body.data.customer,
          paidAt: req.body.data.paidAt || new Date().toISOString(),
          orderId: req.body.data.id,
          event: req.body.event || "purchase_approved",
          payload: req.body
        });
        
        return res.status(200).json({
          message: "🎉 Webhook teste processado com sucesso!",
          result: result,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error("Erro no teste:", error);
      return res.status(200).json({
        message: "❌ Erro no processamento do teste",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return res.status(200).json({
    message: "✅ Webhook Cakto funcionando perfeitamente!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || "8080",
    endpoints: {
      test: "/cakto/webhook/test (GET)",
      webhook_test: "/cakto/webhook/test (POST)",
      webhook_production: "/cakto/webhook (POST)"
    }
  });
};
