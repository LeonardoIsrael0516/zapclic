const io = require('socket.io-client');
const fs = require('fs');

// Simula um token válido (você pode pegar um real do localStorage do navegador)
// Para pegar o token real: abra o navegador, F12, Console, digite: localStorage.getItem('token')
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInByb2ZpbGUiOiJhZG1pbiIsImNvbXBhbnlJZCI6MSwiaWF0IjoxNzU3MDkwNzI5fQ.example';

console.log('🔌 Conectando ao socket backend...');
console.log('📋 Para obter um token válido:');
console.log('1. Abra o navegador em http://192.168.3.24/');
console.log('2. Faça login');
console.log('3. Abra o console (F12)');
console.log('4. Digite: localStorage.getItem("token")');
console.log('5. Copie o token e substitua no arquivo de teste');
console.log('');

// Conecta usando o mesmo padrão do frontend
const socket = io('http://localhost:4000', {
  transports: ['polling'],
  pingTimeout: 18000,
  pingInterval: 18000,
  query: { 
    token: testToken
  }
});

socket.on('connect', () => {
  console.log('✅ Conectado ao socket! ID:', socket.id);
  
  // Tenta se conectar ao mainchannel
  console.log('📡 Emitindo joinMainChannel...');
  socket.emit('joinMainChannel');
  
  // Tenta se conectar aos canais de notificação
  console.log('📡 Emitindo joinNotification...');
  socket.emit('joinNotification');
  
  // Escuta eventos importantes
  const eventsToListen = [
    'ready',
    'heartbeat',
    'company-1-new-message',
    'company-1-ticket',
    'company-1-appMessage'
  ];
  
  eventsToListen.forEach(eventName => {
    socket.on(eventName, (data) => {
      console.log(`🎯 EVENTO RECEBIDO: ${eventName}`, {
        timestamp: new Date().toISOString(),
        data: data
      });
    });
  });
  
  console.log('✅ Listeners configurados para:', eventsToListen.join(', '));
  console.log('⏳ Aguardando eventos... (10 segundos)');
  
  // Desconecta após 10 segundos
  setTimeout(() => {
    console.log('\n🔌 Desconectando...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
  console.log('💡 Dica: Verifique se o token está válido');
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Desconectado:', reason);
});

// Escuta todos os eventos
socket.onAny((eventName, ...args) => {
  console.log(`📨 Evento recebido: ${eventName}`, args);
});

console.log('⏳ Aguardando conexão...');