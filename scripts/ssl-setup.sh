#!/bin/bash

# SSL Certificate Setup Script for Drishti API
# This script helps set up SSL certificates for production deployment

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
SSL_DIR="/etc/ssl/drishti"
CERT_FILE="$SSL_DIR/certificate.crt"
KEY_FILE="$SSL_DIR/private.key"
CA_FILE="$SSL_DIR/ca-bundle.crt"
DOMAIN="your-production-domain.com"

print_status "🔒 Drishti SSL Certificate Setup"
echo "=================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Create SSL directory
print_status "Creating SSL directory..."
mkdir -p "$SSL_DIR"
chmod 700 "$SSL_DIR"

# Function to setup Let's Encrypt certificate
setup_letsencrypt() {
    print_status "Setting up Let's Encrypt certificate..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        print_status "Installing certbot..."
        if command -v apt-get &> /dev/null; then
            apt-get update
            apt-get install -y certbot
        elif command -v yum &> /dev/null; then
            yum install -y certbot
        elif command -v brew &> /dev/null; then
            brew install certbot
        else
            print_error "Could not install certbot. Please install manually."
            exit 1
        fi
    fi
    
    # Get certificate
    print_status "Obtaining SSL certificate for $DOMAIN..."
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    # Copy certificates to our directory
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_FILE"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$KEY_FILE"
    cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$CA_FILE"
    
    # Set proper permissions
    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"
    chmod 644 "$CA_FILE"
    
    print_success "Let's Encrypt certificate installed successfully!"
}

# Function to setup custom certificate
setup_custom_certificate() {
    print_status "Setting up custom SSL certificate..."
    
    echo "Please provide the paths to your SSL certificate files:"
    read -p "Certificate file (.crt or .pem): " CUSTOM_CERT
    read -p "Private key file (.key or .pem): " CUSTOM_KEY
    read -p "CA bundle file (optional, press enter to skip): " CUSTOM_CA
    
    # Validate files exist
    if [[ ! -f "$CUSTOM_CERT" ]]; then
        print_error "Certificate file not found: $CUSTOM_CERT"
        exit 1
    fi
    
    if [[ ! -f "$CUSTOM_KEY" ]]; then
        print_error "Private key file not found: $CUSTOM_KEY"
        exit 1
    fi
    
    # Copy files
    cp "$CUSTOM_CERT" "$CERT_FILE"
    cp "$CUSTOM_KEY" "$KEY_FILE"
    
    if [[ -n "$CUSTOM_CA" && -f "$CUSTOM_CA" ]]; then
        cp "$CUSTOM_CA" "$CA_FILE"
    fi
    
    # Set proper permissions
    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"
    [[ -f "$CA_FILE" ]] && chmod 644 "$CA_FILE"
    
    print_success "Custom SSL certificate installed successfully!"
}

# Function to generate self-signed certificate (development only)
setup_selfsigned_certificate() {
    print_warning "Generating self-signed certificate (DEVELOPMENT ONLY)"
    print_warning "Do NOT use self-signed certificates in production!"
    
    # Generate private key
    openssl genrsa -out "$KEY_FILE" 2048
    
    # Generate certificate
    openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 \
        -subj "/C=US/ST=Development/L=Development/O=Drishti/OU=Development/CN=localhost"
    
    # Set proper permissions
    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"
    
    print_success "Self-signed certificate generated successfully!"
    print_warning "Remember: Browsers will show security warnings for self-signed certificates"
}

# Function to validate certificate
validate_certificate() {
    print_status "Validating SSL certificate..."
    
    if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" ]]; then
        print_error "Certificate files not found"
        return 1
    fi
    
    # Check certificate format
    if ! openssl x509 -in "$CERT_FILE" -text -noout > /dev/null 2>&1; then
        print_error "Invalid certificate format"
        return 1
    fi
    
    # Check private key format
    if ! openssl rsa -in "$KEY_FILE" -check -noout > /dev/null 2>&1; then
        print_error "Invalid private key format"
        return 1
    fi
    
    # Check if certificate and key match
    CERT_MODULUS=$(openssl x509 -noout -modulus -in "$CERT_FILE" | openssl md5)
    KEY_MODULUS=$(openssl rsa -noout -modulus -in "$KEY_FILE" | openssl md5)
    
    if [[ "$CERT_MODULUS" != "$KEY_MODULUS" ]]; then
        print_error "Certificate and private key do not match"
        return 1
    fi
    
    # Check certificate expiry
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
    
    if [[ $DAYS_UNTIL_EXPIRY -le 0 ]]; then
        print_error "Certificate has expired!"
        return 1
    elif [[ $DAYS_UNTIL_EXPIRY -le 30 ]]; then
        print_warning "Certificate expires in $DAYS_UNTIL_EXPIRY days"
    else
        print_success "Certificate is valid for $DAYS_UNTIL_EXPIRY days"
    fi
    
    print_success "SSL certificate validation passed!"
    return 0
}

# Function to setup certificate renewal
setup_certificate_renewal() {
    print_status "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/drishti-cert-renewal.sh << 'EOF'
#!/bin/bash
# Drishti SSL Certificate Renewal Script

DOMAIN="your-production-domain.com"
SSL_DIR="/etc/ssl/drishti"
LOG_FILE="/var/log/drishti-cert-renewal.log"

echo "$(date): Starting certificate renewal check" >> "$LOG_FILE"

# Renew Let's Encrypt certificate
if certbot renew --quiet; then
    echo "$(date): Certificate renewed successfully" >> "$LOG_FILE"
    
    # Copy renewed certificates
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/certificate.crt"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/private.key"
    cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$SSL_DIR/ca-bundle.crt"
    
    # Set proper permissions
    chmod 600 "$SSL_DIR/private.key"
    chmod 644 "$SSL_DIR/certificate.crt"
    chmod 644 "$SSL_DIR/ca-bundle.crt"
    
    # Restart Drishti API service
    systemctl restart drishti-api || true
    
    echo "$(date): Certificate renewal completed" >> "$LOG_FILE"
else
    echo "$(date): Certificate renewal failed" >> "$LOG_FILE"
fi
EOF

    chmod +x /usr/local/bin/drishti-cert-renewal.sh
    
    # Add to crontab (run twice daily)
    (crontab -l 2>/dev/null; echo "0 2,14 * * * /usr/local/bin/drishti-cert-renewal.sh") | crontab -
    
    print_success "Automatic certificate renewal configured!"
}

# Main menu
echo "Choose SSL certificate setup option:"
echo "1) Let's Encrypt (Recommended for production)"
echo "2) Custom certificate (Bring your own certificate)"
echo "3) Self-signed certificate (Development only)"
echo "4) Validate existing certificate"
echo "5) Setup certificate renewal"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        read -p "Enter your domain name: " DOMAIN
        setup_letsencrypt
        validate_certificate
        setup_certificate_renewal
        ;;
    2)
        setup_custom_certificate
        validate_certificate
        ;;
    3)
        setup_selfsigned_certificate
        validate_certificate
        ;;
    4)
        validate_certificate
        ;;
    5)
        setup_certificate_renewal
        ;;
    6)
        print_status "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Update environment file
print_status "Updating environment configuration..."
cat >> /path/to/your/app/.env.production << EOF

# SSL Configuration (Updated by ssl-setup.sh)
HTTPS_ENABLED=true
SSL_CERT_PATH=$CERT_FILE
SSL_KEY_PATH=$KEY_FILE
SSL_CA_PATH=$CA_FILE
FORCE_HTTPS=true
EOF

print_success "🎉 SSL certificate setup completed!"
print_status "Certificate location: $CERT_FILE"
print_status "Private key location: $KEY_FILE"
print_status "CA bundle location: $CA_FILE"
print_warning "Remember to update your environment variables and restart the application"

echo ""
echo "Next steps:"
echo "1. Update your DNS records to point to this server"
echo "2. Update your environment variables with the certificate paths"
echo "3. Restart the Drishti API service"
echo "4. Test HTTPS connectivity"
