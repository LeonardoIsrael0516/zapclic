// Função para testar conectividade do socket
window.testSocketConnectivity = function() {
  console.log('🔍 Testando conectividade do socket...');
  
  // Verifica se o socket está disponível
  if (window.socketManager && window.socketManager.currentSocket) {
    const socket = window.socketManager.currentSocket;
    
    console.log('✅ Socket encontrado:', socket.connected ? 'CONECTADO' : 'DESCONECTADO');
    console.log('📡 Socket ID:', socket.id);
    
    // Lista todos os eventos que o socket está escutando
    console.log('👂 Eventos sendo escutados:');
    const events = socket._callbacks || {};
    Object.keys(events).forEach(event => {
      console.log(`  - ${event}: ${events[event].length} listeners`);
    });
    
    // Testa emissão de evento joinMainChannel
    console.log('\n🚀 Testando conexão ao mainchannel...');
    socket.emit('joinMainChannel');
    
    // Adiciona listeners temporários para eventos importantes
    const testEvents = [
      'company-1-new-message',
      'company-1-ticket', 
      'company-1-appMessage',
      'ready',
      'heartbeat'
    ];
    
    testEvents.forEach(eventName => {
      socket.off(eventName, window.testEventHandler); // Remove listener anterior se existir
      socket.on(eventName, window.testEventHandler);
    });
    
    console.log('✅ Listeners de teste adicionados para:', testEvents.join(', '));
    console.log('\n💡 Agora envie uma mensagem no WhatsApp e verifique se aparecem logs aqui!');
    
  } else {
    console.error('❌ Socket não encontrado! Verifique se o SocketContext está carregado.');
  }
};

// Handler para eventos de teste
window.testEventHandler = function(data) {
  console.log('🎯 EVENTO RECEBIDO:', {
    event: arguments.callee.eventName || 'unknown',
    timestamp: new Date().toISOString(),
    data: data
  });
};

// Adiciona o socket manager ao window quando disponível
if (typeof window !== 'undefined') {
  // Aguarda o socket manager estar disponível
  const checkSocketManager = setInterval(() => {
    if (window.socketManager) {
      clearInterval(checkSocketManager);
      console.log('✅ Socket Manager disponível! Use window.testSocketConnectivity() para testar.');
    }
  }, 1000);
}

console.log('📋 Funções de teste carregadas:');
console.log('- window.testSocketConnectivity() - Testa conectividade');
console.log('- window.testEventHandler() - Handler para eventos de teste');