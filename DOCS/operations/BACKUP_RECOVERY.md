# Backup & Recovery Procedures

## Overview

This document outlines simple, cost-effective backup and recovery procedures for Drishti's solopreneur operations. The focus is on automated, reliable backups that protect against data loss while minimizing costs and complexity.

## 🎯 Backup Objectives

### Data Protection Goals
- **Zero Data Loss**: Critical business data protected
- **Quick Recovery**: <4 hours for critical systems
- **Cost Effective**: <$50/month total backup costs
- **Automated**: Minimal manual intervention required
- **Tested**: Regular recovery testing

### Recovery Time Objectives (RTO)
- **Database**: 2 hours maximum
- **Application**: 1 hour maximum
- **User Files**: 4 hours maximum
- **Full System**: 8 hours maximum

### Recovery Point Objectives (RPO)
- **Database**: 1 hour maximum data loss
- **User Files**: 24 hours maximum data loss
- **Code**: Real-time (Git)
- **Configuration**: 24 hours maximum data loss

## 📊 Data Classification

### Critical Data (Daily Backups)
- **Database**: User data, transactions, app data
- **User Uploads**: Profile images, documents
- **Configuration**: Environment variables, secrets
- **Logs**: Error logs, audit trails

### Important Data (Weekly Backups)
- **Analytics**: Usage statistics, metrics
- **Documentation**: Project documentation
- **Deployment Scripts**: Infrastructure as code
- **Monitoring Data**: Historical performance data

### Non-Critical Data (Monthly Backups)
- **Development Files**: Local development data
- **Temporary Files**: Cache, temporary uploads
- **Archive Data**: Old logs, deprecated data

## 🗄️ Database Backup Strategy

### PostgreSQL Automated Backups

#### Daily Automated Backup Script
```bash
#!/bin/bash
# scripts/backup-database.sh

# Configuration
DB_NAME="drishti_production"
DB_USER="postgres"
BACKUP_DIR="/backups/database"
S3_BUCKET="drishti-backups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${DB_NAME}_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Create database dump
echo "Creating database backup: $BACKUP_FILE"
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_PATH

# Compress backup
gzip $BACKUP_PATH
BACKUP_PATH="${BACKUP_PATH}.gz"

# Upload to S3 (if configured)
if [ ! -z "$S3_BUCKET" ]; then
    echo "Uploading to S3: $S3_BUCKET"
    aws s3 cp $BACKUP_PATH s3://$S3_BUCKET/database/
fi

# Clean up old local backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_PATH"
```

#### Cron Job Setup
```bash
# Add to crontab (crontab -e)
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/backup.log 2>&1

# Weekly full backup at 1 AM Sunday
0 1 * * 0 /path/to/scripts/backup-database-full.sh >> /var/log/backup.log 2>&1
```

### Database Backup Verification
```bash
#!/bin/bash
# scripts/verify-backup.sh

BACKUP_FILE=$1
TEST_DB="drishti_backup_test"

# Create test database
psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
psql -U postgres -c "CREATE DATABASE $TEST_DB;"

# Restore backup to test database
gunzip -c $BACKUP_FILE | psql -U postgres -d $TEST_DB

# Verify data integrity
TABLE_COUNT=$(psql -U postgres -d $TEST_DB -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
USER_COUNT=$(psql -U postgres -d $TEST_DB -t -c "SELECT count(*) FROM users;")

echo "Tables restored: $TABLE_COUNT"
echo "Users restored: $USER_COUNT"

# Clean up test database
psql -U postgres -c "DROP DATABASE $TEST_DB;"

if [ $TABLE_COUNT -gt 0 ] && [ $USER_COUNT -gt 0 ]; then
    echo "✅ Backup verification successful"
    exit 0
else
    echo "❌ Backup verification failed"
    exit 1
fi
```

## 📁 File System Backup Strategy

### User Uploads Backup
```bash
#!/bin/bash
# scripts/backup-files.sh

# Configuration
UPLOADS_DIR="/app/uploads"
BACKUP_DIR="/backups/files"
S3_BUCKET="drishti-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create incremental backup using rsync
rsync -av --delete $UPLOADS_DIR/ $BACKUP_DIR/current/

# Create dated snapshot
cp -al $BACKUP_DIR/current/ $BACKUP_DIR/$TIMESTAMP/

# Upload to S3
if [ ! -z "$S3_BUCKET" ]; then
    aws s3 sync $BACKUP_DIR/current/ s3://$S3_BUCKET/files/ --delete
fi

# Clean up old snapshots (keep 30 days)
find $BACKUP_DIR -maxdepth 1 -type d -name "20*" -mtime +30 -exec rm -rf {} \;

echo "File backup completed: $TIMESTAMP"
```

### Configuration Backup
```bash
#!/bin/bash
# scripts/backup-config.sh

# Configuration files to backup
CONFIG_FILES=(
    "/app/.env.production"
    "/app/docker-compose.yml"
    "/etc/nginx/sites-available/drishti"
    "/etc/ssl/certs/drishti.crt"
    "/etc/ssl/private/drishti.key"
)

BACKUP_DIR="/backups/config"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/config_$TIMESTAMP.tar.gz"

# Create backup archive
tar -czf $BACKUP_PATH ${CONFIG_FILES[@]}

# Upload to S3
aws s3 cp $BACKUP_PATH s3://drishti-backups/config/

echo "Configuration backup completed: $BACKUP_PATH"
```

## ☁️ Cloud Backup Solutions

### AWS S3 Setup (Recommended)
**Cost**: ~$5-15/month for typical usage
**Retention**: 30 days standard, 90 days archive

#### S3 Bucket Configuration
```json
{
  "Rules": [
    {
      "ID": "DatabaseBackupLifecycle",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "database/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

#### AWS CLI Setup
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json

# Create S3 bucket
aws s3 mb s3://drishti-backups

# Set bucket policy for lifecycle management
aws s3api put-bucket-lifecycle-configuration --bucket drishti-backups --lifecycle-configuration file://lifecycle.json
```

### Alternative: Google Cloud Storage
**Cost**: Similar to S3
**Setup**: Use `gsutil` instead of AWS CLI

### Budget Option: Backblaze B2
**Cost**: ~$1-5/month
**Setup**: Use B2 CLI or S3-compatible API

## 🔄 Recovery Procedures

### Database Recovery

#### Full Database Restore
```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1
DB_NAME="drishti_production"
DB_USER="postgres"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 1
fi

# Stop application
echo "Stopping application..."
docker-compose stop api

# Create backup of current database
echo "Creating safety backup..."
pg_dump -h localhost -U $DB_USER -d $DB_NAME > "/tmp/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"

# Drop and recreate database
echo "Recreating database..."
psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
echo "Restoring from backup: $BACKUP_FILE"
gunzip -c $BACKUP_FILE | psql -U $DB_USER -d $DB_NAME

# Start application
echo "Starting application..."
docker-compose start api

# Verify restore
echo "Verifying restore..."
USER_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM users;")
echo "Users restored: $USER_COUNT"

echo "✅ Database restore completed"
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# scripts/restore-point-in-time.sh

TARGET_TIME=$1  # Format: 2025-01-15 14:30:00

if [ -z "$TARGET_TIME" ]; then
    echo "Usage: $0 'YYYY-MM-DD HH:MM:SS'"
    exit 1
fi

# Find the latest backup before target time
BACKUP_FILE=$(find /backups/database -name "*.sql.gz" -newermt "$TARGET_TIME" | sort | head -1)

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ No backup found before target time"
    exit 1
fi

echo "Using backup: $BACKUP_FILE"
echo "Target time: $TARGET_TIME"

# Restore using the found backup
./restore-database.sh $BACKUP_FILE
```

### File Recovery

#### Restore User Uploads
```bash
#!/bin/bash
# scripts/restore-files.sh

SOURCE_PATH=$1  # S3 path or local backup path
TARGET_PATH="/app/uploads"

if [ -z "$SOURCE_PATH" ]; then
    echo "Usage: $0 <source_path>"
    echo "Examples:"
    echo "  $0 s3://drishti-backups/files/"
    echo "  $0 /backups/files/20250115_140000/"
    exit 1
fi

echo "⚠️  WARNING: This will replace current files!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 1
fi

# Create backup of current files
echo "Creating safety backup..."
cp -r $TARGET_PATH "/tmp/files_backup_$(date +%Y%m%d_%H%M%S)"

# Restore files
if [[ $SOURCE_PATH == s3://* ]]; then
    echo "Restoring from S3..."
    aws s3 sync $SOURCE_PATH $TARGET_PATH --delete
else
    echo "Restoring from local backup..."
    rsync -av --delete $SOURCE_PATH/ $TARGET_PATH/
fi

# Fix permissions
chown -R app:app $TARGET_PATH
chmod -R 755 $TARGET_PATH

echo "✅ File restore completed"
```

## 🧪 Backup Testing

### Monthly Backup Test
```bash
#!/bin/bash
# scripts/test-backups.sh

echo "🧪 Starting monthly backup test..."

# Test database backup
echo "Testing database backup..."
LATEST_DB_BACKUP=$(find /backups/database -name "*.sql.gz" | sort | tail -1)
if [ ! -z "$LATEST_DB_BACKUP" ]; then
    ./verify-backup.sh $LATEST_DB_BACKUP
    if [ $? -eq 0 ]; then
        echo "✅ Database backup test passed"
    else
        echo "❌ Database backup test failed"
    fi
else
    echo "❌ No database backup found"
fi

# Test file backup
echo "Testing file backup..."
if [ -d "/backups/files/current" ]; then
    FILE_COUNT=$(find /backups/files/current -type f | wc -l)
    echo "Files in backup: $FILE_COUNT"
    if [ $FILE_COUNT -gt 0 ]; then
        echo "✅ File backup test passed"
    else
        echo "❌ File backup test failed - no files found"
    fi
else
    echo "❌ File backup directory not found"
fi

# Test S3 connectivity
echo "Testing S3 connectivity..."
aws s3 ls s3://drishti-backups/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ S3 connectivity test passed"
else
    echo "❌ S3 connectivity test failed"
fi

echo "🧪 Backup test completed"
```

### Disaster Recovery Drill
```bash
#!/bin/bash
# scripts/disaster-recovery-drill.sh

echo "🚨 Starting disaster recovery drill..."
echo "This will test full system recovery on a test environment"

# Create test environment
echo "Setting up test environment..."
docker-compose -f docker-compose.test.yml up -d

# Wait for services to start
sleep 30

# Restore database
echo "Restoring database..."
LATEST_BACKUP=$(find /backups/database -name "*.sql.gz" | sort | tail -1)
gunzip -c $LATEST_BACKUP | docker exec -i test_postgres psql -U postgres -d drishti_test

# Restore files
echo "Restoring files..."
docker cp /backups/files/current/. test_api:/app/uploads/

# Test application
echo "Testing application..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

if [ $HTTP_STATUS -eq 200 ]; then
    echo "✅ Disaster recovery drill successful"
else
    echo "❌ Disaster recovery drill failed - HTTP $HTTP_STATUS"
fi

# Clean up test environment
echo "Cleaning up test environment..."
docker-compose -f docker-compose.test.yml down -v

echo "🚨 Disaster recovery drill completed"
```

## 📋 Backup Monitoring

### Backup Status Dashboard
```bash
#!/bin/bash
# scripts/backup-status.sh

echo "📊 Backup Status Dashboard"
echo "========================="
echo

# Database backups
echo "📁 Database Backups:"
DB_BACKUP_COUNT=$(find /backups/database -name "*.sql.gz" -mtime -7 | wc -l)
LATEST_DB_BACKUP=$(find /backups/database -name "*.sql.gz" | sort | tail -1)
LATEST_DB_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$LATEST_DB_BACKUP" 2>/dev/null || echo "Not found")

echo "  Recent backups (7 days): $DB_BACKUP_COUNT"
echo "  Latest backup: $LATEST_DB_DATE"
echo

# File backups
echo "📂 File Backups:"
if [ -d "/backups/files/current" ]; then
    FILE_BACKUP_SIZE=$(du -sh /backups/files/current | cut -f1)
    FILE_BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "/backups/files/current" 2>/dev/null || echo "Not found")
    echo "  Current backup size: $FILE_BACKUP_SIZE"
    echo "  Last updated: $FILE_BACKUP_DATE"
else
    echo "  ❌ No file backups found"
fi
echo

# S3 status
echo "☁️  S3 Backup Status:"
S3_DB_COUNT=$(aws s3 ls s3://drishti-backups/database/ | wc -l 2>/dev/null || echo "0")
S3_FILES_SIZE=$(aws s3 ls s3://drishti-backups/files/ --recursive --summarize 2>/dev/null | grep "Total Size" | awk '{print $3 " " $4}' || echo "Unknown")

echo "  Database backups in S3: $S3_DB_COUNT"
echo "  Files size in S3: $S3_FILES_SIZE"
echo

# Backup health
echo "🏥 Backup Health:"
DAYS_SINCE_DB_BACKUP=$(find /backups/database -name "*.sql.gz" -mtime -1 | wc -l)
DAYS_SINCE_FILE_BACKUP=$(find /backups/files -name "current" -mtime -1 | wc -l)

if [ $DAYS_SINCE_DB_BACKUP -gt 0 ]; then
    echo "  ✅ Database backup: Recent"
else
    echo "  ❌ Database backup: Overdue"
fi

if [ $DAYS_SINCE_FILE_BACKUP -gt 0 ]; then
    echo "  ✅ File backup: Recent"
else
    echo "  ❌ File backup: Overdue"
fi
```

### Backup Alerts
```bash
#!/bin/bash
# scripts/backup-alerts.sh

# Check if backups are current
DB_BACKUP_AGE=$(find /backups/database -name "*.sql.gz" -mtime -1 | wc -l)
FILE_BACKUP_AGE=$(find /backups/files -name "current" -mtime -1 | wc -l)

# Send alerts if backups are overdue
if [ $DB_BACKUP_AGE -eq 0 ]; then
    echo "❌ ALERT: Database backup is overdue (>24 hours)"
    # Send email/Slack notification here
fi

if [ $FILE_BACKUP_AGE -eq 0 ]; then
    echo "❌ ALERT: File backup is overdue (>24 hours)"
    # Send email/Slack notification here
fi

# Check S3 connectivity
aws s3 ls s3://drishti-backups/ > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ALERT: Cannot connect to S3 backup storage"
    # Send email/Slack notification here
fi
```

## 📅 Backup Schedule

### Daily Tasks (Automated)
- **2:00 AM**: Database backup
- **3:00 AM**: File backup
- **4:00 AM**: Upload to S3
- **5:00 AM**: Backup verification
- **6:00 AM**: Cleanup old backups

### Weekly Tasks (Automated)
- **Sunday 1:00 AM**: Full database backup
- **Sunday 2:00 AM**: Configuration backup
- **Sunday 3:00 AM**: Full system backup test

### Monthly Tasks (Manual)
- **First Monday**: Disaster recovery drill
- **Second Monday**: Backup strategy review
- **Third Monday**: Storage cost optimization
- **Fourth Monday**: Documentation update

### Quarterly Tasks (Manual)
- **Review backup retention policies**
- **Test restore procedures**
- **Update backup scripts**
- **Audit backup security**

## 💰 Cost Management

### Current Backup Costs
- **AWS S3**: ~$10-15/month
- **Local Storage**: ~$5/month (additional disk)
- **Monitoring**: Free (scripts)
- **Total**: ~$15-20/month

### Cost Optimization
- **Use S3 lifecycle policies**: Move old backups to cheaper storage
- **Compress backups**: Reduce storage costs by 60-80%
- **Retention policies**: Delete old backups automatically
- **Monitor usage**: Regular cost reviews

### Scaling Costs
- **$1K revenue**: Add redundant backups (+$10/month)
- **$5K revenue**: Add real-time replication (+$50/month)
- **$10K revenue**: Add enterprise backup solution (+$200/month)

## 🔒 Backup Security

### Encryption
```bash
# Encrypt backup before upload
gpg --symmetric --cipher-algo AES256 backup.sql.gz
aws s3 cp backup.sql.gz.gpg s3://drishti-backups/encrypted/
```

### Access Control
- **S3 bucket**: Private, IAM user with minimal permissions
- **Local backups**: Restricted file permissions (600)
- **Encryption keys**: Stored separately from backups
- **Audit logs**: Track backup access

### Compliance
- **Data retention**: Follow local data protection laws
- **Cross-border**: Consider data residency requirements
- **User data**: Include backup info in privacy policy

## 📚 Additional Resources

### Documentation
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 Backup Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/backup-for-s3.html)
- [Disaster Recovery Planning](https://aws.amazon.com/disaster-recovery/)

### Tools
- [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [AWS CLI](https://aws.amazon.com/cli/)
- [rsync](https://rsync.samba.org/)

---

**Document Control**
- **Author**: AI System Analyst
- **Version**: 1.0
- **Last Updated**: January 2025
- **Review Cycle**: Quarterly
- **Next Review**: April 2025