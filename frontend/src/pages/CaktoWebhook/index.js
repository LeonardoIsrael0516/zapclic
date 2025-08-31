import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";

const CaktoWebhookPage = () => {
  const [status, setStatus] = useState("processing");
  const [result, setResult] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const processWebhook = async () => {
      try {
        // Verificar se há dados na URL
        const urlParams = new URLSearchParams(location.search);
        const webhookData = urlParams.get('data');
        
        if (!webhookData) {
          // Se não há dados na URL, tentar receber via POST
          setStatus("waiting");
          return;
        }

        const payload = JSON.parse(decodeURIComponent(webhookData));
        
        console.log("=== PROCESSANDO WEBHOOK CAKTO ===");
        console.log("Payload:", payload);

        setStatus("processing");

        // Processar webhook
        const response = await api.post("/cakto/webhook/process", {
          amount: payload.data.amount,
          customer: payload.data.customer,
          paidAt: payload.data.paidAt || new Date().toISOString(),
          orderId: payload.data.id,
          event: payload.event,
          payload: payload
        });

        console.log("✅ Resultado:", response.data);
        setResult(response.data);
        setStatus("success");

        if (response.data.success) {
          toast.success("Pagamento processado com sucesso!");
        }

      } catch (error) {
        console.error("❌ Erro:", error);
        setResult({ error: error.message });
        setStatus("error");
        toast.error("Erro ao processar pagamento");
      }
    };

    processWebhook();
  }, [location]);

  const renderStatus = () => {
    switch (status) {
      case "processing":
        return (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <h2>🔄 Processando pagamento...</h2>
            <p>Aguarde, estamos verificando seu pagamento.</p>
          </div>
        );
      
      case "success":
        return (
          <div style={{ textAlign: "center", padding: "50px", color: "green" }}>
            <h2>✅ Pagamento processado com sucesso!</h2>
            <p>Sua conta foi criada automaticamente.</p>
            {result && (
              <div style={{ marginTop: "20px", textAlign: "left", maxWidth: "600px", margin: "20px auto" }}>
                <h3>Detalhes:</h3>
                <pre style={{ background: "#f5f5f5", padding: "10px", borderRadius: "5px", fontSize: "12px" }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      
      case "error":
        return (
          <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
            <h2>❌ Erro ao processar pagamento</h2>
            <p>Entre em contato com o suporte.</p>
            {result && (
              <div style={{ marginTop: "20px" }}>
                <p><strong>Erro:</strong> {result.error}</p>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <h2>⏳ Aguardando dados...</h2>
            <p>Esta página processa webhooks da Cakto.</p>
          </div>
        );
    }
  };

  return (
    <div>
      {renderStatus()}
    </div>
  );
};

export default CaktoWebhookPage;
