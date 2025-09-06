const axios = require('axios');

// Configurações do servidor de produção
const PRODUCTION_API = 'https://apizap.meulink.lat';
const TEST_USER = {
  email: 'admin@admin.com',
  password: 'admin123'
};

async function testProductionFlows() {
  console.log('🔍 Testando API de fluxos no servidor de produção...');
  console.log(`🌐 URL: ${PRODUCTION_API}`);
  
  try {
    // 1. Testar autenticação
    console.log('\n🔐 Testando autenticação...');
    const loginResponse = await axios.post(`${PRODUCTION_API}/auth/login`, TEST_USER);
    
    if (!loginResponse.data.token) {
      throw new Error('Token não recebido na resposta de login');
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log(`🎫 Token recebido: ${loginResponse.data.token.substring(0, 20)}...`);
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Testar listagem de fluxos
    console.log('\n📋 Testando listagem de fluxos...');
    const listResponse = await axios.get(`${PRODUCTION_API}/flowbuilder`, { headers });
    
    console.log('📊 Resposta da API:', JSON.stringify(listResponse.data, null, 2));
    
    // Verificar estrutura de dados
    console.log('\n🔍 Análise da estrutura de dados:');
    console.log('- Status da resposta:', listResponse.status);
    console.log('- Tipo da resposta:', typeof listResponse.data);
    console.log('- É array?', Array.isArray(listResponse.data));
    console.log('- Tem propriedade flows?', 'flows' in listResponse.data);
    
    if (listResponse.data.flows) {
      console.log('- Tipo de flows:', typeof listResponse.data.flows);
      console.log('- flows é array?', Array.isArray(listResponse.data.flows));
      console.log('- Quantidade de fluxos:', listResponse.data.flows.length);
      
      if (listResponse.data.flows.length > 0) {
        console.log('\n📝 Detalhes dos fluxos encontrados:');
        listResponse.data.flows.forEach((flow, index) => {
          console.log(`${index + 1}. ID: ${flow.id}, Nome: ${flow.name}, Company: ${flow.company_id}`);
          console.log(`   - Ativo: ${flow.active}`);
          console.log(`   - Criado em: ${flow.createdAt}`);
        });
      } else {
        console.log('⚠️ Nenhum fluxo encontrado na resposta');
      }
    } else {
      console.log('❌ Propriedade "flows" não encontrada na resposta');
    }
    
    // 3. Testar criação de fluxo
    console.log('\n➕ Testando criação de fluxo...');
    const newFlowData = {
      name: `Teste Produção - ${new Date().toISOString()}`,
      flow: {
        nodes: [{
          id: '1',
          type: 'start',
          position: { x: 250, y: 100 },
          data: { label: 'Início do fluxo' }
        }],
        edges: []
      }
    };
    
    const createResponse = await axios.post(`${PRODUCTION_API}/flowbuilder`, newFlowData, { headers });
    
    console.log('✅ Fluxo criado com sucesso!');
    console.log('📄 Resposta da criação:', JSON.stringify(createResponse.data, null, 2));
    
    // 4. Verificar se o fluxo aparece na listagem
    console.log('\n🔄 Verificando listagem após criação...');
    const updatedListResponse = await axios.get(`${PRODUCTION_API}/flowbuilder`, { headers });
    
    const updatedFlows = updatedListResponse.data.flows || [];
    console.log(`📈 Total de fluxos após criação: ${updatedFlows.length}`);
    
    const createdFlow = updatedFlows.find(flow => flow.id === createResponse.data.id);
    if (createdFlow) {
      console.log('✅ Fluxo criado encontrado na listagem');
      console.log(`📝 Detalhes: ID ${createdFlow.id}, Nome: ${createdFlow.name}`);
    } else {
      console.log('❌ Fluxo criado NÃO encontrado na listagem');
    }
    
    // 5. Diagnóstico final
    console.log('\n🔍 Diagnóstico do servidor de produção:');
    console.log('✅ Servidor respondendo');
    console.log('✅ Autenticação funcionando');
    console.log(`${listResponse.status === 200 ? '✅' : '❌'} Endpoint de listagem funcionando`);
    console.log(`${createResponse.status === 200 ? '✅' : '❌'} Endpoint de criação funcionando`);
    console.log(`${listResponse.data.flows ? '✅' : '❌'} Estrutura de dados correta`);
    console.log(`${updatedFlows.length > 0 ? '✅' : '⚠️'} Fluxos encontrados no banco`);
    
    if (listResponse.data.flows && listResponse.data.flows.length === 0) {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO: Banco de dados vazio ou problema na consulta');
      console.log('💡 Possíveis causas:');
      console.log('   - Migração não executada corretamente');
      console.log('   - Problema na conexão com o banco');
      console.log('   - Dados não foram migrados');
      console.log('   - Problema no filtro por company_id');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Dados:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Servidor não está respondendo');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Domínio não encontrado');
    }
  }
}

testProductionFlows().catch(console.error);