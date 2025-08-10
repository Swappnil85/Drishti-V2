import fs from 'fs';
import https from 'https';
import { config } from './environment';

/**
 * SSL Certificate Configuration
 * Handles SSL certificate loading and HTTPS server setup
 */

export interface SSLConfig {
  cert: string;
  key: string;
  ca?: string;
}

/**
 * Load SSL certificates from file system
 */
export function loadSSLCertificates(): SSLConfig | null {
  try {
    if (!config.HTTPS_ENABLED) {
      console.log('🔓 HTTPS disabled - running in HTTP mode');
      return null;
    }

    if (!config.SSL_CERT_PATH || !config.SSL_KEY_PATH) {
      console.error('❌ SSL certificate paths not configured');
      if (config.NODE_ENV === 'production') {
        throw new Error('SSL certificates are required in production');
      }
      return null;
    }

    // Check if certificate files exist
    if (!fs.existsSync(config.SSL_CERT_PATH)) {
      throw new Error(
        `SSL certificate file not found: ${config.SSL_CERT_PATH}`
      );
    }

    if (!fs.existsSync(config.SSL_KEY_PATH)) {
      throw new Error(`SSL private key file not found: ${config.SSL_KEY_PATH}`);
    }

    // Load certificate files
    const cert = fs.readFileSync(config.SSL_CERT_PATH, 'utf8');
    const key = fs.readFileSync(config.SSL_KEY_PATH, 'utf8');

    let ca: string | undefined;
    if (config.SSL_CA_PATH && fs.existsSync(config.SSL_CA_PATH)) {
      ca = fs.readFileSync(config.SSL_CA_PATH, 'utf8');
    }

    // Validate certificate format
    if (!cert.includes('BEGIN CERTIFICATE')) {
      throw new Error('Invalid SSL certificate format');
    }

    if (
      !key.includes('BEGIN PRIVATE KEY') &&
      !key.includes('BEGIN RSA PRIVATE KEY')
    ) {
      throw new Error('Invalid SSL private key format');
    }

    console.log('🔒 SSL certificates loaded successfully');

    return { cert, key, ca };
  } catch (error) {
    console.error('❌ Failed to load SSL certificates:', error);

    if (config.NODE_ENV === 'production') {
      throw error;
    }

    return null;
  }
}

/**
 * Create HTTPS server options
 */
export function createHTTPSOptions(): https.ServerOptions | null {
  const sslConfig = loadSSLCertificates();

  if (!sslConfig) {
    return null;
  }

  const httpsOptions: https.ServerOptions = {
    cert: sslConfig.cert,
    key: sslConfig.key,

    // Security configurations
    secureProtocol: 'TLSv1_2_method',
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384',
      'ECDHE-RSA-AES256-SHA256',
      'ECDHE-RSA-AES128-SHA',
      'ECDHE-RSA-AES256-SHA',
      'AES128-GCM-SHA256',
      'AES256-GCM-SHA384',
      'AES128-SHA256',
      'AES256-SHA256',
      'AES128-SHA',
      'AES256-SHA',
    ].join(':'),

    honorCipherOrder: true,

    // Disable weak protocols
    secureOptions:
      require('constants').SSL_OP_NO_SSLv2 |
      require('constants').SSL_OP_NO_SSLv3 |
      require('constants').SSL_OP_NO_TLSv1 |
      require('constants').SSL_OP_NO_TLSv1_1,
  };

  // Add CA certificate if available
  if (sslConfig.ca) {
    httpsOptions.ca = sslConfig.ca;
  }

  return httpsOptions;
}

/**
 * Validate SSL certificate expiry
 */
export function validateCertificateExpiry(): void {
  try {
    if (!config.SSL_CERT_PATH || !fs.existsSync(config.SSL_CERT_PATH)) {
      return;
    }

    const cert = fs.readFileSync(config.SSL_CERT_PATH, 'utf8');
    const crypto = require('crypto');

    // Parse certificate
    const certObj = new crypto.X509Certificate(cert);
    const validTo = new Date(certObj.validTo);
    const now = new Date();

    const daysUntilExpiry = Math.ceil(
      (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 0) {
      console.error('❌ SSL certificate has expired!');
      throw new Error('SSL certificate has expired');
    } else if (daysUntilExpiry <= 30) {
      console.warn(`⚠️  SSL certificate expires in ${daysUntilExpiry} days`);
    } else {
      console.log(`🔒 SSL certificate valid for ${daysUntilExpiry} days`);
    }
  } catch (error) {
    console.error('❌ Failed to validate SSL certificate expiry:', error);
    if (config.NODE_ENV === 'production') {
      throw error;
    }
  }
}

/**
 * Setup HTTPS redirect middleware
 */
export function httpsRedirectMiddleware(req: any, res: any, next: any) {
  if (
    config.FORCE_HTTPS &&
    !req.secure &&
    req.get('x-forwarded-proto') !== 'https'
  ) {
    const httpsUrl = `https://${req.get('host')}${req.url}`;
    console.log(`🔀 Redirecting to HTTPS: ${httpsUrl}`);
    return res.redirect(301, httpsUrl);
  }
  next();
}

/**
 * Security headers for HTTPS
 */
export function securityHeadersMiddleware(req: any, res: any, next: any) {
  // HSTS (HTTP Strict Transport Security)
  if (config.HTTPS_ENABLED) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  next();
}

/**
 * Certificate monitoring and renewal reminder
 */
export function startCertificateMonitoring() {
  if (!config.HTTPS_ENABLED) {
    return;
  }

  // Check certificate expiry on startup
  validateCertificateExpiry();

  // Set up periodic certificate expiry checks (daily)
  setInterval(
    () => {
      try {
        validateCertificateExpiry();
      } catch (error) {
        console.error('Certificate monitoring error:', error);
      }
    },
    24 * 60 * 60 * 1000
  ); // 24 hours

  console.log('🔍 SSL certificate monitoring started');
}

/**
 * Generate self-signed certificate for development
 * WARNING: Only use for development/testing
 */
export function generateSelfSignedCert() {
  if (config.NODE_ENV === 'production') {
    throw new Error('Self-signed certificates cannot be used in production');
  }

  console.log('⚠️  Generating self-signed certificate for development...');

  const selfsigned = require('selfsigned');
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'Development' },
    { name: 'localityName', value: 'Development' },
    { name: 'organizationName', value: 'Drishti Development' },
    { name: 'organizationalUnitName', value: 'Development' },
  ];

  const options = {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 2, value: '127.0.0.1' },
          { type: 7, ip: '127.0.0.1' },
        ],
      },
    ],
  };

  const pems = selfsigned.generate(attrs, options);

  // Save to temporary files
  const certPath = './ssl/dev-cert.pem';
  const keyPath = './ssl/dev-key.pem';

  require('fs').mkdirSync('./ssl', { recursive: true });
  require('fs').writeFileSync(certPath, pems.cert);
  require('fs').writeFileSync(keyPath, pems.private);

  console.log(`📄 Development certificate saved to: ${certPath}`);
  console.log(`🔑 Development private key saved to: ${keyPath}`);
  console.log(
    '⚠️  Remember: Self-signed certificates will show security warnings in browsers'
  );

  return { cert: pems.cert, key: pems.private };
}
