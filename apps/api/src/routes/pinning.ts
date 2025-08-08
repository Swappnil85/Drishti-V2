import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { securityMonitor } from '../services/monitoring/SecurityMonitor';

export async function pinningRoutes(fastify: FastifyInstance) {
  fastify.post('/security/pinning/violation', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = (request.body as any) || {};
      const { url, reason, expectedHosts, clientInfo } = body;

      // Record as suspicious activity
      securityMonitor.recordSuspiciousActivity(
        'pinning_violation',
        {
          url,
          reason,
          expectedHosts,
          clientInfo,
        },
        {
          ipAddress: (request.headers['x-forwarded-for'] as string) || request.ip,
          userAgent: request.headers['user-agent'] as string,
        }
      );

      return reply.send({ success: true });
    } catch (error) {
      return reply.code(500).send({ success: false, error: (error as Error).message });
    }
  });
}

export default pinningRoutes;

