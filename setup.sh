#!/bin/bash

echo ""
echo "╔══════════════════════════════════════╗"
echo "║       ActiveMetrics — Setup          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instale em: https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION encontrado"

# Install root deps (concurrently)
echo ""
echo "📦 Instalando dependências raiz..."
npm install

# Install backend
echo ""
echo "📦 Instalando dependências do backend..."
npm install --prefix backend

# Install frontend
echo ""
echo "📦 Instalando dependências do frontend..."
npm install --prefix frontend

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   ✅ Instalação concluída!           ║"
echo "║                                      ║"
echo "║   Para iniciar o sistema:            ║"
echo "║   $ npm start                        ║"
echo "║                                      ║"
echo "║   Frontend: http://localhost:3000    ║"
echo "║   Backend:  http://localhost:3001    ║"
echo "╚══════════════════════════════════════╝"
echo ""
