const fs = require('fs');
const path = require('path');

// Simula a emissão de eventos para o canal mainchannel
const testMainChannelEvents = [
  {
    channel: 'company-1-mainchannel',
    event: 'company-1-new-message',
    data: {
      action: 'new-message',
      ticketId: 123,
      messageId: 456,
      status: 'open',
      timestamp: new Date().toISOString()
    }
  },
  {
    channel: 'company-1-mainchannel', 
    event: 'company-1-ticket',
    data: {
      action: 'update',
      ticket: {
        id: 123,
        status: 'open',
        contact: { name: 'Teste MainChannel' },
        queue: { id: 1, name: 'Suporte' },
        unreadMessages: 2
      }
    }
  }
];

console.log('🔍 Testando eventos do canal mainchannel...');
console.log('\n📋 Eventos que deveriam ser emitidos:');

testMainChannelEvents.forEach((test, index) => {
  console.log(`\n${index + 1}. Canal: ${test.channel}`);
  console.log(`   Evento: ${test.event}`);
  console.log(`   Dados:`, JSON.stringify(test.data, null, 4));
});

// Salva os eventos em um arquivo para debug
const debugFile = path.join(__dirname, 'mainchannel-debug.json');
fs.writeFileSync(debugFile, JSON.stringify(testMainChannelEvents, null, 2));
console.log('\n✅ Eventos salvos em:', debugFile);

console.log('\n🚨 PROBLEMA IDENTIFICADO:');
console.log('O backend emite muitos eventos para o canal "company-X-mainchannel"');
console.log('mas o frontend não está escutando esse canal específico.');
console.log('\n💡 SOLUÇÃO:');
console.log('O frontend precisa se conectar automaticamente ao canal mainchannel');
console.log('quando o socket é inicializado.');

console.log('\n🔧 Para verificar no navegador:');
console.log('1. Abra o console (F12)');
console.log('2. Digite: window.testSocketConnectivity()');
console.log('3. Verifique se há logs de eventos sendo recebidos');
console.log('4. Procure por eventos "company-1-new-message" ou "company-1-ticket"');