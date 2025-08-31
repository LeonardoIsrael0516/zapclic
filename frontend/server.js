//simple express server to run frontend production build;
const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();

// Middleware para parse de JSON
app.use(express.json({ limit: '10mb' }));

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Webhook da Cakto - Processar diretamente
app.post("/cakto/webhook", async (req, res) => {
  try {
    console.log("=== WEBHOOK CAKTO RECEBIDO NO FRONTEND ===");
    console.log("Payload:", JSON.stringify(req.body, null, 2));
    
    const payload = req.body;

    // Verificar se é um evento de pagamento aprovado
    if (payload.event !== "purchase_approved") {
      console.log(`Evento ${payload.event} ignorado`);
      return res.status(200).json({ 
        success: true, 
        message: "Evento ignorado",
        received: true 
      });
    }

    // Verificar se o pagamento foi aprovado ou é teste
    const validStatuses = ["paid", "waiting_payment"];
    if (!validStatuses.includes(payload.data.status)) {
      console.log(`Status ${payload.data.status} ignorado`);
      return res.status(200).json({ 
        success: true, 
        message: "Status inválido",
        received: true 
      });
    }

    const { data } = payload;
    console.log(`Processando: ${data.customer.name} (${data.customer.email}) - R$ ${data.amount}`);
    
    // Fazer proxy para o backend
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
    const response = await axios.post(`${backendUrl}/cakto/webhook/process`, {
      amount: data.amount,
      customer: data.customer,
      paidAt: data.paidAt || new Date().toISOString(),
      orderId: data.id,
      event: payload.event,
      payload: payload
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });
    
    console.log("✅ Resposta do backend:", response.data);
    return res.status(200).json(response.data);
    
  } catch (error) {
    console.error("❌ Erro no webhook Cakto:", error.message);
    if (error.response) {
      console.error("Resposta do backend:", error.response.data);
      return res.status(200).json({ 
        success: false,
        error: "Erro no backend",
        details: error.response.data 
      });
    }
    return res.status(200).json({ 
      success: false,
      error: "Erro interno do servidor",
      message: error.message 
    });
  }
});

// Webhook de teste da Cakto - Mesmo processamento
app.post("/cakto/webhook/test", async (req, res) => {
  try {
    console.log("=== WEBHOOK TESTE CAKTO RECEBIDO NO FRONTEND ===");
    console.log("Payload:", JSON.stringify(req.body, null, 2));
    
    const payload = req.body;
    const { data } = payload;
    
    // Fazer proxy para o backend
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
    const response = await axios.post(`${backendUrl}/cakto/webhook/process`, {
      amount: data.amount,
      customer: data.customer,
      paidAt: data.paidAt || new Date().toISOString(),
      orderId: data.id,
      event: payload.event || "purchase_approved",
      payload: payload
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });
    
    console.log("✅ Resposta do backend:", response.data);
    return res.status(200).json(response.data);
    
  } catch (error) {
    console.error("❌ Erro no webhook teste Cakto:", error.message);
    if (error.response) {
      console.error("Resposta do backend:", error.response.data);
      return res.status(200).json({ 
        success: false,
        error: "Erro no backend",
        details: error.response.data 
      });
    }
    return res.status(200).json({ 
      success: false,
      error: "Erro interno do servidor",
      message: error.message 
    });
  }
});

// Teste GET do webhook
app.get("/cakto/webhook/test", (req, res) => {
  res.json({
    message: "🚀 Webhook Cakto funcionando via frontend!",
    timestamp: new Date().toISOString(),
    frontend_server: "Express proxy",
    backend_url: process.env.REACT_APP_BACKEND_URL || "http://localhost:8080"
  });
});

// Servir arquivos estáticos do React
app.use(express.static(path.join(__dirname, "build")));

// Todas as outras rotas vão para o React
app.get("/*", function (req, res) {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Frontend server rodando na porta ${PORT}`);
  console.log(`📡 Webhook Cakto disponível em: http://localhost:${PORT}/cakto/webhook`);
});

