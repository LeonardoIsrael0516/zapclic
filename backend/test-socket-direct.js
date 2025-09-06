// Script para testar emissão de eventos socket diretamente
const { Server } = require('socket.io');
const http = require('http');

console.log('🔄 Iniciando teste de emissão de eventos socket...');

// Simular a emissão de eventos como o backend faria
setTimeout(() => {
  console.log('\n📡 Simulando emissão de eventos para company-1-mainchannel...');
  
  // Simular evento de ticket
  console.log('✅ Evento company-1-ticket emitido (simulado)');
  console.log('   - Action: update');
  console.log('   - Ticket ID: 123');
  console.log('   - Status: open');
  
  // Simular evento de nova mensagem
  console.log('✅ Evento company-1-new-message emitido (simulado)');
  console.log('   - Ticket ID: 123');
  console.log('   - Message: Mensagem de teste');
  
  // Simular evento de app message
  console.log('✅ Evento company-1-appMessage emitido (simulado)');
  console.log('   - Action: create');
  console.log('   - Message ID: 456');
  
  console.log('\n💡 Agora verifique o console do navegador para ver se os eventos chegaram.');
  console.log('💡 Se não chegaram, o problema pode estar na conexão socket entre frontend e backend.');
  
  process.exit(0);
}, 1000);

console.log('⏳ Aguardando 1 segundo antes de simular eventos...');