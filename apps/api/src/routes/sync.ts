import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { syncService } from '../services/sync/SyncService';
import { jwtService } from '../auth/jwt';
import { AppError, AuthErrors } from '../utils/errors';
import { query } from '../db/connection';
import { z } from 'zod';

// Type definitions for request handlers
interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
  };
}

// Validation schemas
const syncOperationSchema = z.object({
  id: z.string().uuid(),
  table: z.string(),
  operation: z.enum(['create', 'update', 'delete']),
  data: z.record(z.any()),
  client_timestamp: z.number(),
});

const syncRequestSchema = z.object({
  last_sync_timestamp: z.number().optional(),
  operations: z.array(syncOperationSchema),
  device_id: z.string().min(1),
});

const conflictResolutionSchema = z.object({
  conflict_id: z.string(),
  resolution: z.enum(['client', 'server', 'merge']),
  merged_data: z.record(z.any()).optional(),
});

// Authentication middleware
async function authenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AuthErrors.tokenInvalid();
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    request.user = {
      userId: payload.userId,
      email: payload.email,
    };
  } catch (error) {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(error.toUserResponse());
    }
    return reply.code(401).send({
      success: false,
      error: 'Invalid authentication token',
    });
  }
}

// Validation middleware
function validateBody(schema: z.ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: result.error.errors,
        });
      }
      request.body = result.data;
    } catch (error) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid request data',
      });
    }
  };
}

// Sync routes
export async function syncRoutes(fastify: FastifyInstance) {
  // Apply authentication to all sync routes
  fastify.addHook('preHandler', authenticate);

  // Main sync endpoint
  fastify.post(
    '/sync',
    {
      config: {
        rateLimit: {
          max: 30, // Allow more frequent sync requests
          timeWindow: '1 minute',
        },
      },
      preHandler: validateBody(syncRequestSchema),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const syncRequest = request.body as any;

        // Log sync request for debugging
        console.log(`Sync request from user ${request.user!.userId}:`, {
          device_id: syncRequest.device_id,
          operations_count: syncRequest.operations.length,
          last_sync: syncRequest.last_sync_timestamp,
        });

        const syncResponse = await syncService.processSync(
          request.user!.userId,
          syncRequest
        );

        // Log sync response summary
        console.log(`Sync response for user ${request.user!.userId}:`, {
          conflicts: syncResponse.conflicts.length,
          server_changes: syncResponse.server_changes.length,
          applied_operations: syncResponse.applied_operations.length,
          failed_operations: syncResponse.failed_operations.length,
        });

        return reply.send({
          success: true,
          data: syncResponse,
          message: 'Sync completed successfully',
        });
      } catch (error) {
        console.error('Sync error:', error);

        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }

        return reply.code(500).send({
          success: false,
          error: 'Sync failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Get sync status
  fastify.get('/sync/status', async (request: AuthenticatedRequest, reply) => {
    try {
      const { device_id } = request.query as { device_id?: string };

      if (!device_id) {
        return reply.code(400).send({
          success: false,
          error: 'device_id is required',
        });
      }

      // Get sync status from database
      const result = await query(
        `
        SELECT
          last_sync,
          sync_in_progress,
          last_error,
          updated_at
        FROM sync_status
        WHERE user_id = $1 AND device_id = $2
      `,
        [request.user!.userId, device_id]
      );

      const syncStatus = result.rows[0] || {
        last_sync: null,
        sync_in_progress: false,
        last_error: null,
        updated_at: null,
      };

      return reply.send({
        success: true,
        data: {
          last_sync_timestamp: syncStatus.last_sync
            ? new Date(syncStatus.last_sync).getTime()
            : null,
          sync_in_progress: syncStatus.sync_in_progress,
          last_error: syncStatus.last_error,
          last_updated: syncStatus.updated_at
            ? new Date(syncStatus.updated_at).toISOString()
            : null,
        },
      });
    } catch (error) {
      console.error('Get sync status error:', error);

      return reply.code(500).send({
        success: false,
        error: 'Failed to get sync status',
      });
    }
  });

  // Resolve conflict
  fastify.post(
    '/sync/resolve-conflict',
    {
      preHandler: validateBody(conflictResolutionSchema),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { conflict_id, resolution, merged_data } = request.body as any;

        await syncService.resolveConflict(
          request.user!.userId,
          conflict_id,
          resolution,
          merged_data
        );

        return reply.send({
          success: true,
          message: 'Conflict resolved successfully',
        });
      } catch (error) {
        console.error('Conflict resolution error:', error);

        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }

        return reply.code(500).send({
          success: false,
          error: 'Failed to resolve conflict',
        });
      }
    }
  );

  // Force full sync (for debugging or recovery)
  fastify.post('/sync/full', async (request: AuthenticatedRequest, reply) => {
    try {
      const { device_id } = request.body as { device_id: string };

      if (!device_id) {
        return reply.code(400).send({
          success: false,
          error: 'device_id is required',
        });
      }

      // Reset sync timestamp to force full sync
      await query(
        `
        UPDATE sync_status
        SET last_sync = NULL, updated_at = NOW()
        WHERE user_id = $1 AND device_id = $2
      `,
        [request.user!.userId, device_id]
      );

      return reply.send({
        success: true,
        message: 'Full sync initiated. Next sync will download all data.',
      });
    } catch (error) {
      console.error('Full sync initiation error:', error);

      return reply.code(500).send({
        success: false,
        error: 'Failed to initiate full sync',
      });
    }
  });

  // Get sync statistics (for monitoring)
  fastify.get('/sync/stats', async (request: AuthenticatedRequest, reply) => {
    try {
      // Get sync statistics for the user
      const result = await query(
        `
        SELECT
          COUNT(DISTINCT device_id) as device_count,
          MAX(last_sync) as last_sync,
          COUNT(CASE WHEN sync_in_progress THEN 1 END) as syncing_devices,
          COUNT(CASE WHEN last_error IS NOT NULL THEN 1 END) as devices_with_errors
        FROM sync_status
        WHERE user_id = $1
      `,
        [request.user!.userId]
      );

      const stats = result.rows[0] || {
        device_count: 0,
        last_sync: null,
        syncing_devices: 0,
        devices_with_errors: 0,
      };

      // Get data counts
      const dataCounts = await query(
        `
        SELECT
          (SELECT COUNT(*) FROM financial_accounts WHERE user_id = $1 AND is_active = true) as accounts,
          (SELECT COUNT(*) FROM financial_goals WHERE user_id = $1 AND is_active = true) as goals,
          (SELECT COUNT(*) FROM scenarios WHERE user_id = $1 AND is_active = true) as scenarios
      `,
        [request.user!.userId]
      );

      return reply.send({
        success: true,
        data: {
          sync_stats: {
            device_count: parseInt(stats.device_count, 10),
            last_sync_timestamp: stats.last_sync
              ? new Date(stats.last_sync).getTime()
              : null,
            syncing_devices: parseInt(stats.syncing_devices, 10),
            devices_with_errors: parseInt(stats.devices_with_errors, 10),
          },
          data_counts: {
            financial_accounts: parseInt(dataCounts.rows[0].accounts, 10),
            financial_goals: parseInt(dataCounts.rows[0].goals, 10),
            scenarios: parseInt(dataCounts.rows[0].scenarios, 10),
          },
        },
      });
    } catch (error) {
      console.error('Get sync stats error:', error);

      return reply.code(500).send({
        success: false,
        error: 'Failed to get sync statistics',
      });
    }
  });

  // Health check for sync service
  fastify.get('/sync/health', async (_request: AuthenticatedRequest, reply) => {
    try {
      // Simple health check - verify database connectivity
      await query('SELECT 1');

      return reply.send({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'sync',
        },
      });
    } catch (error) {
      return reply.code(503).send({
        success: false,
        error: 'Sync service unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
