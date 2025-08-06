# MyShopKE Deployment Script (PowerShell)
param(
    [switch]$Development,
    [switch]$Production
)

Write-Host "🚀 Starting MyShopKE deployment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please copy .env.example to .env and configure it." -ForegroundColor Red
    exit 1
}

# Check if Docker is available
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ Docker or Docker Compose is not installed or not running." -ForegroundColor Red
    exit 1
}

if ($Development) {
    Write-Host "🛠️  Starting development environment..." -ForegroundColor Yellow
    
    # Start development services
    Write-Host "🐳 Starting development services..." -ForegroundColor Blue
    docker-compose up -d postgres redis
    
    Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Install dependencies and setup
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
    Set-Location backend
    npm install
    
    Write-Host "🔧 Generating Prisma client..." -ForegroundColor Blue
    npx prisma generate
    
    Write-Host "🔄 Running database migrations..." -ForegroundColor Blue
    npx prisma migrate dev
    
    Write-Host "🌱 Seeding database..." -ForegroundColor Blue
    npm run db:seed
    
    Set-Location ..
    
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
    npm install
    
    Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
    Write-Host "🚀 To start development:" -ForegroundColor Cyan
    Write-Host "  Backend:  cd backend && npm run dev" -ForegroundColor White
    Write-Host "  Frontend: npm run dev" -ForegroundColor White
    Write-Host "🐳 Or use Docker: docker-compose up" -ForegroundColor White
}

if ($Production) {
    Write-Host "🏭 Starting production deployment..." -ForegroundColor Yellow
    
    # Validate required environment variables
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @("POSTGRES_PASSWORD", "JWT_SECRET", "JWT_REFRESH_SECRET")
    
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=.+") {
            Write-Host "❌ Required environment variable $var is not set in .env" -ForegroundColor Red
            exit 1
        }
    }
    
    # Build and start services
    Write-Host "📦 Building Docker images..." -ForegroundColor Blue
    docker-compose -f docker-compose.prod.yml build
    
    Write-Host "🗄️  Starting database..." -ForegroundColor Blue
    docker-compose -f docker-compose.prod.yml up -d postgres redis
    
    Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    Write-Host "🔄 Running database migrations..." -ForegroundColor Blue
    docker-compose -f docker-compose.prod.yml run --rm migrate
    
    Write-Host "🌱 Seeding database (optional)..." -ForegroundColor Blue
    try {
        docker-compose -f docker-compose.prod.yml run --rm backend npm run db:seed
    } catch {
        Write-Host "⚠️  Seeding failed or skipped" -ForegroundColor Yellow
    }
    
    Write-Host "🚀 Starting application services..." -ForegroundColor Blue
    docker-compose -f docker-compose.prod.yml up -d backend frontend
    
    Write-Host "🔍 Checking service health..." -ForegroundColor Blue
    Start-Sleep -Seconds 20
    
    # Health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Application is healthy and running!" -ForegroundColor Green
            Write-Host "🌐 Frontend: http://localhost" -ForegroundColor Cyan
            Write-Host "🔌 Backend API: http://localhost/api" -ForegroundColor Cyan
        } else {
            throw "Health check returned status code: $($response.StatusCode)"
        }
    } catch {
        Write-Host "❌ Health check failed. Check logs:" -ForegroundColor Red
        Write-Host "docker-compose -f docker-compose.prod.yml logs" -ForegroundColor White
        exit 1
    }
    
    Write-Host "🎉 Production deployment completed successfully!" -ForegroundColor Green
}

if (-not $Development -and -not $Production) {
    Write-Host "Please specify deployment type:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy.ps1 -Development" -ForegroundColor White
    Write-Host "  .\scripts\deploy.ps1 -Production" -ForegroundColor White
}