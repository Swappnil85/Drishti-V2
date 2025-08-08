import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { retentionService } from '../services/privacy/RetentionService';

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = (request.headers['x-admin-key'] as string) || '';
  if (!process.env.ADMIN_API_KEY || apiKey !== process.env.ADMIN_API_KEY) {
    return reply.code(403).send({ success: false, error: 'Forbidden' });
  }
}

export async function retentionRoutes(fastify: FastifyInstance) {
  fastify.post('/privacy/retention/run', { preHandler: requireAdmin as any }, async (_request, reply) => {
    try {
      const result = await retentionService.runScheduledDeletions();
      return reply.send({ success: true, ...result });
    } catch (error) {
      return reply.code(500).send({ success: false, error: 'Failed to run retention job' });
    }
  });
}

export default retentionRoutes;

