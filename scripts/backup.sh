#!/bin/bash

# MyShopKE Database Backup Script
set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="myshopke-postgres-prod"
DB_NAME="myshopke"
DB_USER="postgres"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "📦 Creating database backup..."

# Create backup
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/myshopke_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/myshopke_backup_$DATE.sql"

echo "✅ Backup created: $BACKUP_DIR/myshopke_backup_$DATE.sql.gz"

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "myshopke_backup_*.sql.gz" -mtime +7 -delete

echo "🧹 Old backups cleaned up"
echo "📊 Current backups:"
ls -la $BACKUP_DIR/myshopke_backup_*.sql.gz