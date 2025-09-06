const io = require('socket.io-client');

// INSTRUÇÕES:
// 1. Abra o navegador em http://192.168.3.24/
// 2. Faça login
// 3. Abra o console (F12)
// 4. Digite: localStorage.getItem("token")
// 5. Copie o token e cole abaixo (substitua 'SEU_TOKEN_AQUI')

const TOKEN = 'SEU_TOKEN_AQUI'; // COLE SEU TOKEN AQUI

console.log('🔌 Testando conexão com token do frontend...');
console.log('📋 Token configurado:', TOKEN.substring(0, 20) + '...');

const socket = io('http://192.168.3.24:8080', {
  transports: ['polling'],
  pingTimeout: 18000,
  pingInterval: 18000,
  query: { token: TOKEN }
});

socket.on('connect', () => {
  console.log('✅ Conectado ao socket! ID:', socket.id);
  
  // Emitir joinMainChannel
  console.log('📡 Emitindo joinMainChannel...');
  socket.emit('joinMainChannel');
  
  // Emitir joinNotification
  console.log('📡 Emitindo joinNotification...');
  socket.emit('joinNotification');
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
  if (error.message.includes('jwt')) {
    console.log('🔑 Problema com o token JWT. Verifique se:');
    console.log('   1. O token foi copiado corretamente');
    console.log('   2. O token não expirou');
    console.log('   3. Você está logado no sistema');
  }
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Desconectado:', reason);
});

socket.on('ready', () => {
  console.log('✅ Socket pronto!');
});

// Listeners para eventos de notificação
socket.on('company-1-new-message', (data) => {
  console.log('📨 Nova mensagem recebida:', data);
});

socket.on('company-1-ticket', (data) => {
  console.log('🎫 Evento de ticket recebido:', data);
});

socket.on('company-1-appMessage', (data) => {
  console.log('💬 Mensagem da aplicação recebida:', data);
});

// Aguardar por 15 segundos
setTimeout(() => {
  console.log('⏰ Teste finalizado após 15 segundos');
  socket.disconnect();
  process.exit(0);
}, 15000);

console.log('⏳ Aguardando eventos por 15 segundos...');