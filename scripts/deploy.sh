#!/bin/bash

# MyShopKE Deployment Script
set -e

echo "🚀 Starting MyShopKE deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🗄️  Starting database..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm migrate

echo "🌱 Seeding database (optional)..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run db:seed || echo "⚠️  Seeding failed or skipped"

echo "🚀 Starting application services..."
docker-compose -f docker-compose.prod.yml up -d backend frontend

echo "🔍 Checking service health..."
sleep 15

# Health check
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Application is healthy and running!"
    echo "🌐 Frontend: http://localhost"
    echo "🔌 Backend API: http://localhost/api"
else
    echo "❌ Health check failed. Check logs:"
    echo "docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo "🎉 Deployment completed successfully!"