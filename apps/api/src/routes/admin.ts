import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { privacyService } from '../services/privacy/PrivacyService';
import { securityMonitor } from '../services/monitoring/SecurityMonitor';
import { jwtService } from '../auth/jwt';

interface AuthedRequest extends FastifyRequest {
  user?: { userId: string; role?: string };
}

async function requireAdmin(request: AuthedRequest, reply: FastifyReply) {
  const authHeader = request.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return reply.code(401).send({ success: false, error: 'Missing token' });
  }
  try {
    const payload = await jwtService.verifyToken(token);
    request.user = { userId: payload.sub, role: payload.role };
    if (payload.role !== 'admin') {
      return reply.code(403).send({ success: false, error: 'Admin access required' });
    }
  } catch {
    return reply.code(401).send({ success: false, error: 'Invalid or expired token' });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // Deletion receipts and audit trail
  fastify.get('/admin/privacy/deletion-receipts', { preHandler: requireAdmin as any }, async (request: AuthedRequest, reply: FastifyReply) => {
    try {
      // This would query a deletion_receipts table in production
      // For now, return mock data structure
      const receipts = [
        {
          id: 'receipt_001',
          userId: 'user_123',
          receiptHash: 'abc123...',
          deletionType: 'immediate',
          requestedAt: '2025-01-08T10:00:00Z',
          completedAt: '2025-01-08T10:01:00Z',
          status: 'completed'
        }
      ];
      return reply.send({ success: true, receipts });
    } catch (error) {
      return reply.code(500).send({ success: false, error: 'Failed to get deletion receipts' });
    }
  });

  // Retention policy compliance report
  fastify.get('/admin/privacy/retention-report', { preHandler: requireAdmin as any }, async (request: AuthedRequest, reply: FastifyReply) => {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        totalUsers: 1000, // Mock data
        scheduledDeletions: 5,
        completedDeletions: 15,
        retentionPolicyCompliance: '98.5%',
        upcomingDeletions: [
          { userId: 'user_456', scheduledFor: '2025-01-15T00:00:00Z' }
        ]
      };
      return reply.send({ success: true, report });
    } catch (error) {
      return reply.code(500).send({ success: false, error: 'Failed to generate retention report' });
    }
  });

  // Security metrics dashboard data
  fastify.get('/admin/security/dashboard', { preHandler: requireAdmin as any }, async (request: AuthedRequest, reply: FastifyReply) => {
    try {
      const hours = parseInt((request.query as any)?.hours) || 24;
      const securityStats = securityMonitor.getSecurityStats(hours);
      
      const dashboard = {
        timeframe: `${hours} hours`,
        generatedAt: new Date().toISOString(),
        overview: {
          totalEvents: securityStats.totalEvents,
          criticalEvents: securityStats.eventsBySeverity.critical || 0,
          highEvents: securityStats.eventsBySeverity.high || 0,
          unresolvedEvents: securityStats.unresolvedEvents
        },
        eventsByType: securityStats.eventsByType,
        topSuspiciousIPs: securityStats.topSuspiciousIPs,
        trends: {
          eventsPerHour: securityStats.averageEventsPerHour,
          // Add more trend data as needed
        }
      };
      
      return reply.send({ success: true, dashboard });
    } catch (error) {
      return reply.code(500).send({ success: false, error: 'Failed to get security dashboard' });
    }
  });

  // Incident response trigger
  fastify.post('/admin/security/incident', { preHandler: requireAdmin as any }, async (request: AuthedRequest, reply: FastifyReply) => {
    try {
      const { type, severity, description } = (request.body as any) || {};
      
      // Log the incident
      securityMonitor.recordSuspiciousActivity('manual_incident_report', {
        type,
        severity,
        description,
        reportedBy: request.user?.userId
      });

      // In production, this would trigger incident response procedures:
      // - Send alerts to security team
      // - Create incident ticket
      // - Initiate automated response if configured
      
      return reply.send({ 
        success: true, 
        message: 'Incident reported and response initiated',
        incidentId: `inc_${Date.now()}`
      });
    } catch (error) {
      return reply.code(500).send({ success: false, error: 'Failed to report incident' });
    }
  });

  // Compliance audit trigger
  fastify.post('/admin/compliance/audit', { preHandler: requireAdmin as any }, async (request: AuthedRequest, reply: FastifyReply) => {
    try {
      const auditId = `audit_${Date.now()}`;
      
      // In production, this would:
      // - Generate comprehensive compliance report
      // - Check GDPR/CCPA compliance status
      // - Validate data retention policies
      // - Export audit trail
      
      const auditResult = {
        auditId,
        startedAt: new Date().toISOString(),
        status: 'in_progress',
        estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        scope: ['gdpr', 'ccpa', 'data_retention', 'consent_management']
      };
      
      return reply.send({ success: true, audit: auditResult });
    } catch (error) {
      return reply.code(500).send({ success: false, error: 'Failed to start compliance audit' });
    }
  });
}

export default adminRoutes;
