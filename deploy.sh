#!/bin/bash

# Script de Deploy Automático - ZapClic
# Atualiza frontend e backend no servidor

echo "🚀 Iniciando Deploy ZapClic"
echo "=========================="

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na pasta raiz do projeto (onde tem package.json)"
    exit 1
fi

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo "❌ Erro durante: $1"
        exit 1
    fi
}

echo ""
echo "📦 1. Atualizando Frontend..."
cd frontend

# Instalar dependências se necessário
if [ "$1" = "--install" ]; then
    echo "Installing frontend dependencies..."
    npm install
    check_error "instalação das dependências do frontend"
fi

# Build do frontend
echo "Building frontend..."
npm run build
check_error "build do frontend"

echo "✅ Frontend buildado com sucesso!"

echo ""
echo "⚙️  2. Atualizando Backend..."
cd ../backend

# Instalar dependências se necessário
if [ "$1" = "--install" ]; then
    echo "Installing backend dependencies..."
    npm install
    check_error "instalação das dependências do backend"
fi

# Build do backend
echo "Building backend..."
npm run build
check_error "build do backend"

echo "✅ Backend buildado com sucesso!"

echo ""
echo "🔄 3. Instruções para reiniciar serviços:"
echo "   Frontend: pm2 restart frontend (ou sudo systemctl restart frontend)"
echo "   Backend:  pm2 restart backend  (ou sudo systemctl restart backend)"

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📋 Arquivos atualizados:"
echo "   - frontend/build/ (arquivos estáticos)"
echo "   - backend/dist/   (JavaScript compilado)"
echo ""
echo "🔧 Para aplicar no servidor, execute:"
echo "   pm2 restart all"
echo "   # ou"
echo "   sudo systemctl restart frontend backend"
