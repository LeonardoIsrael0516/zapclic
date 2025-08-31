const axios = require('axios');

async function testGetEndpoints() {
  console.log('🔍 Testando endpoints GET...\n');
  
  const endpoints = [
    'https://apizap.meulink.lat/cakto/webhook/test',
    'https://apizap.meulink.lat:4000/cakto/webhook/test',
    'https://zap.meulink.lat/cakto/webhook/test'
  ];
  
  for (const url of endpoints) {
    try {
      console.log(`📡 GET ${url}`);
      
      const response = await axios.get(url, {
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
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Conexão recusada`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`❌ Timeout`);
      } else {
        console.log(`❌ Erro: ${error.message}`);
      }
      console.log('');
    }
  }
}

testGetEndpoints().catch(console.error);
