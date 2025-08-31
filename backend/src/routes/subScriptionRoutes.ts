import express from "express";
import isAuth from "../middleware/isAuth";

import * as SubscriptionController from "../controllers/SubscriptionController";
import * as CaktoWebhookController from "../controllers/CaktoWebhookController";

const subscriptionRoutes = express.Router();
subscriptionRoutes.post("/subscription", isAuth, SubscriptionController.createSubscription);
subscriptionRoutes.post("/subscription/create/webhook", SubscriptionController.createWebhook);
subscriptionRoutes.post("/subscription/webhook", SubscriptionController.webhook);

// Rotas da Cakto
subscriptionRoutes.post("/cakto/webhook", CaktoWebhookController.processWebhook);
subscriptionRoutes.post("/cakto/webhook/test", CaktoWebhookController.processWebhook);
subscriptionRoutes.post("/cakto/webhook/process", CaktoWebhookController.processWebhook);
subscriptionRoutes.get("/cakto/webhook/test", CaktoWebhookController.testWebhook);

export default subscriptionRoutes;
