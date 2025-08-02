#!/bin/bash

# Security Monitoring and Alerting Setup Script for Drishti
# This script sets up comprehensive monitoring and alerting

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
MONITORING_DIR="/etc/drishti/monitoring"
LOG_DIR="/var/log/drishti"
ALERT_EMAIL="admin@your-domain.com"
API_URL="https://api.your-domain.com"

print_status "🔍 Drishti Security Monitoring Setup"
echo "====================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Create monitoring directories
print_status "Creating monitoring directories..."
mkdir -p "$MONITORING_DIR"
mkdir -p "$LOG_DIR"
chmod 755 "$MONITORING_DIR"
chmod 755 "$LOG_DIR"

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    cat > /etc/logrotate.d/drishti << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload drishti-api || true
    endscript
}

$LOG_DIR/security/*.log {
    hourly
    missingok
    rotate 168
    compress
    delaycompress
    notifempty
    create 644 root root
    maxsize 100M
}
EOF

    print_success "Log rotation configured"
}

# Function to create monitoring scripts
create_monitoring_scripts() {
    print_status "Creating monitoring scripts..."
    
    # Health check script
    cat > "$MONITORING_DIR/health-check.sh" << 'EOF'
#!/bin/bash
# Drishti Health Check Script

API_URL="https://api.your-domain.com"
LOG_FILE="/var/log/drishti/health-check.log"
ALERT_EMAIL="admin@your-domain.com"

# Function to send alert
send_alert() {
    local subject="$1"
    local message="$2"
    
    echo "$(date): ALERT - $subject" >> "$LOG_FILE"
    echo "$message" >> "$LOG_FILE"
    
    # Send email alert if mail is configured
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "Drishti Alert: $subject" "$ALERT_EMAIL"
    fi
    
    # Log to syslog
    logger -t drishti-health "ALERT: $subject - $message"
}

# Check API health
check_api_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" --max-time 10)
    
    if [[ "$response" != "200" ]]; then
        send_alert "API Health Check Failed" "API returned status code: $response"
        return 1
    fi
    
    echo "$(date): API health check passed" >> "$LOG_FILE"
    return 0
}

# Check SSL certificate
check_ssl_certificate() {
    local domain=$(echo "$API_URL" | sed 's|https://||' | sed 's|/.*||')
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [[ -n "$expiry_date" ]]; then
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [[ $days_until_expiry -le 30 ]]; then
            send_alert "SSL Certificate Expiring Soon" "SSL certificate expires in $days_until_expiry days"
        fi
        
        echo "$(date): SSL certificate valid for $days_until_expiry days" >> "$LOG_FILE"
    else
        send_alert "SSL Certificate Check Failed" "Could not retrieve SSL certificate information"
    fi
}

# Check disk space
check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $usage -gt 90 ]]; then
        send_alert "Disk Space Critical" "Disk usage is at $usage%"
    elif [[ $usage -gt 80 ]]; then
        send_alert "Disk Space Warning" "Disk usage is at $usage%"
    fi
    
    echo "$(date): Disk usage: $usage%" >> "$LOG_FILE"
}

# Check memory usage
check_memory_usage() {
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [[ $memory_usage -gt 90 ]]; then
        send_alert "Memory Usage Critical" "Memory usage is at $memory_usage%"
    elif [[ $memory_usage -gt 80 ]]; then
        send_alert "Memory Usage Warning" "Memory usage is at $memory_usage%"
    fi
    
    echo "$(date): Memory usage: $memory_usage%" >> "$LOG_FILE"
}

# Main execution
echo "$(date): Starting health check" >> "$LOG_FILE"

check_api_health
check_ssl_certificate
check_disk_space
check_memory_usage

echo "$(date): Health check completed" >> "$LOG_FILE"
EOF

    chmod +x "$MONITORING_DIR/health-check.sh"
    
    # Security monitoring script
    cat > "$MONITORING_DIR/security-monitor.sh" << 'EOF'
#!/bin/bash
# Drishti Security Monitoring Script

API_URL="https://api.your-domain.com"
LOG_FILE="/var/log/drishti/security-monitor.log"
ALERT_EMAIL="admin@your-domain.com"
API_TOKEN="your-admin-api-token"

# Function to send security alert
send_security_alert() {
    local severity="$1"
    local subject="$2"
    local message="$3"
    
    echo "$(date): SECURITY ALERT [$severity] - $subject" >> "$LOG_FILE"
    echo "$message" >> "$LOG_FILE"
    
    # Send email for high/critical alerts
    if [[ "$severity" == "HIGH" || "$severity" == "CRITICAL" ]]; then
        if command -v mail &> /dev/null; then
            echo "$message" | mail -s "Drishti Security Alert [$severity]: $subject" "$ALERT_EMAIL"
        fi
    fi
    
    # Log to syslog
    logger -t drishti-security "[$severity] $subject - $message"
}

# Check security metrics
check_security_metrics() {
    local response=$(curl -s -H "Authorization: Bearer $API_TOKEN" "$API_URL/security/metrics?hours=1" --max-time 10)
    
    if [[ $? -ne 0 ]]; then
        send_security_alert "HIGH" "Security Metrics Check Failed" "Could not retrieve security metrics from API"
        return 1
    fi
    
    # Parse JSON response (requires jq)
    if command -v jq &> /dev/null; then
        local critical_events=$(echo "$response" | jq -r '.metrics.eventsBySeverity.critical // 0')
        local high_events=$(echo "$response" | jq -r '.metrics.eventsBySeverity.high // 0')
        local total_events=$(echo "$response" | jq -r '.metrics.totalEvents // 0')
        
        if [[ $critical_events -gt 0 ]]; then
            send_security_alert "CRITICAL" "Critical Security Events Detected" "Found $critical_events critical security events in the last hour"
        fi
        
        if [[ $high_events -gt 5 ]]; then
            send_security_alert "HIGH" "High Security Events Detected" "Found $high_events high-severity security events in the last hour"
        fi
        
        echo "$(date): Security metrics - Total: $total_events, High: $high_events, Critical: $critical_events" >> "$LOG_FILE"
    else
        print_warning "jq not installed - cannot parse security metrics"
    fi
}

# Check for suspicious IPs
check_suspicious_activity() {
    # Check auth logs for failed login patterns
    local failed_logins=$(grep "authentication failed" /var/log/drishti/auth.log 2>/dev/null | tail -100 | awk '{print $NF}' | sort | uniq -c | sort -nr | head -5)
    
    if [[ -n "$failed_logins" ]]; then
        echo "$(date): Recent failed login attempts by IP:" >> "$LOG_FILE"
        echo "$failed_logins" >> "$LOG_FILE"
        
        # Alert if any IP has more than 10 failed attempts
        local max_attempts=$(echo "$failed_logins" | head -1 | awk '{print $1}')
        if [[ $max_attempts -gt 10 ]]; then
            local suspicious_ip=$(echo "$failed_logins" | head -1 | awk '{print $2}')
            send_security_alert "HIGH" "Brute Force Attack Detected" "IP $suspicious_ip has $max_attempts failed login attempts"
        fi
    fi
}

# Main execution
echo "$(date): Starting security monitoring" >> "$LOG_FILE"

check_security_metrics
check_suspicious_activity

echo "$(date): Security monitoring completed" >> "$LOG_FILE"
EOF

    chmod +x "$MONITORING_DIR/security-monitor.sh"
    
    print_success "Monitoring scripts created"
}

# Function to setup cron jobs
setup_cron_jobs() {
    print_status "Setting up cron jobs..."
    
    # Add monitoring cron jobs
    (crontab -l 2>/dev/null; cat << EOF
# Drishti Monitoring Jobs
# Health check every 5 minutes
*/5 * * * * $MONITORING_DIR/health-check.sh

# Security monitoring every 10 minutes
*/10 * * * * $MONITORING_DIR/security-monitor.sh

# Daily security report at 9 AM
0 9 * * * curl -s -H "Authorization: Bearer your-admin-token" "$API_URL/security/report?hours=24" | mail -s "Daily Drishti Security Report" "$ALERT_EMAIL"

# Weekly system metrics report on Mondays at 10 AM
0 10 * * 1 curl -s -H "Authorization: Bearer your-admin-token" "$API_URL/system/metrics" | mail -s "Weekly Drishti System Report" "$ALERT_EMAIL"
EOF
    ) | crontab -
    
    print_success "Cron jobs configured"
}

# Function to setup systemd service for monitoring
setup_systemd_service() {
    print_status "Setting up systemd monitoring service..."
    
    cat > /etc/systemd/system/drishti-monitor.service << EOF
[Unit]
Description=Drishti Security Monitor
After=network.target

[Service]
Type=simple
User=root
ExecStart=$MONITORING_DIR/security-monitor.sh
Restart=always
RestartSec=300

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable drishti-monitor.service
    
    print_success "Systemd monitoring service configured"
}

# Function to install monitoring dependencies
install_dependencies() {
    print_status "Installing monitoring dependencies..."
    
    # Install required packages
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y curl jq mailutils logrotate
    elif command -v yum &> /dev/null; then
        yum install -y curl jq mailx logrotate
    elif command -v brew &> /dev/null; then
        brew install curl jq
    else
        print_warning "Could not install dependencies automatically"
    fi
    
    print_success "Dependencies installed"
}

# Function to create monitoring dashboard
create_monitoring_dashboard() {
    print_status "Creating monitoring dashboard..."
    
    cat > "$MONITORING_DIR/dashboard.sh" << 'EOF'
#!/bin/bash
# Drishti Monitoring Dashboard

API_URL="https://api.your-domain.com"
API_TOKEN="your-admin-api-token"

clear
echo "🔍 Drishti Security Monitoring Dashboard"
echo "========================================"
echo ""

# System Status
echo "📊 System Status:"
curl -s "$API_URL/health" | jq -r '"Status: " + .status + " | Uptime: " + (.uptime | tostring) + "s"' 2>/dev/null || echo "API not responding"
echo ""

# Security Metrics (last 24 hours)
echo "🚨 Security Metrics (24h):"
curl -s -H "Authorization: Bearer $API_TOKEN" "$API_URL/security/metrics?hours=24" | jq -r '
"Total Events: " + (.metrics.totalEvents | tostring) + 
" | Critical: " + (.metrics.eventsBySeverity.critical // 0 | tostring) + 
" | High: " + (.metrics.eventsBySeverity.high // 0 | tostring)
' 2>/dev/null || echo "Could not retrieve security metrics"
echo ""

# Database Status
echo "🗄️  Database Status:"
curl -s -H "Authorization: Bearer $API_TOKEN" "$API_URL/database/metrics" | jq -r '
"Connections: " + (.activeConnections | tostring) + "/" + (.maxConnections | tostring) + 
" | Size: " + (.databaseSizeMB | tostring) + "MB"
' 2>/dev/null || echo "Could not retrieve database metrics"
echo ""

# Recent Security Events
echo "🔥 Recent Critical Events:"
curl -s -H "Authorization: Bearer $API_TOKEN" "$API_URL/security/events?hours=1&severity=critical" | jq -r '
if .count > 0 then
  .events[] | "- " + .timestamp + ": " + .type
else
  "No critical events in the last hour"
end
' 2>/dev/null || echo "Could not retrieve security events"
echo ""

echo "Last updated: $(date)"
EOF

    chmod +x "$MONITORING_DIR/dashboard.sh"
    
    print_success "Monitoring dashboard created"
}

# Main execution
echo "This script will set up comprehensive monitoring and alerting for Drishti."
echo "Make sure you have configured the API_URL and ALERT_EMAIL variables."
echo ""

read -p "Continue with monitoring setup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Setup cancelled"
    exit 0
fi

# Execute setup steps
install_dependencies
setup_log_rotation
create_monitoring_scripts
setup_cron_jobs
setup_systemd_service
create_monitoring_dashboard

print_success "🎉 Security monitoring and alerting setup completed!"

echo ""
echo "Configuration Summary:"
echo "- Monitoring scripts: $MONITORING_DIR"
echo "- Log files: $LOG_DIR"
echo "- Alert email: $ALERT_EMAIL"
echo ""
echo "Next steps:"
echo "1. Update API_URL and ALERT_EMAIL in the monitoring scripts"
echo "2. Configure API authentication tokens"
echo "3. Test email delivery: echo 'Test' | mail -s 'Test' $ALERT_EMAIL"
echo "4. Run dashboard: $MONITORING_DIR/dashboard.sh"
echo "5. Check logs: tail -f $LOG_DIR/*.log"
echo ""
echo "Monitoring Features:"
echo "✅ Health checks every 5 minutes"
echo "✅ Security monitoring every 10 minutes"
echo "✅ Daily security reports"
echo "✅ SSL certificate expiry monitoring"
echo "✅ System resource monitoring"
echo "✅ Automated alerting via email"
echo "✅ Log rotation and archival"
