const io = require('socket.io-client');
const axios = require('axios');

// Configurações
const BACKEND_URL = 'http://192.168.3.24:8080';
const API_URL = 'http://192.168.3.24:8080';

// Token de teste - SUBSTITUA pelo token real do localStorage
const TOKEN = 'SEU_TOKEN_AQUI';

console.log('🧪 Testando fluxo completo de notificações...');
console.log('📋 Para obter um token válido:');
console.log('1. Abra http://192.168.3.24/ no navegador');
console.log('2. Faça login');
console.log('3. Abra o console (F12)');
console.log('4. Digite: localStorage.getItem("token")');
console.log('5. Copie o token e substitua acima\n');

if (TOKEN === 'SEU_TOKEN_AQUI') {
  console.log('❌ Por favor, configure um token válido antes de executar o teste');
  process.exit(1);
}

// Conectar ao socket
const socket = io(BACKEND_URL, {
  transports: ['polling'],
  pingTimeout: 18000,
  pingInterval: 18000,
  query: { token: TOKEN }
});

let connected = false;
let joinedChannels = false;

socket.on('connect', () => {
  console.log('✅ Conectado ao socket! ID:', socket.id);
  connected = true;
  
  // Emitir joinMainChannel
  console.log('📡 Entrando no canal principal...');
  socket.emit('joinMainChannel');
  
  // Emitir joinNotification
  console.log('📡 Entrando no canal de notificações...');
  socket.emit('joinNotification');
  
  joinedChannels = true;
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
  if (error.message.includes('jwt')) {
    console.log('🔑 Problema com o token JWT. Verifique se o token é válido.');
  }
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Desconectado:', reason);
});

socket.on('ready', () => {
  console.log('✅ Socket pronto para receber eventos!');
});

// Listeners para eventos de notificação
socket.on('company-1-chat', (data) => {
  console.log('💬 Evento de chat recebido:', {
    action: data.action,
    ticketId: data.ticketId,
    messageId: data.messageId,
    timestamp: data.timestamp
  });
});

socket.on('company-1-appMessage', (data) => {
  console.log('📨 Evento de mensagem da aplicação recebido:', {
    action: data.action,
    ticketId: data.ticket?.id,
    messageId: data.message?.id,
    fromMe: data.message?.fromMe,
    body: data.message?.body?.substring(0, 50) + '...'
  });
});

socket.on('company-1-ticket', (data) => {
  console.log('🎫 Evento de ticket recebido:', {
    action: data.action,
    ticketId: data.ticketId || data.ticket?.id
  });
});

// Aguardar conexão e então simular criação de mensagem
setTimeout(() => {
  if (!connected || !joinedChannels) {
    console.log('❌ Falha na conexão ou entrada nos canais');
    process.exit(1);
  }
  
  console.log('\n🔄 Teste concluído. Monitore os eventos acima.');
  console.log('\n📝 Para testar uma mensagem real:');
  console.log('1. Envie uma mensagem via WhatsApp para o número conectado');
  console.log('2. Observe se os eventos aparecem no console');
  console.log('3. Verifique se as notificações aparecem no header do frontend');
  
}, 5000);

// Manter o script rodando por 60 segundos
setTimeout(() => {
  console.log('\n⏰ Teste finalizado após 60 segundos');
  socket.disconnect();
  process.exit(0);
}, 60000);

console.log('⏳ Aguardando eventos por 60 segundos...');