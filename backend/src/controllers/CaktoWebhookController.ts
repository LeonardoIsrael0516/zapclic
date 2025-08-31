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
    logger.info("Cakto Webhook recebido:", JSON.stringify(payload, null, 2));

    // Verificar se é um evento de pagamento aprovado
    if (payload.event !== "purchase_approved") {
      logger.info(`Evento ${payload.event} ignorado - não é purchase_approved`);
      return res.status(200).json({ message: "Evento ignorado" });
    }

    // Verificar se o pagamento foi realmente aprovado
    if (payload.data.status !== "paid") {
      logger.info(`Status ${payload.data.status} ignorado - não é paid`);
      return res.status(200).json({ message: "Status não é paid" });
    }

    const { data } = payload;

    // Processar pagamento através do serviço
    const result = await CaktoIntegrationService.processPayment({
      amount: data.amount,
      customer: data.customer,
      paidAt: data.paidAt,
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
  return res.status(200).json({
    message: "Webhook Cakto funcionando",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
};
