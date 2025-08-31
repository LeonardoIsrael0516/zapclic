#!/bin/bash

echo "🚀 Configurando e iniciando serviços corretamente..."
echo ""

# Ir para o diretório do projeto
cd /home/deploy/zapclic

echo "📥 Fazendo pull das últimas alterações..."
git pull origin main
echo ""

echo "🔧 Parando todos os processos PM2..."
pm2 delete all
echo ""

echo "📦 Instalando dependências do backend..."
cd backend
npm install
echo ""

echo "🏗️ Fazendo build do backend..."
npm run build
echo ""

echo "📦 Instalando dependências do frontend..."
cd ../frontend
npm install
echo ""

echo "🏗️ Fazendo build do frontend..."
npm run build
echo ""

echo "🚀 Iniciando backend com PM2..."
cd ../backend
pm2 start dist/server.js --name "backend-api" --watch
echo ""

echo "🚀 Iniciando frontend com server.js customizado..."
cd ../frontend
pm2 start server.js --name "frontend-server" --watch
echo ""

echo "💾 Salvando configuração do PM2..."
pm2 save
pm2 startup
echo ""

echo "✅ Verificando status final:"
pm2 list
echo ""

echo "🔍 Testando endpoints:"
echo "Frontend: curl -I http://localhost:3000"
curl -I http://localhost:3000
echo ""
echo "Backend: curl -I http://localhost:3333"
curl -I http://localhost:3333
echo ""

echo "🎉 Setup completo! Agora teste o webhook novamente."
