#!/bin/bash

echo "🚀 Starting Tax Filing PWA..."
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "🎯 Starting development servers..."
echo "📊 Backend will run on: http://localhost:3001"
echo "🌐 Frontend will run on: http://localhost:3000"
echo "🔍 Test server will run on: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "================================"

# Start the development servers
npm run dev 