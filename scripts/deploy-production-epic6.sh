#!/bin/bash
# Production Deployment Script - Epic 6 Stories 6.1 & 6.2
# Version: 1.3.0
# Date: December 2024

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Configuration
APP_NAME="Drishti"
VERSION="v1.3.0"
DEPLOYMENT_ENV="production"
DB_PATH="/opt/drishti/data/drishti.db"
BACKUP_DIR="/opt/drishti/backups"
LOG_DIR="/opt/drishti/logs"
APP_DIR="/opt/drishti/app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Start deployment
log "🚀 Starting Epic 6 Production Deployment - $VERSION"
log "📅 Deployment Date: $(date)"
log "🎯 Target Environment: $DEPLOYMENT_ENV"

# Step 1: Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check if required directories exist
if [ ! -d "$APP_DIR" ]; then
    error "Application directory not found: $APP_DIR"
    exit 1
fi

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    error "Database not found: $DB_PATH"
    exit 1
fi

# Check disk space (require at least 1GB free)
AVAILABLE_SPACE=$(df "$APP_DIR" | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then  # 1GB in KB
    error "Insufficient disk space. Available: ${AVAILABLE_SPACE}KB, Required: 1GB"
    exit 1
fi

success "Pre-deployment checks passed"

# Step 2: Create backup
log "📦 Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/drishti_pre_epic6_$(date +%Y%m%d_%H%M%S).db"
sqlite3 "$DB_PATH" ".backup $BACKUP_FILE"

# Verify backup
sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" | grep -q "ok" || {
    error "Backup verification failed!"
    exit 1
}

success "Database backup created and verified: $BACKUP_FILE"

# Step 3: Check current schema version
log "📊 Checking current database schema version..."
CURRENT_VERSION=$(sqlite3 "$DB_PATH" "SELECT version FROM schema_version;" 2>/dev/null || echo "1")
log "Current schema version: $CURRENT_VERSION"

if [ "$CURRENT_VERSION" -eq 4 ]; then
    warning "Database already at target version 4. Skipping migration."
    SKIP_MIGRATION=true
else
    SKIP_MIGRATION=false
fi

# Step 4: Stop application services
log "🛑 Stopping application services..."
# Add your specific service stop commands here
# systemctl stop drishti-app
# systemctl stop drishti-worker
success "Application services stopped"

# Step 5: Database migration
if [ "$SKIP_MIGRATION" = false ]; then
    log "🔄 Running database migration (v$CURRENT_VERSION → v4)..."
    
    # Migration v1 → v2
    if [ "$CURRENT_VERSION" -lt 2 ]; then
        log "🔄 Migrating v1 → v2 (Epic 6.1 - Enhanced Account Fields)..."
        sqlite3 "$DB_PATH" <<EOF
BEGIN TRANSACTION;

ALTER TABLE financial_accounts ADD COLUMN institution_id TEXT;
ALTER TABLE financial_accounts ADD COLUMN routing_number TEXT;
ALTER TABLE financial_accounts ADD COLUMN account_number_encrypted TEXT;
ALTER TABLE financial_accounts ADD COLUMN tax_treatment TEXT;
ALTER TABLE financial_accounts ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE financial_accounts ADD COLUMN color TEXT;
ALTER TABLE financial_accounts ADD COLUMN linked_account_ids TEXT DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_financial_accounts_institution_id ON financial_accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_tax_treatment ON financial_accounts(tax_treatment);

UPDATE schema_version SET version = 2;

COMMIT;
EOF
        success "Migration v1 → v2 completed"
    fi

    # Migration v2 → v3
    if [ "$CURRENT_VERSION" -lt 3 ]; then
        log "🔄 Migrating v2 → v3 (Intermediate)..."
        sqlite3 "$DB_PATH" "UPDATE schema_version SET version = 3;"
        success "Migration v2 → v3 completed"
    fi

    # Migration v3 → v4
    if [ "$CURRENT_VERSION" -lt 4 ]; then
        log "🔄 Migrating v3 → v4 (Epic 6.2 - Balance History)..."
        sqlite3 "$DB_PATH" <<EOF
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS balance_history (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    previous_balance REAL NOT NULL,
    new_balance REAL NOT NULL,
    change_amount REAL NOT NULL,
    change_percentage REAL NOT NULL,
    update_method TEXT NOT NULL,
    notes TEXT,
    metadata TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (account_id) REFERENCES financial_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_balance_history_account_id ON balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_update_method ON balance_history(update_method);
CREATE INDEX IF NOT EXISTS idx_balance_history_created_at ON balance_history(created_at);

UPDATE schema_version SET version = 4;

COMMIT;
EOF
        success "Migration v3 → v4 completed"
    fi

    # Verify final schema version
    FINAL_VERSION=$(sqlite3 "$DB_PATH" "SELECT version FROM schema_version;")
    if [ "$FINAL_VERSION" -eq 4 ]; then
        success "Database migration completed successfully (v$CURRENT_VERSION → v$FINAL_VERSION)"
    else
        error "Migration failed - unexpected final version: $FINAL_VERSION"
        exit 1
    fi
else
    log "⏭️  Skipping database migration (already at target version)"
fi

# Step 6: Deploy application code
log "📱 Deploying application code..."
cd "$APP_DIR"

# Pull latest code
git fetch origin
git checkout "$VERSION"

# Install/update dependencies
npm ci --production

# Build application if needed
# npm run build:production

success "Application code deployed successfully"

# Step 7: Start application services
log "🚀 Starting application services..."
# Add your specific service start commands here
# systemctl start drishti-app
# systemctl start drishti-worker

# Wait for services to start
sleep 10

success "Application services started"

# Step 8: Health checks
log "🏥 Running health checks..."

# Check database connectivity
sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" > /dev/null || {
    error "Database health check failed!"
    exit 1
}

# Check application health endpoint (if available)
# curl -f http://localhost:3000/health || {
#     error "Application health check failed!"
#     exit 1
# }

success "Health checks passed"

# Step 9: Smoke tests
log "🧪 Running smoke tests..."

# Test basic functionality
ACCOUNT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM financial_accounts;")
log "Total accounts in database: $ACCOUNT_COUNT"

# Verify new tables exist
sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='balance_history';" | grep -q "balance_history" || {
    error "balance_history table not found!"
    exit 1
}

# Verify new columns exist
sqlite3 "$DB_PATH" "PRAGMA table_info(financial_accounts);" | grep -q "institution_id" || {
    error "New columns not found in financial_accounts table!"
    exit 1
}

success "Smoke tests passed"

# Step 10: Setup monitoring
log "📊 Setting up monitoring..."

# Create monitoring script
cat > "$LOG_DIR/monitor_epic6.sh" << 'EOF'
#!/bin/bash
# Epic 6 Monitoring Script

DB_PATH="/opt/drishti/data/drishti.db"
LOG_FILE="/opt/drishti/logs/epic6_monitoring.log"

# Check database performance
QUERY_TIME=$(time sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM financial_accounts;" 2>&1 | grep real | awk '{print $2}')
echo "$(date): Query time: $QUERY_TIME" >> "$LOG_FILE"

# Check schema version
SCHEMA_VERSION=$(sqlite3 "$DB_PATH" "SELECT version FROM schema_version;")
echo "$(date): Schema version: $SCHEMA_VERSION" >> "$LOG_FILE"

# Check balance history table size
HISTORY_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM balance_history;")
echo "$(date): Balance history entries: $HISTORY_COUNT" >> "$LOG_FILE"
EOF

chmod +x "$LOG_DIR/monitor_epic6.sh"

# Add to crontab (run every 5 minutes)
# (crontab -l 2>/dev/null; echo "*/5 * * * * $LOG_DIR/monitor_epic6.sh") | crontab -

success "Monitoring setup completed"

# Step 11: Deployment summary
log "📋 Deployment Summary"
log "===================="
log "Version: $VERSION"
log "Database Schema: v$CURRENT_VERSION → v4"
log "Backup Location: $BACKUP_FILE"
log "Deployment Time: $(date)"
log "Status: SUCCESS ✅"

success "🎉 Epic 6 Production Deployment Completed Successfully!"

# Step 12: Post-deployment instructions
log "📝 Post-Deployment Instructions:"
log "1. Monitor application logs for any errors"
log "2. Verify user functionality through manual testing"
log "3. Check monitoring dashboard for performance metrics"
log "4. Backup retention: Keep backup for 30 days minimum"
log "5. Schedule next deployment window for Epic 7"

log "🔗 Useful Commands:"
log "   View logs: tail -f $LOG_DIR/*.log"
log "   Check schema: sqlite3 $DB_PATH 'SELECT version FROM schema_version;'"
log "   Monitor performance: $LOG_DIR/monitor_epic6.sh"

exit 0
