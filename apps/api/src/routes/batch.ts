/**
 * Batch Operations API Routes
 * Handles bulk operations for efficient data processing
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { jwtService } from '../auth/jwt';
import { financialAccountService } from '../services/financial/FinancialAccountService';
import { financialGoalService } from '../services/financial/FinancialGoalService';
import { cacheService } from '../services/cache/CacheService';
import { websocketService } from '../services/websocket/WebSocketService';

interface BatchRequest {
  operations: BatchOperation[];
  options?: {
    continueOnError?: boolean;
    maxConcurrency?: number;
    timeout?: number;
  };
}

interface BatchOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'read';
  resource: 'account' | 'goal' | 'scenario';
  data?: any;
  resourceId?: string;
}

interface BatchResponse {
  success: boolean;
  results: BatchOperationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

interface BatchOperationResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

// Authentication middleware
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: 'Authorization header is required',
      });
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    if (!payload) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Add user info to request
    (request as any).user = payload;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: 'Authentication failed',
    });
  }
}

export async function batchRoutes(fastify: FastifyInstance) {
  // Batch operations endpoint
  fastify.post<{ Body: BatchRequest }>(
    '/operations',
    {
      config: {
        rateLimit: {
          max: 10, // 10 batch requests per minute
          timeWindow: '1 minute',
        },
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      const startTime = Date.now();
      const { operations, options = {} } = request.body;
      const user = (request as any).user;

      // Validate batch request
      if (
        !operations ||
        !Array.isArray(operations) ||
        operations.length === 0
      ) {
        return reply.code(400).send({
          success: false,
          error: 'Operations array is required and cannot be empty',
        });
      }

      if (operations.length > 100) {
        return reply.code(400).send({
          success: false,
          error: 'Maximum 100 operations allowed per batch',
        });
      }

      const {
        continueOnError = true,
        maxConcurrency = 10,
        timeout = 30000, // 30 seconds
      } = options;

      const results: BatchOperationResult[] = [];
      let successful = 0;
      let failed = 0;

      // Process operations with concurrency control
      const semaphore = new Array(maxConcurrency).fill(null);
      const operationPromises = operations.map(async (operation, index) => {
        // Wait for available slot
        await new Promise(resolve => {
          const checkSlot = () => {
            const slotIndex = semaphore.findIndex(slot => slot === null);
            if (slotIndex !== -1) {
              semaphore[slotIndex] = index;
              resolve(slotIndex);
            } else {
              setTimeout(checkSlot, 10);
            }
          };
          checkSlot();
        });

        try {
          const result = await processOperation(operation, user.userId);
          results[index] = result;
          if (result.success) successful++;
          else failed++;
        } catch (error) {
          const errorResult: BatchOperationResult = {
            id: operation.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          results[index] = errorResult;
          failed++;

          if (!continueOnError) {
            throw error;
          }
        } finally {
          // Release slot
          const slotIndex = semaphore.findIndex(slot => slot === index);
          if (slotIndex !== -1) {
            semaphore[slotIndex] = null;
          }
        }
      });

      try {
        // Wait for all operations with timeout
        await Promise.race([
          Promise.all(operationPromises),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Batch operation timeout')),
              timeout
            )
          ),
        ]);
      } catch (error) {
        return reply.code(408).send({
          success: false,
          error: 'Batch operation timeout or failed',
          results: results.filter(r => r !== undefined),
          summary: {
            total: operations.length,
            successful,
            failed,
            duration: Date.now() - startTime,
          },
        });
      }

      // Invalidate relevant caches
      await invalidateCaches(user.userId, operations);

      // Notify via WebSocket
      websocketService.broadcastToUser(user.userId, {
        type: 'account_update',
        data: {
          type: 'batch_complete',
          summary: { total: operations.length, successful, failed },
        },
      });

      const response: BatchResponse = {
        success: failed === 0,
        results,
        summary: {
          total: operations.length,
          successful,
          failed,
          duration: Date.now() - startTime,
        },
      };

      return reply.send(response);
    }
  );

  // Batch account balance updates
  fastify.post<{ Body: { updates: Array<{ id: string; balance: number }> } }>(
    '/accounts/balances',
    {
      config: {
        rateLimit: {
          max: 20, // 20 balance update batches per minute
          timeWindow: '1 minute',
        },
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      const { updates } = request.body;
      const user = (request as any).user;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Updates array is required and cannot be empty',
        });
      }

      if (updates.length > 50) {
        return reply.code(400).send({
          success: false,
          error: 'Maximum 50 balance updates allowed per batch',
        });
      }

      const results = [];
      let successful = 0;
      let failed = 0;

      for (const update of updates) {
        try {
          const account = await financialAccountService.updateAccount(
            user.id,
            update.id,
            {
              balance: update.balance,
            }
          );

          results.push({
            id: update.id,
            success: true,
            data: account,
          });
          successful++;
        } catch (error) {
          results.push({
            id: update.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failed++;
        }
      }

      // Invalidate caches
      await cacheService.invalidatePattern(`accounts:${user.userId}`);
      await cacheService.invalidatePattern(`networth:${user.userId}`);

      // Notify via WebSocket
      websocketService.broadcastToUser(user.userId, {
        type: 'account_update',
        data: {
          type: 'balance_updates',
          count: successful,
        },
      });

      return reply.send({
        success: failed === 0,
        results,
        summary: {
          total: updates.length,
          successful,
          failed,
        },
      });
    }
  );

  // Batch status endpoint
  fastify.get(
    '/status',
    { preHandler: authenticate },
    async (request, reply) => {
      return reply.send({
        success: true,
        limits: {
          maxOperationsPerBatch: 100,
          maxBalanceUpdatesPerBatch: 50,
          maxConcurrency: 10,
          timeoutMs: 30000,
        },
        rateLimit: {
          operations: '10 per minute',
          balanceUpdates: '20 per minute',
        },
      });
    }
  );
}

async function processOperation(
  operation: BatchOperation,
  userId: string
): Promise<BatchOperationResult> {
  try {
    let result: any;

    switch (operation.resource) {
      case 'account':
        result = await processAccountOperation(operation, userId);
        break;
      case 'goal':
        result = await processGoalOperation(operation, userId);
        break;
      default:
        throw new Error(`Unsupported resource type: ${operation.resource}`);
    }

    return {
      id: operation.id,
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      id: operation.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function processAccountOperation(
  operation: BatchOperation,
  userId: string
): Promise<any> {
  switch (operation.type) {
    case 'create':
      return await financialAccountService.createAccount(userId, {
        ...operation.data,
        userId,
      });
    case 'update':
      if (!operation.resourceId)
        throw new Error('Resource ID required for update');
      return await financialAccountService.updateAccount(
        userId,
        operation.resourceId,
        operation.data
      );
    case 'delete':
      if (!operation.resourceId)
        throw new Error('Resource ID required for delete');
      return await financialAccountService.deleteAccount(
        userId,
        operation.resourceId
      );
    case 'read':
      if (!operation.resourceId)
        throw new Error('Resource ID required for read');
      return await financialAccountService.getAccountById(
        userId,
        operation.resourceId
      );
    default:
      throw new Error(`Unsupported operation type: ${operation.type}`);
  }
}

async function processGoalOperation(
  operation: BatchOperation,
  userId: string
): Promise<any> {
  switch (operation.type) {
    case 'create':
      return await financialGoalService.createGoal(userId, {
        ...operation.data,
        userId,
      });
    case 'update':
      if (!operation.resourceId)
        throw new Error('Resource ID required for update');
      return await financialGoalService.updateGoal(
        userId,
        operation.resourceId,
        operation.data
      );
    case 'delete':
      if (!operation.resourceId)
        throw new Error('Resource ID required for delete');
      return await financialGoalService.deleteGoal(
        userId,
        operation.resourceId
      );
    case 'read':
      if (!operation.resourceId)
        throw new Error('Resource ID required for read');
      return await financialGoalService.getGoalById(
        userId,
        operation.resourceId
      );
    default:
      throw new Error(`Unsupported operation type: ${operation.type}`);
  }
}

async function invalidateCaches(userId: string, operations: BatchOperation[]) {
  const resourceTypes = new Set(operations.map(op => op.resource));

  if (resourceTypes.has('account')) {
    await cacheService.invalidatePattern(`accounts:${userId}`);
    await cacheService.invalidatePattern(`networth:${userId}`);
  }

  if (resourceTypes.has('goal')) {
    await cacheService.invalidatePattern(`goals:${userId}`);
  }
}
