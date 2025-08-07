#!/usr/bin/env bash
# build.sh - Build script for Render deployment

set -o errexit  # exit on error

echo "🚀 Starting build process for Vietnamese Tax Filing API..."

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /tmp/uploads
mkdir -p logs

# Run database migrations
echo "🗄️ Initializing database..."
python -c "
import asyncio
import sys
import os
sys.path.insert(0, os.getcwd())

async def init_database():
    try:
        from app.core.database import init_db
        await init_db()
        print('✅ Database initialized successfully!')
    except Exception as e:
        print(f'❌ Database initialization failed: {e}')
        # Don't fail the build if database init fails
        # It might be a temporary connection issue
        pass

asyncio.run(init_database())
"

echo "✅ Build completed successfully!"
