const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas básicas para manter o frontend funcionando
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando sem banco de dados' });
});

// Rota de autenticação mock
app.post('/auth/login', (req, res) => {
  res.json({
    token: 'mock-token',
    user: {
      id: 1,
      name: 'Usuário Teste',
      email: 'teste@teste.com'
    }
  });
});

// Rota de usuários mock
app.get('/users/me', (req, res) => {
  res.json({
    id: 1,
    name: 'Usuário Teste',
    email: 'teste@teste.com',
    profile: 'admin'
  });
});

// Rota de flows mock
app.get('/flows', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Flow Teste',
      status: 'active',
      nodes: [],
      edges: []
    }
  ]);
});

app.post('/flows', (req, res) => {
  res.json({
    id: Date.now(),
    name: req.body.name || 'Novo Flow',
    status: 'active',
    nodes: req.body.nodes || [],
    edges: req.body.edges || []
  });
});

// Rota de companies mock
app.get('/companies', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Empresa Teste',
      status: 'active'
    }
  ]);
});

// Rota de whatsapp sessions mock
app.get('/whatsapp-sessions', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'WhatsApp Principal',
      status: 'CONNECTED',
      qrcode: null
    }
  ]);
});

// Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
  
  // Eventos mock para flows
  socket.on('flow:start', (data) => {
    socket.emit('flow:started', { flowId: data.flowId, status: 'running' });
  });
  
  socket.on('flow:stop', (data) => {
    socket.emit('flow:stopped', { flowId: data.flowId, status: 'stopped' });
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Frontend: http://localhost:3000`);
  console.log(`🔧 Backend: http://localhost:${PORT}`);
  console.log(`⚠️  Modo desenvolvimento - SEM BANCO DE DADOS`);
});

module.exports = { app, server, io };