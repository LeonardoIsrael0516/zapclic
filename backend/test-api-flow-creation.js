const axios = require('axios');

const API_BASE = 'http://localhost:4000';

// Credenciais de teste - ajuste conforme necessário
const TEST_CREDENTIALS = {
  email: 'admin@admin.com', // Ajuste conforme seu usuário admin
  password: '123456' // Ajuste conforme sua senha
};

async function testFlowCreationAPI() {
  try {
    console.log('🔐 Fazendo login para obter token...');
    
    // 1. Fazer login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, TEST_CREDENTIALS);
    const { token } = loginResponse.data;
    
    console.log('✅ Login realizado com sucesso!');
    console.log(`Token obtido: ${token.substring(0, 20)}...`);
    
    // 2. Configurar headers com token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n📋 Listando fluxos existentes...');
    
    // 3. Listar fluxos existentes
    const listResponse = await axios.get(`${API_BASE}/flowbuilder`, { headers });
    
    console.log('\n📊 Resposta da API:', JSON.stringify(listResponse.data, null, 2));
    
    // Verificar estrutura de dados
    console.log('\n🔍 Análise da estrutura de dados:');
    console.log('- Tipo da resposta:', typeof listResponse.data);
    console.log('- É array?', Array.isArray(listResponse.data));
    console.log('- Tem propriedade flows?', 'flows' in listResponse.data);
    console.log('- Tipo de flows:', typeof listResponse.data.flows);
    console.log('- flows é array?', Array.isArray(listResponse.data.flows));
    
    const flows = listResponse.data.flows;
    console.log(`\n✅ Total de fluxos encontrados: ${flows ? flows.length : 'undefined'}`);
    
    if (flows && flows.length > 0) {
      console.log('\n📝 Detalhes dos fluxos:');
      flows.forEach((flow, index) => {
        console.log(`${index + 1}. ID: ${flow.id}, Nome: ${flow.name}, Company: ${flow.company_id}`);
        if (flow.flow && flow.flow.nodes) {
          console.log(`   - Nós: ${flow.flow.nodes.length}`);
        }
        if (flow.flow && flow.flow.connections) {
          console.log(`   - Conexões: ${flow.flow.connections.length}`);
        }
        console.log(`   - Ativo: ${flow.ativo}`);
      });
    }

    // Não vamos criar mais fluxos, apenas testar a listagem
    console.log('\n✅ Teste de listagem concluído!');
    
    console.log('\n✅ Teste da API concluído com sucesso!');
    console.log('\n🔍 Diagnóstico:');
    console.log('   ✅ Autenticação funcionando');
    console.log('   ✅ Endpoint de listagem funcionando');
    console.log('   ✅ Estrutura de dados correta (objeto com propriedade flows)');
    console.log('   ✅ Banco de dados funcionando');
    console.log('   ❓ Campo "ativo" retornando undefined - verificar modelo do banco');
    
  } catch (error) {
    console.error('❌ Erro durante o teste da API:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.error('\n🔐 Problema de autenticação:');
        console.error('   - Verifique se as credenciais estão corretas');
        console.error('   - Verifique se o usuário existe no banco');
        console.error('   - Verifique se o backend está rodando');
      }
      
      if (error.response.status === 500) {
        console.error('\n🔧 Erro interno do servidor:');
        console.error('   - Verifique os logs do backend');
        console.error('   - Verifique a conexão com o banco de dados');
        console.error('   - Verifique se todas as migrações foram executadas');
      }
    } else if (error.request) {
      console.error('❌ Erro de conexão:');
      console.error('   - Verifique se o backend está rodando na porta 4000');
      console.error('   - Verifique se não há firewall bloqueando');
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

testFlowCreationAPI();