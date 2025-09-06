// Script para testar emissão real de eventos socket
// Como estamos em JS, vamos usar uma abordagem diferente
const path = require('path');
const fs = require('fs');

// Vamos simular a emissão através de um arquivo temporário que o backend pode ler
const testEventFile = path.join(__dirname, 'test-events.json');

console.log('🔄 Iniciando teste de emissão real de eventos socket...');

setTimeout(() => {
  try {
    const io = getIO();
    
    if (!io) {
      console.error('❌ Instância do socket.io não encontrada!');
      process.exit(1);
    }
    
    console.log('✅ Instância do socket.io obtida com sucesso');
    console.log('📡 Emitindo eventos para company-1-mainchannel...');
    
    // Emitir evento de ticket
    io.to('company-1-mainchannel').emit('company-1-ticket', {
      action: 'update',
      ticket: {
        id: 123,
        status: 'open',
        contact: { name: 'Teste Socket' },
        unreadMessages: 1,
        queue: { name: 'Suporte', color: '#0000FF' }
      }
    });
    console.log('✅ Evento company-1-ticket emitido');
    
    // Emitir evento de nova mensagem
    io.to('company-1-mainchannel').emit('company-1-new-message', {
      ticketId: 123,
      message: {
        id: 789,
        body: 'Mensagem de teste via socket',
        fromMe: false
      }
    });
    console.log('✅ Evento company-1-new-message emitido');
    
    // Emitir evento de app message
    io.to('company-1-mainchannel').emit('company-1-appMessage', {
      action: 'create',
      message: {
        id: 456,
        ticketId: 123,
        body: 'Teste de app message',
        fromMe: false
      }
    });
    console.log('✅ Evento company-1-appMessage emitido');
    
    console.log('\n💡 Verifique o console do navegador para ver se os eventos chegaram!');
    console.log('💡 Se chegaram, o problema de atualização automática está resolvido!');
    
  } catch (error) {
    console.error('❌ Erro ao emitir eventos:', error.message);
  }
  
  process.exit(0);
}, 2000);

console.log('⏳ Aguardando 2 segundos para garantir que o socket.io esteja pronto...');