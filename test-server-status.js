const axios = require('axios');

// Payload de teste
const testPayload = {
  id: "test-123456",
  status: "paid",
  event: "subscription.paid",
  customer: {
    name: "João Silva",
    email: "joao.silva@exemplo.com",
    phone: "11999999999"
  }
};

// URLs alternativas para testar
const urls = [
  'https://apizap.meulink.lat:4000/cakto/webhook',
  'https://apizap.meulink.lat/cakto/webhook',
  'https://apizap.meulink.lat:4000/subscriptions/cakto/webhook',
  'https://apizap.meulink.lat/subscriptions/cakto/webhook',
  'https://apizap.meulink.lat:4000/api/subscriptions/cakto/webhook',
  'https://zap.meulink.lat/cakto/webhook/test',
  'https://zap.meulink.lat/cakto/webhook/test-simple'
];

async function testAlternativeEndpoints() {
  console.log('🚀 Testando endpoints alternativos...\n');
  
  for (const url of urls) {
    try {
      console.log(`📡 Testando: ${url}`);
      
      const response = await axios.post(url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': '2e0e5cdd-8af3-4da5-b0de-3887dd5ed4c6'
        },
        timeout: 10000
      });
      
      console.log(`✅ Sucesso! Status: ${response.status}`);
      console.log(`📄 Resposta: ${JSON.stringify(response.data, null, 2)}\n`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Erro ${error.response.status}: ${error.response.statusText}`);
        if (error.response.data && typeof error.response.data === 'string' && error.response.data.length < 200) {
          console.log(`📄 Resposta: ${error.response.data}`);
        }
      } else {
        console.log(`❌ Erro: ${error.message}`);
      }
      console.log('');
    }
  }
}

// Testar também um GET simples para ver se o servidor responde
async function testServerStatus() {
  console.log('🔍 Testando status dos servidores...\n');
  
  const servers = [
    'https://apizap.meulink.lat:4000',
    'https://apizap.meulink.lat',
    'https://zap.meulink.lat'
  ];
  
  for (const server of servers) {
    try {
      const response = await axios.get(server, { timeout: 5000 });
      console.log(`✅ ${server} está online - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${server} - Erro: ${error.message}`);
    }
  }
  console.log('');
}

async function runTests() {
  await testServerStatus();
  await testAlternativeEndpoints();
}

runTests().catch(console.error);
