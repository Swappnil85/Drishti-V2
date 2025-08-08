import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { certificateMonitor } from '../services/monitoring/CertificateMonitor';

export async function certificateRoutes(fastify: FastifyInstance) {
  // Fetch current server certificate info for a host (admin-only in production)
  fastify.get(
    '/security/certificates/info',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const q = request.query as any;
        const host = q?.host || 'api.drishti.app';
        const port = q?.port ? parseInt(q.port) : 443;
        const info = await certificateMonitor.fetchServerCertificate(
          host,
          port
        );
        return reply.send({ success: true, host, port, info });
      } catch (error) {
        return reply
          .code(500)
          .send({ success: false, error: (error as Error).message });
      }
    }
  );

  // Fetch recent CT log entries for a domain
  fastify.get(
    '/security/certificates/ct',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const q = request.query as any;
        const domain = q?.domain || 'api.drishti.app';
        const entries = await certificateMonitor.fetchCTEntries(domain);
        return reply.send({
          success: true,
          domain,
          count: entries.length,
          entries: entries.slice(0, 50),
        });
      } catch (error) {
        return reply
          .code(500)
          .send({ success: false, error: (error as Error).message });
      }
    }
  );
}

export default certificateRoutes;
