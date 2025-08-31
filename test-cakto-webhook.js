const axios = require('axios');

// Payload de teste baseado no exemplo da Cakto
const testPayload = {
  id: "test-123456",
  status: "paid",
  event: "subscription.paid",
  customer: {
    name: "João Silva",
    email: "joao.silva@exemplo.com",
    phone: "11999999999"
  },
  subscription: {
    id: "sub-789",
    plan: {
      name: "Plano Pro",
      price: 4900, // R$ 49,00
      interval: "monthly"
    }
  },
  payment: {
    method: "pix",
    amount: 4900,
    paid_at: new Date().toISOString()
  }
};

// URLs para testar
const urls = [
  'http://localhost:4000/cakto/webhook', // Backend direto (porta correta)
  'http://localhost:3000/cakto/webhook', // Frontend proxy
  'http://localhost:3000/cakto/webhook/test-simple', // Frontend direto
  'https://apizap.meulink.lat:4000/cakto/webhook', // Produção backend porta 4000
  'https://apizap.meulink.lat/cakto/webhook', // Produção backend (se tem proxy)
  'https://zap.meulink.lat/cakto/webhook' // Produção frontend
];

async function testWebhook() {
  console.log('🚀 Testando webhook da Cakto...\n');
  
  for (const url of urls) {
    try {
      console.log(`📡 Testando: ${url}`);
      
      const response = await axios.post(url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': '2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6' // Segredo do .env
        },
        timeout: 10000
      });
      
      console.log(`✅ Sucesso! Status: ${response.status}`);
      console.log(`📄 Resposta: ${JSON.stringify(response.data, null, 2)}\n`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Erro ${error.response.status}: ${error.response.statusText}`);
        console.log(`📄 Resposta: ${JSON.stringify(error.response.data, null, 2)}\n`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Conexão recusada - serviço não está rodando\n`);
      } else {
        console.log(`❌ Erro: ${error.message}\n`);
      }
    }
  }
}

// Executar teste
testWebhook().catch(console.error);
