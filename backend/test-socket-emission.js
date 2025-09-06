const { io } = require("./src/libs/socket");

// Teste simples para emitir eventos de socket
setTimeout(() => {
  console.log("[TESTE] Emitindo evento de teste para company-1-ticket...");
  
  // Simula um evento de ticket
  io.to("company-1-mainchannel").emit("company-1-ticket", {
    action: "update",
    ticket: {
      id: 999,
      status: "open",
      companyId: 1,
      contact: { name: "Teste" }
    }
  });
  
  console.log("[TESTE] Emitindo evento de nova mensagem...");
  
  // Simula um evento de nova mensagem
  io.to("company-1-mainchannel").emit("company-1-new-message", {
    action: "new-message",
    ticketId: 999,
    messageId: 888,
    status: "open",
    timestamp: new Date().toISOString()
  });
  
  console.log("[TESTE] Emitindo evento appMessage...");
  
  // Simula um evento appMessage
  io.to("company-1-mainchannel").emit("company-1-appMessage", {
    action: "create",
    message: {
      id: 777,
      ticketId: 999,
      body: "Mensagem de teste"
    },
    ticket: {
      id: 999,
      status: "open",
      companyId: 1,
      queue: { id: 1 }
    }
  });
  
  console.log("[TESTE] Eventos emitidos com sucesso!");
  
}, 3000);

console.log("[TESTE] Script iniciado. Eventos serão emitidos em 3 segundos...");