#!/bin/bash

echo "🔍 Verificando status dos serviços no servidor..."
echo ""

echo "📋 PM2 List:"
pm2 list
echo ""

echo "📂 Verificando arquivos do frontend:"
ls -la /home/deploy/zapclic/frontend/
echo ""

echo "📂 Verificando se server.js existe:"
ls -la /home/deploy/zapclic/frontend/server.js
echo ""

echo "📂 Verificando arquivos do backend:"
ls -la /home/deploy/zapclic/backend/dist/
echo ""

echo "🔧 Verificando processos Node.js:"
ps aux | grep node
echo ""

echo "🌐 Verificando portas ocupadas:"
netstat -tlnp | grep -E ':3000|:3333|:8080'
echo ""

echo "📝 Verificando logs recentes do PM2:"
pm2 logs --lines 10
