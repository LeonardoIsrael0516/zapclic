import React, { useEffect } from "react";
import api from "../../services/api";

// Componente para processar webhooks da Cakto
const CaktoWebhook = () => {
  
  useEffect(() => {
    // Função para processar webhook da Cakto
    const processWebhook = async (payload) => {
      try {
        console.log("=== PROCESSANDO WEBHOOK CAKTO ===");
        console.log("Payload:", payload);

        // Verificar se é um evento de pagamento aprovado
        if (payload.event !== "purchase_approved") {
          console.log(`Evento ${payload.event} ignorado`);
          return { success: false, message: "Evento ignorado" };
        }

        // Verificar se o pagamento foi aprovado ou é teste
        const validStatuses = ["paid", "waiting_payment"];
        if (!validStatuses.includes(payload.data.status)) {
          console.log(`Status ${payload.data.status} ignorado`);
          return { success: false, message: "Status inválido" };
        }

        const { data } = payload;

        // Enviar para o backend processar
        const response = await api.post("/cakto/webhook/process", {
          amount: data.amount,
          customer: data.customer,
          paidAt: data.paidAt || new Date().toISOString(),
          orderId: data.id,
          event: payload.event,
          payload: payload
        });

        console.log("✅ Webhook processado com sucesso:", response.data);
        return response.data;

      } catch (error) {
        console.error("❌ Erro ao processar webhook:", error);
        return { success: false, error: error.message };
      }
    };

    // Verificar se há parâmetros de webhook na URL
    const urlParams = new URLSearchParams(window.location.search);
    const webhookData = urlParams.get('webhook');
    
    if (webhookData) {
      try {
        const payload = JSON.parse(decodeURIComponent(webhookData));
        processWebhook(payload);
      } catch (error) {
        console.error("Erro ao parsear webhook data:", error);
      }
    }

    // Listener para webhooks recebidos via postMessage (caso seja usado iframe)
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'cakto_webhook') {
        processWebhook(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return null; // Componente invisível
};

export default CaktoWebhook;
