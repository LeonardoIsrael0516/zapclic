import express from "express";
import cors from "cors";
import * as CaktoWebhookController from "./controllers/CaktoWebhookController";

const webhookApp = express();

// Middleware
webhookApp.use(cors());
webhookApp.use(express.json({ limit: '10mb' }));

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

export default webhookApp;
