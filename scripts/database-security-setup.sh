#!/bin/bash

# Database Security Setup Script for Drishti
# This script configures PostgreSQL security settings for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DB_NAME="drishti_production"
DB_USER="drishti_api_user"
DB_ADMIN_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

print_status "🔒 Drishti Database Security Setup"
echo "=================================="

# Check if PostgreSQL is running
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
    print_error "PostgreSQL is not running or not accessible"
    exit 1
fi

print_success "PostgreSQL is running"

# Function to execute SQL as admin
execute_sql() {
    local sql="$1"
    local description="$2"
    
    print_status "$description"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d postgres -c "$sql" > /dev/null 2>&1; then
        print_success "✅ $description completed"
    else
        print_error "❌ $description failed"
        return 1
    fi
}

# Function to create secure database user
create_secure_user() {
    print_status "Creating secure database user..."
    
    # Generate secure password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create user with limited privileges
    execute_sql "
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
                CREATE ROLE $DB_USER WITH 
                    LOGIN 
                    NOSUPERUSER 
                    NOCREATEDB 
                    NOCREATEROLE 
                    NOINHERIT 
                    NOREPLICATION 
                    CONNECTION LIMIT 20
                    PASSWORD '$DB_PASSWORD';
            END IF;
        END
        \$\$;
    " "Creating database user"
    
    # Save password to secure file
    echo "DB_PASSWORD=$DB_PASSWORD" > /etc/drishti/db-credentials
    chmod 600 /etc/drishti/db-credentials
    chown root:root /etc/drishti/db-credentials
    
    print_success "Database user created with secure password"
    print_warning "Password saved to /etc/drishti/db-credentials"
}

# Function to create and secure database
create_secure_database() {
    print_status "Creating and securing database..."
    
    # Create database
    execute_sql "
        SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER' 
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')
        \\gexec
    " "Creating database"
    
    # Revoke public access
    execute_sql "
        REVOKE ALL ON DATABASE $DB_NAME FROM PUBLIC;
        GRANT CONNECT ON DATABASE $DB_NAME TO $DB_USER;
    " "Securing database access"
    
    # Connect to the new database and set up schema security
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d "$DB_NAME" << EOF
        -- Revoke public schema access
        REVOKE ALL ON SCHEMA public FROM PUBLIC;
        GRANT USAGE ON SCHEMA public TO $DB_USER;
        GRANT CREATE ON SCHEMA public TO $DB_USER;
        
        -- Set default privileges for future tables
        ALTER DEFAULT PRIVILEGES IN SCHEMA public 
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $DB_USER;
        
        ALTER DEFAULT PRIVILEGES IN SCHEMA public 
        GRANT USAGE, SELECT ON SEQUENCES TO $DB_USER;
        
        -- Enable row level security by default
        ALTER DATABASE $DB_NAME SET row_security = on;
        
        -- Set secure search path
        ALTER DATABASE $DB_NAME SET search_path = public;
        
        -- Disable dangerous functions
        ALTER DATABASE $DB_NAME SET log_statement = 'all';
        ALTER DATABASE $DB_NAME SET log_min_duration_statement = 1000;
EOF
    
    print_success "Database created and secured"
}

# Function to configure PostgreSQL security settings
configure_postgresql_security() {
    print_status "Configuring PostgreSQL security settings..."
    
    # Find PostgreSQL configuration directory
    PG_CONFIG_DIR=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d postgres -t -c "SHOW config_file;" | xargs dirname)
    
    if [[ ! -d "$PG_CONFIG_DIR" ]]; then
        print_error "Could not find PostgreSQL configuration directory"
        return 1
    fi
    
    print_status "PostgreSQL config directory: $PG_CONFIG_DIR"
    
    # Backup original configuration
    cp "$PG_CONFIG_DIR/postgresql.conf" "$PG_CONFIG_DIR/postgresql.conf.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$PG_CONFIG_DIR/pg_hba.conf" "$PG_CONFIG_DIR/pg_hba.conf.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Configure postgresql.conf security settings
    cat >> "$PG_CONFIG_DIR/postgresql.conf" << EOF

# Drishti Security Configuration
# Added by database-security-setup.sh

# Connection and Authentication
ssl = on
ssl_cert_file = '/etc/ssl/certs/postgresql.crt'
ssl_key_file = '/etc/ssl/private/postgresql.key'
ssl_ca_file = '/etc/ssl/certs/ca-certificates.crt'
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'
ssl_prefer_server_ciphers = on
password_encryption = scram-sha-256

# Logging
log_connections = on
log_disconnections = on
log_checkpoints = on
log_lock_waits = on
log_statement = 'ddl'
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_timezone = 'UTC'

# Security
shared_preload_libraries = 'pg_stat_statements'
track_activities = on
track_counts = on
track_functions = all

# Resource limits
max_connections = 100
superuser_reserved_connections = 3
max_prepared_transactions = 0

# Statement timeout (prevent runaway queries)
statement_timeout = 300000  # 5 minutes
lock_timeout = 30000        # 30 seconds
idle_in_transaction_session_timeout = 600000  # 10 minutes

# Work memory limits
work_mem = 4MB
maintenance_work_mem = 64MB
max_stack_depth = 2MB

# Checkpoint and WAL settings for security
checkpoint_timeout = 5min
checkpoint_completion_target = 0.7
wal_buffers = 16MB
wal_writer_delay = 200ms

# Disable dangerous features
allow_system_table_mods = off
EOF

    # Configure pg_hba.conf for secure authentication
    cat > "$PG_CONFIG_DIR/pg_hba.conf" << EOF
# Drishti PostgreSQL Client Authentication Configuration
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     scram-sha-256

# IPv4 local connections
host    all             postgres        127.0.0.1/32           scram-sha-256
host    $DB_NAME        $DB_USER        127.0.0.1/32           scram-sha-256

# IPv6 local connections
host    all             postgres        ::1/128                 scram-sha-256
host    $DB_NAME        $DB_USER        ::1/128                 scram-sha-256

# Remote connections (adjust IP ranges as needed)
# host    $DB_NAME        $DB_USER        10.0.0.0/8              scram-sha-256
# host    $DB_NAME        $DB_USER        172.16.0.0/12           scram-sha-256
# host    $DB_NAME        $DB_USER        192.168.0.0/16          scram-sha-256

# SSL connections only for production
hostssl $DB_NAME        $DB_USER        0.0.0.0/0               scram-sha-256

# Deny all other connections
host    all             all             0.0.0.0/0               reject
EOF

    print_success "PostgreSQL security configuration updated"
}

# Function to setup SSL certificates for PostgreSQL
setup_postgresql_ssl() {
    print_status "Setting up SSL certificates for PostgreSQL..."
    
    # Create SSL directory
    mkdir -p /etc/ssl/postgresql
    chmod 700 /etc/ssl/postgresql
    
    # Generate self-signed certificate for development
    if [[ ! -f /etc/ssl/postgresql/server.crt ]]; then
        openssl req -new -x509 -days 365 -nodes -text \
            -out /etc/ssl/postgresql/server.crt \
            -keyout /etc/ssl/postgresql/server.key \
            -subj "/CN=postgresql-server"
        
        chmod 600 /etc/ssl/postgresql/server.key
        chmod 644 /etc/ssl/postgresql/server.crt
        chown postgres:postgres /etc/ssl/postgresql/server.*
    fi
    
    # Update PostgreSQL configuration to use SSL certificates
    PG_CONFIG_DIR=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_ADMIN_USER" -d postgres -t -c "SHOW config_file;" | xargs dirname)
    
    sed -i "s|ssl_cert_file = '/etc/ssl/certs/postgresql.crt'|ssl_cert_file = '/etc/ssl/postgresql/server.crt'|" "$PG_CONFIG_DIR/postgresql.conf"
    sed -i "s|ssl_key_file = '/etc/ssl/private/postgresql.key'|ssl_key_file = '/etc/ssl/postgresql/server.key'|" "$PG_CONFIG_DIR/postgresql.conf"
    
    print_success "PostgreSQL SSL certificates configured"
}

# Function to create database security audit
create_security_audit() {
    print_status "Creating database security audit..."
    
    # Create audit log directory
    mkdir -p /var/log/drishti
    chmod 750 /var/log/drishti
    chown postgres:postgres /var/log/drishti
    
    # Create security audit script
    cat > /usr/local/bin/drishti-db-audit.sh << 'EOF'
#!/bin/bash
# Drishti Database Security Audit Script

AUDIT_LOG="/var/log/drishti/db-security-audit.log"
DB_NAME="drishti_production"
DB_USER="drishti_api_user"

echo "$(date): Starting database security audit" >> "$AUDIT_LOG"

# Check for suspicious connections
psql -h localhost -U postgres -d "$DB_NAME" -c "
    SELECT 
        client_addr, 
        usename, 
        application_name, 
        state, 
        query_start,
        query
    FROM pg_stat_activity 
    WHERE datname = '$DB_NAME' 
    AND usename != '$DB_USER'
    AND state = 'active'
" >> "$AUDIT_LOG" 2>&1

# Check for long-running queries
psql -h localhost -U postgres -d "$DB_NAME" -c "
    SELECT 
        pid,
        usename,
        query_start,
        state,
        query
    FROM pg_stat_activity 
    WHERE datname = '$DB_NAME'
    AND query_start < NOW() - INTERVAL '5 minutes'
    AND state = 'active'
" >> "$AUDIT_LOG" 2>&1

echo "$(date): Database security audit completed" >> "$AUDIT_LOG"
EOF

    chmod +x /usr/local/bin/drishti-db-audit.sh
    
    # Add to crontab (run every hour)
    (crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/drishti-db-audit.sh") | crontab -
    
    print_success "Database security audit configured"
}

# Function to test database security
test_database_security() {
    print_status "Testing database security configuration..."
    
    # Test connection with application user
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "✅ Application user can connect"
    else
        print_error "❌ Application user cannot connect"
        return 1
    fi
    
    # Test that application user cannot access other databases
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "❌ Application user can access postgres database (security risk)"
        return 1
    else
        print_success "✅ Application user cannot access postgres database"
    fi
    
    # Test SSL connection
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT ssl_is_used();" | grep -q "t"; then
        print_success "✅ SSL connection is working"
    else
        print_warning "⚠️  SSL connection may not be working"
    fi
    
    print_success "Database security tests completed"
}

# Main execution
echo "This script will configure PostgreSQL security for Drishti."
echo "Make sure you have PostgreSQL admin access before continuing."
echo ""

read -p "Continue with database security setup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Setup cancelled"
    exit 0
fi

# Create configuration directory
mkdir -p /etc/drishti
chmod 700 /etc/drishti

# Execute setup steps
create_secure_user
create_secure_database
configure_postgresql_security
setup_postgresql_ssl
create_security_audit

# Restart PostgreSQL to apply configuration changes
print_status "Restarting PostgreSQL to apply configuration changes..."
if systemctl restart postgresql; then
    print_success "PostgreSQL restarted successfully"
    sleep 5  # Wait for PostgreSQL to fully start
else
    print_error "Failed to restart PostgreSQL"
    exit 1
fi

# Test the configuration
test_database_security

print_success "🎉 Database security setup completed!"
print_status "Database credentials saved to: /etc/drishti/db-credentials"
print_status "Audit logs will be saved to: /var/log/drishti/db-security-audit.log"

echo ""
echo "Next steps:"
echo "1. Update your application's environment variables with the new database credentials"
echo "2. Test your application's database connectivity"
echo "3. Monitor the audit logs for any security issues"
echo "4. Consider setting up database backups"
echo ""
echo "Security recommendations:"
echo "- Regularly rotate database passwords"
echo "- Monitor database logs for suspicious activity"
echo "- Keep PostgreSQL updated to the latest version"
echo "- Use connection pooling to limit database connections"
