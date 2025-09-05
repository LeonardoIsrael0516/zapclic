const axios = require('axios');
const fs = require('fs');

// Função para testar a importação de fluxo
async function testFlowImport() {
  try {
    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('http://localhost:8080/auth/login', {
      email: 'admin@admin.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('Login realizado com sucesso!');
    
    // Configurar axios com o token
    const api = axios.create({
      baseURL: 'http://localhost:8080',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Ler o arquivo JSON de teste
    console.log('Lendo arquivo de fluxo de teste...');
    const flowData = JSON.parse(fs.readFileSync('test-flow-export.json', 'utf8'));
    console.log('Dados do fluxo:', flowData);
    
    // Testar criação do fluxo
    console.log('Criando fluxo...');
    const createResponse = await api.post('/flowbuilder', {
      name: `${flowData.name} (Importado via Teste)`
    });
    
    console.log('Fluxo criado:', createResponse.data);
    
    // Testar atualização com dados do fluxo
    if (createResponse.data && createResponse.data.id && flowData.flow) {
      console.log('Atualizando dados do fluxo...');
      const updateResponse = await api.post('/flowbuilder/flow', {
        idFlow: createResponse.data.id,
        nodes: flowData.flow.nodes || [],
        connections: flowData.flow.connections || []
      });
      
      console.log('Fluxo atualizado com sucesso:', updateResponse.data);
    }
    
    console.log('Importação de fluxo testada com sucesso!');
    
  } catch (error) {
    console.error('Erro durante o teste:', error.response?.status, error.response?.data || error.message);
  }
}

testFlowImport();