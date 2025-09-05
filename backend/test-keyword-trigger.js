require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configurar conexão com o banco usando variáveis de ambiente
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: false
});

async function testKeywordTrigger() {
  try {
    console.log('🧪 Testando disparo de fluxo com palavra-chave...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Simular a lógica do FlowKeywordService.findFlowsByKeyword
    const keyword = 'oii';
    const companyId = 1;
    
    console.log(`\n🔍 Buscando fluxos para palavra-chave: "${keyword}" na empresa ${companyId}`);
    
    const [flows] = await sequelize.query(
      'SELECT id, name, config, "company_id" FROM "FlowBuilders" WHERE "company_id" = $1 AND config IS NOT NULL',
      {
        bind: [companyId]
      }
    );
    
    console.log(`📋 Encontrados ${flows.length} fluxos para a empresa`);
    
    const matches = [];
    
    for (const flow of flows) {
      const config = typeof flow.config === 'string' ? JSON.parse(flow.config) : flow.config;
      
      console.log(`\n🔧 Analisando fluxo ${flow.id} (${flow.name}):`);
      console.log(`  - Keywords enabled: ${config?.keywords?.enabled}`);
      console.log(`  - Keywords list: ${JSON.stringify(config?.keywords?.list)}`);
      
      if (config?.keywords?.enabled && config.keywords.list?.length > 0) {
        // Verificar se a palavra-chave corresponde (case insensitive)
        const keywordMatch = config.keywords.list.find(
          k => k.toLowerCase() === keyword.toLowerCase().trim()
        );
        
        console.log(`  - Palavra-chave encontrada: ${keywordMatch ? 'SIM' : 'NÃO'}`);
        
        if (keywordMatch) {
          matches.push({
            flowId: flow.id,
            keyword: keywordMatch,
            config
          });
          console.log(`  ✅ MATCH! Fluxo ${flow.id} corresponde à palavra-chave "${keywordMatch}"`);
        }
      } else {
        console.log(`  ❌ Fluxo não tem palavras-chave ativadas`);
      }
    }
    
    console.log(`\n📊 Resultado: ${matches.length} fluxo(s) correspondem à palavra-chave "${keyword}"`);
    
    if (matches.length > 0) {
      console.log('\n🎯 Fluxos que deveriam ser disparados:');
      matches.forEach(match => {
        console.log(`  - Fluxo ${match.flowId}: palavra-chave "${match.keyword}"`);
      });
    } else {
      console.log('\n❌ Nenhum fluxo deveria ser disparado');
    }
    
    // Testar também com variações da palavra-chave
    const variations = ['OII', 'Oii', ' oii ', 'oii '];
    console.log('\n🔄 Testando variações da palavra-chave:');
    
    for (const variation of variations) {
      const trimmed = variation.toLowerCase().trim();
      const found = flows.some(flow => {
        const config = typeof flow.config === 'string' ? JSON.parse(flow.config) : flow.config;
        return config?.keywords?.enabled && config.keywords.list?.some(
          k => k.toLowerCase() === trimmed
        );
      });
      console.log(`  - "${variation}" -> "${trimmed}": ${found ? 'MATCH' : 'NO MATCH'}`);
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testKeywordTrigger();