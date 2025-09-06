const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo migração diretamente...');

// Caminho para a migração compilada
const migrationPath = path.join(__dirname, 'dist', 'database', 'migrations', '20250111140000-add-missing-columns-flowbuilder.js');

// Verificar se o arquivo existe
if (!fs.existsSync(migrationPath)) {
  console.log('❌ Arquivo de migração compilado não encontrado:', migrationPath);
  console.log('📝 Execute primeiro: npm run build');
  process.exit(1);
}

// Ler o conteúdo atual
let content = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Arquivo de migração encontrado');

// Substituir a função up para ser mais robusta
const newUpFunction = `
  up: async (queryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable("FlowBuilders");
      
      const promises = [];
      
      // Adicionar company_id apenas se não existir
      if (!tableDescription.company_id) {
        console.log('Adicionando coluna company_id...');
        promises.push(
          queryInterface.addColumn("FlowBuilders", "company_id", {
            type: require("sequelize").DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
          })
        );
      } else {
        console.log('Coluna company_id já existe');
      }
      
      // Adicionar variables apenas se não existir
      if (!tableDescription.variables) {
        console.log('Adicionando coluna variables...');
        promises.push(
          queryInterface.addColumn("FlowBuilders", "variables", {
            type: require("sequelize").DataTypes.JSON,
            allowNull: true
          })
        );
      } else {
        console.log('Coluna variables já existe');
      }
      
      // Adicionar config apenas se não existir
      if (!tableDescription.config) {
        console.log('Adicionando coluna config...');
        promises.push(
          queryInterface.addColumn("FlowBuilders", "config", {
            type: require("sequelize").DataTypes.JSON,
            allowNull: true
          })
        );
      } else {
        console.log('Coluna config já existe');
      }
      
      if (promises.length > 0) {
        await Promise.all(promises);
        console.log('✅ Colunas adicionadas com sucesso!');
      } else {
        console.log('✅ Todas as colunas já existem');
      }
      
    } catch (error) {
      console.error('❌ Erro na migração:', error.message);
      // Se a coluna já existe, não falhar
      if (error.message.includes('already exists')) {
        console.log('⚠️ Coluna já existe, continuando...');
        return;
      }
      throw error;
    }
  },`;

// Encontrar e substituir a função up
const upRegex = /up:\s*async\s*\([^)]*\)\s*=>\s*{[^}]*(?:{[^}]*}[^}]*)*}/;
if (upRegex.test(content)) {
  content = content.replace(upRegex, newUpFunction);
  
  // Escrever o arquivo corrigido
  fs.writeFileSync(migrationPath, content);
  
  console.log('✅ Migração corrigida com sucesso!');
  console.log('📝 Agora execute: npx sequelize-cli db:migrate');
} else {
  console.log('❌ Não foi possível encontrar a função up na migração');
  console.log('📋 Conteúdo atual:');
  console.log(content.substring(0, 500) + '...');
}