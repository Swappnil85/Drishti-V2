# Database Migration Guide - Epic 6 Production Deployment

## Overview

This guide covers the database migration required for Epic 6 Stories 6.1 and 6.2 deployment to production.

**Migration Path**: Schema v1 → v4  
**Breaking Changes**: Yes - Database migration required  
**Downtime Required**: Minimal (< 5 minutes)

## Pre-Migration Checklist

### 1. Backup Current Database ✅
```bash
# Create full database backup
sqlite3 /path/to/production/drishti.db ".backup /path/to/backup/drishti_pre_epic6_$(date +%Y%m%d_%H%M%S).db"

# Verify backup integrity
sqlite3 /path/to/backup/drishti_pre_epic6_*.db "PRAGMA integrity_check;"
```

### 2. Verify Current Schema Version ✅
```sql
-- Check current schema version
SELECT version FROM schema_version;
-- Expected result: 1
```

### 3. Test Migration on Staging ✅
- Deploy to staging environment first
- Run full migration process
- Verify all functionality works
- Run smoke tests

## Migration Steps

### Step 1: Schema Version 1 → 2 (Epic 6.1)
**Purpose**: Add enhanced account fields for account management

```sql
-- Add new columns to financial_accounts table
ALTER TABLE financial_accounts ADD COLUMN institution_id TEXT;
ALTER TABLE financial_accounts ADD COLUMN routing_number TEXT;
ALTER TABLE financial_accounts ADD COLUMN account_number_encrypted TEXT;
ALTER TABLE financial_accounts ADD COLUMN tax_treatment TEXT;
ALTER TABLE financial_accounts ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE financial_accounts ADD COLUMN color TEXT;
ALTER TABLE financial_accounts ADD COLUMN linked_account_ids TEXT DEFAULT '[]';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_accounts_institution_id ON financial_accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_tax_treatment ON financial_accounts(tax_treatment);

-- Update schema version
UPDATE schema_version SET version = 2;
```

### Step 2: Schema Version 2 → 3 (Intermediate)
**Purpose**: Prepare for balance history tracking

```sql
-- Update schema version
UPDATE schema_version SET version = 3;
```

### Step 3: Schema Version 3 → 4 (Epic 6.2)
**Purpose**: Add balance history tracking

```sql
-- Create balance_history table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_history_account_id ON balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_update_method ON balance_history(update_method);
CREATE INDEX IF NOT EXISTS idx_balance_history_created_at ON balance_history(created_at);

-- Update schema version
UPDATE schema_version SET version = 4;
```

## Automated Migration Script

```bash
#!/bin/bash
# production_migration_epic6.sh

set -e  # Exit on any error

DB_PATH="/path/to/production/drishti.db"
BACKUP_PATH="/path/to/backup/drishti_pre_epic6_$(date +%Y%m%d_%H%M%S).db"

echo "🚀 Starting Epic 6 Database Migration..."

# 1. Create backup
echo "📦 Creating database backup..."
sqlite3 "$DB_PATH" ".backup $BACKUP_PATH"
echo "✅ Backup created: $BACKUP_PATH"

# 2. Verify backup
echo "🔍 Verifying backup integrity..."
sqlite3 "$BACKUP_PATH" "PRAGMA integrity_check;" | grep -q "ok" || {
    echo "❌ Backup verification failed!"
    exit 1
}
echo "✅ Backup verified successfully"

# 3. Check current schema version
CURRENT_VERSION=$(sqlite3 "$DB_PATH" "SELECT version FROM schema_version;")
echo "📊 Current schema version: $CURRENT_VERSION"

if [ "$CURRENT_VERSION" -eq 4 ]; then
    echo "✅ Database already at target version 4"
    exit 0
fi

# 4. Run migrations
echo "🔄 Running database migrations..."

# Migration v1 → v2
if [ "$CURRENT_VERSION" -lt 2 ]; then
    echo "🔄 Migrating v1 → v2..."
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
    echo "✅ Migration v1 → v2 completed"
fi

# Migration v2 → v3
if [ "$CURRENT_VERSION" -lt 3 ]; then
    echo "🔄 Migrating v2 → v3..."
    sqlite3 "$DB_PATH" "UPDATE schema_version SET version = 3;"
    echo "✅ Migration v2 → v3 completed"
fi

# Migration v3 → v4
if [ "$CURRENT_VERSION" -lt 4 ]; then
    echo "🔄 Migrating v3 → v4..."
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
    echo "✅ Migration v3 → v4 completed"
fi

# 5. Verify final schema version
FINAL_VERSION=$(sqlite3 "$DB_PATH" "SELECT version FROM schema_version;")
echo "📊 Final schema version: $FINAL_VERSION"

if [ "$FINAL_VERSION" -eq 4 ]; then
    echo "🎉 Database migration completed successfully!"
else
    echo "❌ Migration failed - unexpected final version: $FINAL_VERSION"
    exit 1
fi

echo "✅ Epic 6 Database Migration Complete"
```

## Post-Migration Verification

### 1. Schema Verification ✅
```sql
-- Verify schema version
SELECT version FROM schema_version;
-- Expected: 4

-- Verify new columns exist
PRAGMA table_info(financial_accounts);
-- Should include: institution_id, routing_number, account_number_encrypted, tax_treatment, tags, color, linked_account_ids

-- Verify balance_history table exists
PRAGMA table_info(balance_history);
-- Should show all balance_history columns

-- Verify indexes exist
.indexes financial_accounts
.indexes balance_history
```

### 2. Data Integrity Verification ✅
```sql
-- Check for any data corruption
PRAGMA integrity_check;
-- Expected: ok

-- Verify existing data is intact
SELECT COUNT(*) FROM financial_accounts;
SELECT COUNT(*) FROM users;
-- Should match pre-migration counts

-- Verify new columns have default values
SELECT COUNT(*) FROM financial_accounts WHERE tags IS NULL;
-- Expected: 0 (should have default '[]')
```

### 3. Application Functionality Tests ✅
- Test account creation with new fields
- Test balance updates and history tracking
- Test CSV import functionality
- Test account templates
- Verify all existing functionality still works

## Rollback Plan

### Emergency Rollback Procedure
```bash
#!/bin/bash
# rollback_epic6.sh

DB_PATH="/path/to/production/drishti.db"
BACKUP_PATH="/path/to/backup/drishti_pre_epic6_*.db"

echo "🚨 EMERGENCY ROLLBACK - Epic 6 Database Migration"

# 1. Stop application
echo "🛑 Stopping application..."
# Add your application stop commands here

# 2. Restore from backup
echo "📦 Restoring from backup..."
cp "$BACKUP_PATH" "$DB_PATH"

# 3. Verify restoration
sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok" || {
    echo "❌ Rollback verification failed!"
    exit 1
}

# 4. Start application
echo "🚀 Starting application..."
# Add your application start commands here

echo "✅ Rollback completed successfully"
```

## Monitoring and Alerts

### Key Metrics to Monitor
- Database size increase (expected: ~10-15% due to new tables/indexes)
- Query performance on financial_accounts table
- Balance update operation latency
- Error rates during balance operations

### Alert Thresholds
- Database query time > 500ms
- Balance update failure rate > 1%
- Database connection errors
- Schema version mismatch

## Deployment Timeline

1. **T-30min**: Final staging verification
2. **T-15min**: Notify users of maintenance window
3. **T-0**: Begin deployment
4. **T+2min**: Database migration
5. **T+5min**: Application deployment
6. **T+10min**: Smoke tests
7. **T+15min**: Full functionality verification
8. **T+20min**: Monitoring setup
9. **T+30min**: Deployment complete

## Success Criteria

- ✅ Database migration completes without errors
- ✅ All existing functionality works as expected
- ✅ New Epic 6 features are functional
- ✅ Performance metrics within acceptable ranges
- ✅ No data loss or corruption
- ✅ Monitoring and alerts operational

---

**Document Version**: 1.0  
**Created**: December 2024  
**Last Updated**: December 2024  
**Next Review**: Post-deployment retrospective
