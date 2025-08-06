#!/bin/bash

# MyShopKE Development Setup Script
set -e

echo "🛠️  Setting up MyShopKE development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before continuing."
    echo "Press Enter to continue after updating .env file..."
    read
fi

# Start development services
echo "🐳 Starting development services..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo "✅ Development environment setup complete!"
echo ""
echo "🚀 To start development:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: npm run dev"
echo ""
echo "🐳 Or use Docker:"
echo "  docker-compose up"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  Database: postgresql://postgres:243243@localhost:5432/myshopke"