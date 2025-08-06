# MyShopKE Deployment Guide

This guide covers deployment options for the MyShopKE application in both development and production environments.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Git

## Quick Start

### Development Environment

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd myshopke
   ```

2. **Run the setup script**

   ```bash
   chmod +x scripts/dev-setup.sh
   ./scripts/dev-setup.sh
   ```

3. **Start development servers**

   ```bash
   # Option 1: Using Docker
   docker-compose up

   # Option 2: Local development
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Database: postgresql://postgres:243243@localhost:5432/myshopke

### Production Deployment

1. **Prepare environment**

   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy using Docker**

   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

3. **Access the application**
   - Application: http://localhost (or your domain)
   - Health check: http://localhost/health

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"
POSTGRES_DB=myshopke
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# JWT Secrets (Generate strong secrets!)
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key"

# Application
NODE_ENV=production
# CORS: Multiple frontend URLs can be separated by commas
FRONTEND_URL=https://yourdomain.com,http://localhost:8080,http://localhost:5173
PORT=3001
```

### CORS Configuration

The `FRONTEND_URL` environment variable supports multiple origins separated by commas. This allows the backend to accept requests from multiple frontend deployments:

```bash
# Single origin
FRONTEND_URL="https://yourdomain.com"

# Multiple origins
FRONTEND_URL="https://yourdomain.com,http://localhost:8080,http://localhost:5173"
```

### Generating Secure Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Run database migrations
docker-compose exec backend npm run db:migrate

# Access database
docker-compose exec postgres psql -U postgres -d myshopke
```

## Database Management

### Migrations

```bash
# Create new migration
cd backend
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Backup and Restore

```bash
# Create backup
./scripts/backup.sh

# Restore from backup
docker exec -i myshopke-postgres-prod psql -U postgres -d myshopke < backup.sql
```

## Monitoring and Health Checks

### Health Endpoints

- `/health` - Overall application health
- `/ready` - Readiness check for load balancers
- `/live` - Liveness check for container orchestration

### Monitoring

The application includes built-in logging and monitoring:

- Structured JSON logging
- Request/response logging
- Database operation logging
- Security event logging
- Performance metrics

### Log Files

- Application logs: `./logs/app.log`
- Access logs: Console output
- Error logs: Console output + log file

## Security Considerations

### Production Security Checklist

- [ ] Use strong, unique JWT secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable database connection encryption
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Database backups

### SSL/TLS Configuration

For production, configure SSL termination at the reverse proxy level (nginx, CloudFlare, etc.) or use a service like Let's Encrypt.

## Performance Optimization

### Database Optimization

- Enable connection pooling
- Add database indexes for frequently queried fields
- Regular database maintenance (VACUUM, ANALYZE)
- Monitor slow queries

### Application Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Monitor memory usage
- Set up horizontal scaling if needed

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   ```bash
   # Check database status
   docker-compose ps postgres

   # View database logs
   docker-compose logs postgres
   ```

2. **Migration Errors**

   ```bash
   # Reset migrations (development only)
   cd backend
   npx prisma migrate reset

   # Force deploy migrations
   npx prisma migrate deploy --force
   ```

3. **Port Already in Use**

   ```bash
   # Find process using port
   lsof -i :3001

   # Kill process
   kill -9 <PID>
   ```

4. **Docker Issues**

   ```bash
   # Clean up Docker
   docker system prune -a

   # Rebuild containers
   docker-compose build --no-cache
   ```

### Log Analysis

```bash
# View application logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f postgres

# Search logs for errors
docker-compose logs backend | grep ERROR
```

## Scaling and Load Balancing

### Horizontal Scaling

To scale the application horizontally:

1. Use a load balancer (nginx, HAProxy, or cloud load balancer)
2. Run multiple backend instances
3. Use external session storage (Redis)
4. Implement database read replicas

### Example nginx Load Balancer

```nginx
upstream backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

server {
    listen 80;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup Strategy

### Automated Backups

Set up automated backups using cron:

```bash
# Add to crontab
0 2 * * * /path/to/myshopke/scripts/backup.sh
```

### Backup Retention

- Daily backups: Keep for 7 days
- Weekly backups: Keep for 4 weeks
- Monthly backups: Keep for 12 months

## Support and Maintenance

### Regular Maintenance Tasks

- [ ] Monitor application logs
- [ ] Check database performance
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Test backup/restore procedures
- [ ] Monitor disk space
- [ ] Check SSL certificate expiration

### Getting Help

- Check application logs first
- Review this deployment guide
- Check the main README.md for development information
- Create an issue in the repository for bugs or feature requests

## Version Updates

### Updating the Application

1. **Backup database**

   ```bash
   ./scripts/backup.sh
   ```

2. **Pull latest changes**

   ```bash
   git pull origin main
   ```

3. **Update dependencies**

   ```bash
   cd backend && npm install
   cd .. && npm install
   ```

4. **Run migrations**

   ```bash
   cd backend && npx prisma migrate deploy
   ```

5. **Rebuild and restart**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Rolling Back

If issues occur after an update:

1. **Stop services**

   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Restore from backup**

   ```bash
   # Restore database from backup
   docker exec -i myshopke-postgres-prod psql -U postgres -d myshopke < backup.sql
   ```

3. **Revert to previous version**
   ```bash
   git checkout <previous-commit>
   docker-compose -f docker-compose.prod.yml up -d
   ```
