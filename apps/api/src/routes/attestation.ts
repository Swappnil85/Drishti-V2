import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { deviceAttestationService } from '../services/security/DeviceAttestationService';
import { jwtService } from '../auth/jwt';

interface AuthedRequest extends FastifyRequest {
  user?: { userId: string };
}

async function requireAuth(request: AuthedRequest, reply: FastifyReply) {
  const authHeader = request.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return reply.code(401).send({ success: false, error: 'Missing token' });
  }
  try {
    const payload = await jwtService.verifyToken(token);
    request.user = { userId: payload.sub };
  } catch {
    return reply.code(401).send({ success: false, error: 'Invalid or expired token' });
  }
}

export async function attestationRoutes(fastify: FastifyInstance) {
  fastify.post('/security/attestation/android', { preHandler: requireAuth as any }, async (request: AuthedRequest, reply: FastifyReply) => {
    const { token } = (request.body as any) || {};
    const res = await deviceAttestationService.verifyAndroid(token, {
      ip: (request.headers['x-forwarded-for'] as string) || request.ip,
      ua: request.headers['user-agent'] as string,
    });
    return reply.send({ success: true, ...res });
  });

  fastify.post('/security/attestation/ios', { preHandler: requireAuth as any }, async (request: AuthedRequest, reply: FastifyReply) => {
    const { token } = (request.body as any) || {};
    const res = await deviceAttestationService.verifyIOS(token, {
      ip: (request.headers['x-forwarded-for'] as string) || request.ip,
      ua: request.headers['user-agent'] as string,
    });
    return reply.send({ success: true, ...res });
  });
}

export default attestationRoutes;

