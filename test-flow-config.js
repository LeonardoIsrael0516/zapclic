const axios = require('axios');

// Função para testar o login e salvar configuração
async function testFlowConfig() {
  try {
    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('http://localhost:4000/auth/login', {
      email: 'admin@admin.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('Login realizado com sucesso!');
    
    // Configurar axios com o token
    const api = axios.create({
      baseURL: 'http://localhost:4000',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Testar buscar configuração
    console.log('Buscando configuração do fluxo 1...');
    try {
      const getResponse = await api.get('/flowbuilder/config/1');
      console.log('Configuração atual:', getResponse.data);
    } catch (err) {
      console.log('Erro ao buscar configuração:', err.response?.status, err.response?.data);
    }
    
    // Testar salvar configuração
    console.log('Salvando configuração do fluxo 1...');
    const configData = {
      config: {
        keywords: {
          enabled: true,
          list: ['teste', 'config']
        },
        timeouts: {
          enabled: true,
          value: 30
        }
      }
    };
    
    const saveResponse = await api.post('/flowbuilder/config/1', configData);
    console.log('Configuração salva com sucesso:', saveResponse.data);
    
  } catch (error) {
    console.error('Erro:', error.response?.status, error.response?.data || error.message);
  }
}

testFlowConfig();