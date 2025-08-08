import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { privacyService } from '../services/privacy/PrivacyService';
import { jwtService } from '../auth/jwt';

const IS_PREVIEW = String(process.env.PREVIEW_MODE).toLowerCase() === 'true';

interface AuthedRequest extends FastifyRequest {
  user?: { userId: string; email: string; role?: string };
}

async function requireAuth(request: AuthedRequest, reply: FastifyReply) {
  // In preview mode, bypass JWT and use a dev user for demo
  if (IS_PREVIEW) {
    (request as AuthedRequest).user = {
      userId: 'dev-user-123',
      email: 'dev@drishti.app',
      role: 'user',
    };
    return;
  }

  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply
        .code(401)
        .send({ success: false, error: 'Authorization header is required' });
    }
    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);
    (request as AuthedRequest).user = payload as any;
  } catch (_error) {
    return reply
      .code(401)
      .send({ success: false, error: 'Invalid or expired token' });
  }
}

export async function privacyRoutes(fastify: FastifyInstance) {
  // Export data
  fastify.get(
    '/privacy/export',
    { preHandler: requireAuth as any },
    async (request: AuthedRequest, reply) => {
      const userId = request.user!.userId;
      const { format, types } = (request.query as any) || {};
      const allowedFormats = ['json', 'csv', 'pdf', 'zip'];
      const selectedFormat = allowedFormats.includes(format) ? format : 'json';

      try {
        const result = await privacyService.exportData(userId, {
          format: selectedFormat as any,
          types: Array.isArray(types) ? (types as any) : undefined,
        });

        if (selectedFormat === 'pdf') {
          // Return as base64 by default; optionally as application/pdf if requested
          const base64 = (result as any).pdf as string;
          if ((request.headers['accept'] || '').includes('application/pdf')) {
            const buf = Buffer.from(base64, 'base64');
            reply.header('Content-Type', 'application/pdf');
            reply.header(
              'Content-Disposition',
              'attachment; filename="drishti-export.pdf"'
            );
            return reply.send(buf);
          }
          return reply.send({ success: true, ...result });
        }

        if (selectedFormat === 'zip') {
          const base64 = (result as any).zip as string;
          const buf = Buffer.from(base64, 'base64');
          reply.header('Content-Type', 'application/zip');
          reply.header(
            'Content-Disposition',
            'attachment; filename="drishti-export.zip"'
          );
          return reply.send(buf);
        }

        return reply.send({ success: true, ...result });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to export data',
        });
      }
    }
  );

  // Delete data (immediate or scheduled)
  fastify.post(
    '/privacy/delete',
    { preHandler: requireAuth as any },
    async (request: AuthedRequest, reply) => {
      const userId = request.user!.userId;
      const { scheduleDays } = (request.body as any) || {};

      try {
        const result = await privacyService.deleteUserData(userId, {
          scheduleDays,
        });
        return reply.send({ success: true, ...result });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to delete user data',
        });
      }
    }
  );

  // Privacy policy (public)
  fastify.get('/privacy/policy', async (_request, reply) => {
    try {
      const policy = await privacyService.getPrivacyPolicy();
      return reply.send({ success: true, policy });
    } catch (error) {
      return reply
        .code(500)
        .send({ success: false, error: 'Failed to load privacy policy' });
    }
  });

  // Consent preferences
  fastify.get(
    '/privacy/consent',
    { preHandler: requireAuth as any },
    async (request: AuthedRequest, reply) => {
      try {
        const userId = request.user!.userId;
        const consent = await privacyService.getUserConsent(userId);
        return reply.send({ success: true, consent });
      } catch (error) {
        return reply
          .code(500)
          .send({ success: false, error: 'Failed to get consent' });
      }
    }
  );

  fastify.put(
    '/privacy/consent',
    { preHandler: requireAuth as any },
    async (request: AuthedRequest, reply) => {
      try {
        const userId = request.user!.userId;
        const { consent } = (request.body as any) || {};
        await privacyService.updateUserConsent(userId, consent || {});
        const policy = await privacyService.getPrivacyPolicy();
        await privacyService.recordConsentAudit(
          userId,
          consent || {},
          policy.version,
          {
            ip: (request.headers['x-forwarded-for'] as string) || request.ip,
            ua: request.headers['user-agent'] as string,
          }
        );
        return reply.send({ success: true });
      } catch (error) {
        return reply
          .code(500)
          .send({ success: false, error: 'Failed to update consent' });
      }
    }
  );

  fastify.get(
    '/privacy/consent/history',
    { preHandler: requireAuth as any },
    async (request: AuthedRequest, reply) => {
      try {
        const userId = request.user!.userId;
        const history = await privacyService.getConsentHistory(userId, 50);
        return reply.send({ success: true, history });
      } catch (error) {
        return reply
          .code(500)
          .send({ success: false, error: 'Failed to get consent history' });
      }
    }
  );
}

export default privacyRoutes;
