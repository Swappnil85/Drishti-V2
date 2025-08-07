/**
 * Enhanced Security Middleware
 * Advanced rate limiting, DDoS protection, IP management, and anomaly detection
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { advancedAuthService } from '../services/auth/AdvancedAuthService';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: FastifyRequest) => string;
}

interface SecurityConfig {
  enableDDoSProtection: boolean;
  enableAnomalyDetection: boolean;
  enableGeographicRestrictions: boolean;
  allowedCountries?: string[];
  blockedCountries?: string[];
  trustedProxies?: string[];
}

class SecurityMiddleware {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private suspiciousActivity: Map<string, number> = new Map();
  private blockedIPs: Set<string> = new Set();
  private whitelistedIPs: Set<string> = new Set();
  private requestSignatures: Map<string, string> = new Map();
  
  private readonly config: SecurityConfig = {
    enableDDoSProtection: true,
    enableAnomalyDetection: true,
    enableGeographicRestrictions: false,
    allowedCountries: ['US', 'CA', 'GB', 'AU'],
    trustedProxies: ['127.0.0.1', '::1'],
  };

  /**
   * Advanced rate limiting middleware
   */
  createRateLimiter(config: RateLimitConfig) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const key = config.keyGenerator ? config.keyGenerator(request) : this.getClientKey(request);
      const now = Date.now();
      
      let bucket = this.requestCounts.get(key);
      
      if (!bucket || now > bucket.resetTime) {
        bucket = {
          count: 0,
          resetTime: now + config.windowMs,
        };
      }

      bucket.count++;
      this.requestCounts.set(key, bucket);

      // Check if limit exceeded
      if (bucket.count > config.maxRequests) {
        // Mark as suspicious activity
        this.recordSuspiciousActivity(request.ip);
        
        return reply.code(429).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((bucket.resetTime - now) / 1000)} seconds.`,
          retryAfter: Math.ceil((bucket.resetTime - now) / 1000),
        });
      }

      // Add rate limit headers
      reply.header('X-RateLimit-Limit', config.maxRequests);
      reply.header('X-RateLimit-Remaining', Math.max(0, config.maxRequests - bucket.count));
      reply.header('X-RateLimit-Reset', new Date(bucket.resetTime).toISOString());
    };
  }

  /**
   * DDoS protection middleware
   */
  async ddosProtection(request: FastifyRequest, reply: FastifyReply) {
    if (!this.config.enableDDoSProtection) return;

    const clientIP = request.ip;
    
    // Check if IP is blocked
    if (this.blockedIPs.has(clientIP)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Access denied',
      });
    }

    // Check if IP is whitelisted
    if (this.whitelistedIPs.has(clientIP)) {
      return;
    }

    // Analyze request patterns
    const suspiciousScore = this.calculateSuspiciousScore(request);
    
    if (suspiciousScore > 80) {
      this.blockedIPs.add(clientIP);
      advancedAuthService.markIPSuspicious(clientIP);
      
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Suspicious activity detected',
      });
    }

    if (suspiciousScore > 50) {
      this.recordSuspiciousActivity(clientIP);
    }
  }

  /**
   * Request signing validation middleware
   */
  async validateRequestSignature(request: FastifyRequest, reply: FastifyReply) {
    const signature = request.headers['x-request-signature'] as string;
    const timestamp = request.headers['x-request-timestamp'] as string;
    
    if (!signature || !timestamp) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Request signature and timestamp required for sensitive operations',
      });
    }

    // Check timestamp (prevent replay attacks)
    const requestTime = parseInt(timestamp);
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (Math.abs(now - requestTime) > maxAge) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Request timestamp too old or too far in the future',
      });
    }

    // Validate signature (simplified - in production use proper HMAC)
    const expectedSignature = this.generateRequestSignature(request, timestamp);
    
    if (signature !== expectedSignature) {
      this.recordSuspiciousActivity(request.ip);
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid request signature',
      });
    }
  }

  /**
   * Anomaly detection middleware
   */
  async anomalyDetection(request: FastifyRequest, reply: FastifyReply) {
    if (!this.config.enableAnomalyDetection) return;

    const anomalies = this.detectAnomalies(request);
    
    if (anomalies.length > 0) {
      console.warn(`Anomalies detected for ${request.ip}:`, anomalies);
      
      // Increase suspicious activity score
      this.recordSuspiciousActivity(request.ip, anomalies.length * 10);
      
      // For high-severity anomalies, require additional verification
      const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
      if (highSeverityAnomalies.length > 0) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Additional verification required',
          anomalies: highSeverityAnomalies.map(a => a.type),
        });
      }
    }
  }

  /**
   * Geographic restrictions middleware
   */
  async geographicRestrictions(request: FastifyRequest, reply: FastifyReply) {
    if (!this.config.enableGeographicRestrictions) return;

    const country = this.getCountryFromIP(request.ip);
    
    if (this.config.blockedCountries?.includes(country)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Access not allowed from your location',
      });
    }

    if (this.config.allowedCountries && !this.config.allowedCountries.includes(country)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Access restricted to specific regions',
      });
    }
  }

  /**
   * Security headers middleware
   */
  async securityHeaders(request: FastifyRequest, reply: FastifyReply) {
    // Enhanced security headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // HSTS for HTTPS
    if (request.protocol === 'https') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // CSP for API responses
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
  }

  /**
   * Calculate suspicious score for request
   */
  private calculateSuspiciousScore(request: FastifyRequest): number {
    let score = 0;
    
    // Check user agent
    const userAgent = request.headers['user-agent'] || '';
    if (!userAgent || userAgent.length < 10) score += 20;
    if (userAgent.includes('bot') || userAgent.includes('crawler')) score += 30;
    
    // Check request frequency
    const recentRequests = this.getRecentRequestCount(request.ip);
    if (recentRequests > 100) score += 40;
    if (recentRequests > 200) score += 60;
    
    // Check for suspicious patterns
    const path = request.url;
    if (path.includes('..') || path.includes('<script>')) score += 50;
    if (path.length > 1000) score += 30;
    
    // Check headers
    const headers = request.headers;
    if (!headers.accept || !headers['accept-language']) score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * Detect request anomalies
   */
  private detectAnomalies(request: FastifyRequest): Array<{ type: string; severity: 'low' | 'medium' | 'high' }> {
    const anomalies: Array<{ type: string; severity: 'low' | 'medium' | 'high' }> = [];
    
    // Unusual request size
    const contentLength = parseInt(request.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      anomalies.push({ type: 'large_request_body', severity: 'medium' });
    }
    
    // Unusual request frequency
    const recentRequests = this.getRecentRequestCount(request.ip);
    if (recentRequests > 1000) {
      anomalies.push({ type: 'high_frequency_requests', severity: 'high' });
    }
    
    // Missing common headers
    if (!request.headers['user-agent']) {
      anomalies.push({ type: 'missing_user_agent', severity: 'medium' });
    }
    
    // Suspicious paths
    const path = request.url;
    if (path.includes('admin') && !request.headers.authorization) {
      anomalies.push({ type: 'unauthorized_admin_access', severity: 'high' });
    }
    
    return anomalies;
  }

  /**
   * Generate request signature
   */
  private generateRequestSignature(request: FastifyRequest, timestamp: string): string {
    const method = request.method;
    const path = request.url;
    const body = JSON.stringify(request.body || {});
    
    const payload = `${method}|${path}|${body}|${timestamp}`;
    
    // In production, use proper HMAC with secret key
    return Buffer.from(payload).toString('base64');
  }

  /**
   * Get client key for rate limiting
   */
  private getClientKey(request: FastifyRequest): string {
    // Use IP + User Agent for more granular rate limiting
    const userAgent = request.headers['user-agent'] || 'unknown';
    return `${request.ip}:${Buffer.from(userAgent).toString('base64').substring(0, 20)}`;
  }

  /**
   * Record suspicious activity
   */
  private recordSuspiciousActivity(ip: string, score: number = 10): void {
    const current = this.suspiciousActivity.get(ip) || 0;
    this.suspiciousActivity.set(ip, current + score);
    
    // Auto-block if score too high
    if (current + score > 100) {
      this.blockedIPs.add(ip);
    }
  }

  /**
   * Get recent request count for IP
   */
  private getRecentRequestCount(ip: string): number {
    const bucket = this.requestCounts.get(ip);
    return bucket ? bucket.count : 0;
  }

  /**
   * Get country from IP (simplified - use real GeoIP service in production)
   */
  private getCountryFromIP(ip: string): string {
    // Simplified country detection
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1') {
      return 'US'; // Local/private IPs default to US
    }
    return 'US'; // Default for demo
  }

  /**
   * Whitelist IP
   */
  whitelistIP(ip: string): void {
    this.whitelistedIPs.add(ip);
    this.blockedIPs.delete(ip);
  }

  /**
   * Block IP
   */
  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
  }

  /**
   * Get security statistics
   */
  getStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      whitelistedIPs: this.whitelistedIPs.size,
      suspiciousIPs: this.suspiciousActivity.size,
      activeRateLimits: this.requestCounts.size,
      config: this.config,
    };
  }

  /**
   * Register all security middleware with Fastify
   */
  registerMiddleware(fastify: FastifyInstance) {
    // Global security headers
    fastify.addHook('onRequest', this.securityHeaders.bind(this));
    
    // DDoS protection
    fastify.addHook('onRequest', this.ddosProtection.bind(this));
    
    // Anomaly detection
    fastify.addHook('onRequest', this.anomalyDetection.bind(this));
    
    // Geographic restrictions
    fastify.addHook('onRequest', this.geographicRestrictions.bind(this));
  }
}

export const securityMiddleware = new SecurityMiddleware();
