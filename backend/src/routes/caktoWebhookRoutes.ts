import express from "express";
import * as CaktoWebhookController from "../controllers/CaktoWebhookController";
import { validateCaktoWebhook } from "../middleware/validateCaktoWebhook";

const caktoWebhookRoutes = express.Router();

// Rota para receber webhooks da Cakto (COM validação de secret)
caktoWebhookRoutes.post("/cakto/webhook", validateCaktoWebhook, CaktoWebhookController.processWebhook);

// Rota para testar o webhook (SEM validação de secret - apenas para testes)
caktoWebhookRoutes.post("/cakto/webhook/test", CaktoWebhookController.processWebhook);

// Rota para verificar se o webhook está funcionando
caktoWebhookRoutes.get("/cakto/webhook/test", CaktoWebhookController.testWebhook);

export default caktoWebhookRoutes;
