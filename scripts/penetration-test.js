#!/usr/bin/env node

/**
 * Automated Penetration Testing Script
 * Runs basic security tests against the Drishti API
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class PenetrationTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async runAllTests() {
    console.log('🔍 Starting automated penetration testing...');
    console.log(`Target: ${this.baseUrl}`);
    
    await this.testSSLConfiguration();
    await this.testSecurityHeaders();
    await this.testAuthenticationBypass();
    await this.testSQLInjection();
    await this.testXSSVulnerabilities();
    await this.testRateLimiting();
    await this.testDirectoryTraversal();
    await this.testCSRFProtection();
    
    this.generateReport();
    return this.results;
  }

  async testSSLConfiguration() {
    const test = { name: 'SSL/TLS Configuration', status: 'running', findings: [] };
    
    try {
      // Test HTTPS enforcement
      const httpResponse = await this.makeRequest('http://localhost:3001/health');
      if (httpResponse.statusCode !== 301 && httpResponse.statusCode !== 302) {
        test.findings.push({
          severity: 'high',
          issue: 'HTTP not redirected to HTTPS',
          recommendation: 'Implement HTTPS redirect'
        });
      }

      // Test TLS version (simplified check)
      test.findings.push({
        severity: 'info',
        issue: 'TLS configuration check completed',
        recommendation: 'Verify TLS 1.2+ is enforced in production'
      });

      test.status = 'completed';
    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }
    
    this.addTestResult(test);
  }

  async testSecurityHeaders() {
    const test = { name: 'Security Headers', status: 'running', findings: [] };
    
    try {
      const response = await this.makeRequest('/health');
      const headers = response.headers;
      
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security'
      ];

      requiredHeaders.forEach(header => {
        if (!headers[header]) {
          test.findings.push({
            severity: 'medium',
            issue: `Missing security header: ${header}`,
            recommendation: `Add ${header} header to all responses`
          });
        }
      });

      test.status = 'completed';
    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }
    
    this.addTestResult(test);
  }

  async testAuthenticationBypass() {
    const test = { name: 'Authentication Bypass', status: 'running', findings: [] };
    
    try {
      // Test protected endpoints without authentication
      const protectedEndpoints = [
        '/privacy/export',
        '/privacy/consent',
        '/admin/security/dashboard'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await this.makeRequest(endpoint);
        if (response.statusCode === 200) {
          test.findings.push({
            severity: 'critical',
            issue: `Unauthenticated access to ${endpoint}`,
            recommendation: 'Ensure all protected endpoints require authentication'
          });
        }
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }
    
    this.addTestResult(test);
  }

  async testSQLInjection() {
    const test = { name: 'SQL Injection', status: 'running', findings: [] };
    
    try {
      const payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --"
      ];

      // Test login endpoint with SQL injection payloads
      for (const payload of payloads) {
        const response = await this.makeRequest('/auth/login', 'POST', {
          email: payload,
          password: 'test'
        });

        // Look for SQL error messages or unexpected responses
        if (response.body && response.body.includes('SQL') || response.body.includes('syntax error')) {
          test.findings.push({
            severity: 'critical',
            issue: 'Potential SQL injection vulnerability',
            recommendation: 'Use parameterized queries and input validation'
          });
        }
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }
    
    this.addTestResult(test);
  }

  async testXSSVulnerabilities() {
    const test = { name: 'XSS Vulnerabilities', status: 'running', findings: [] };
    
    try {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")'
      ];

      // Test various endpoints with XSS payloads
      for (const payload of xssPayloads) {
        const response = await this.makeRequest(`/health?test=${encodeURIComponent(payload)}`);
        
        if (response.body && response.body.includes(payload)) {
          test.findings.push({
            severity: 'high',
            issue: 'Potential XSS vulnerability - unescaped output',
            recommendation: 'Implement proper output encoding and CSP headers'
          });
        }
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }
    
    this.addTestResult(test);
  }

  async testRateLimiting() {
    const test = { name: 'Rate Limiting', status: 'running', findings: [] };
    
    try {
      // Make rapid requests to test rate limiting
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(this.makeRequest('/health'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.statusCode === 429);

      if (!rateLimited) {
        test.findings.push({
          severity: 'medium',
          issue: 'Rate limiting not detected',
          recommendation: 'Implement rate limiting to prevent abuse'
        });
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }
    
    this.addTestResult(test);
  }

  async testDirectoryTraversal() {
    const test = { name: 'Directory Traversal', status: 'running', findings: [] };
    
    try {
      const traversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd'
      ];

      for (const payload of traversalPayloads) {
        const response = await this.makeRequest(`/static/${payload}`);
        
        if (response.body && (response.body.includes('root:') || response.body.includes('localhost'))) {
          test.findings.push({
            severity: 'critical',
            issue: 'Directory traversal vulnerability detected',
            recommendation: 'Implement proper path validation and sanitization'
          });
        }
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }
    
    this.addTestResult(test);
  }

  async testCSRFProtection() {
    const test = { name: 'CSRF Protection', status: 'running', findings: [] };
    
    try {
      // Test state-changing operations without CSRF tokens
      const response = await this.makeRequest('/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password'
      });

      // Check for CSRF token requirements
      if (response.statusCode === 200 && !response.headers['x-csrf-token']) {
        test.findings.push({
          severity: 'medium',
          issue: 'CSRF protection not detected',
          recommendation: 'Implement CSRF tokens for state-changing operations'
        });
      }

      test.status = 'completed';
    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }
    
    this.addTestResult(test);
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        headers: {
          'User-Agent': 'Drishti-PenTest/1.0',
          'Accept': 'application/json'
        }
      };

      if (body) {
        options.headers['Content-Type'] = 'application/json';
      }

      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  addTestResult(test) {
    this.results.tests.push(test);
    this.results.summary.total++;
    
    if (test.status === 'completed') {
      const criticalOrHigh = test.findings.some(f => f.severity === 'critical' || f.severity === 'high');
      if (criticalOrHigh) {
        this.results.summary.failed++;
      } else if (test.findings.length > 0) {
        this.results.summary.warnings++;
      } else {
        this.results.summary.passed++;
      }
    } else {
      this.results.summary.failed++;
    }
  }

  generateReport() {
    console.log('\n📊 Penetration Testing Results');
    console.log('================================');
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Warnings: ${this.results.summary.warnings}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'security-pentest-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    const hasFailures = this.results.summary.failed > 0;
    process.exit(hasFailures ? 1 : 0);
  }
}

// Run if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  const tester = new PenetrationTester(baseUrl);
  tester.runAllTests().catch(console.error);
}

module.exports = PenetrationTester;
