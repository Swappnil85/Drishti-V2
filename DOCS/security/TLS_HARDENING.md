# TLS/SSL Configuration Hardening Guide

## Overview
This document outlines TLS/SSL hardening requirements for Drishti's security-first architecture.

## TLS Configuration Requirements

### Minimum TLS Version
- **Requirement**: TLS 1.2 minimum, TLS 1.3 preferred
- **Implementation**: Configure reverse proxy/load balancer to reject < TLS 1.2
- **Verification**: `curl -v --tlsv1.1 --tls-max 1.1 https://api.drishti.app` should fail

### Cipher Suite Configuration
**Recommended cipher suites (in order of preference):**
```
TLS_AES_256_GCM_SHA384 (TLS 1.3)
TLS_CHACHA20_POLY1305_SHA256 (TLS 1.3)
TLS_AES_128_GCM_SHA256 (TLS 1.3)
ECDHE-RSA-AES256-GCM-SHA384 (TLS 1.2)
ECDHE-RSA-CHACHA20-POLY1305 (TLS 1.2)
ECDHE-RSA-AES128-GCM-SHA256 (TLS 1.2)
```

**Disabled cipher suites:**
- All RC4 ciphers
- All DES/3DES ciphers
- All export-grade ciphers
- All anonymous ciphers
- All NULL ciphers

### HSTS (HTTP Strict Transport Security)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Certificate Configuration
- **Key size**: RSA 2048-bit minimum, ECDSA P-256 preferred
- **Signature algorithm**: SHA-256 minimum
- **Certificate chain**: Complete chain including intermediates
- **OCSP stapling**: Enabled for performance and privacy

### Additional Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

## Implementation Checklist

### Nginx Configuration Example
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### Apache Configuration Example
```apache
SSLProtocol -all +TLSv1.2 +TLSv1.3
SSLCipherSuite ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS
SSLHonorCipherOrder off
SSLUseStapling on
SSLStaplingCache shmcb:/var/run/ocsp(128000)
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

## Monitoring & Validation

### SSL Labs Testing
- Target grade: A+ on SSL Labs test
- Regular automated testing via API
- Alert on grade degradation

### Certificate Monitoring
- Expiration monitoring (30-day threshold)
- Certificate transparency log monitoring
- Revocation status checking

### Compliance Verification
- Monthly TLS configuration audits
- Quarterly penetration testing
- Annual third-party security assessment

## Incident Response

### Certificate Compromise
1. Immediately revoke compromised certificate
2. Deploy new certificate with different key
3. Update certificate pins in mobile app
4. Monitor for unauthorized usage

### TLS Vulnerability Response
1. Assess impact on current configuration
2. Update cipher suites if necessary
3. Test configuration changes in staging
4. Deploy updates with monitoring

## References
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [RFC 8446 - TLS 1.3](https://tools.ietf.org/html/rfc8446)
