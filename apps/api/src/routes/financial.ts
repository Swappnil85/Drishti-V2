import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { financialAccountService } from '../services/financial/FinancialAccountService';
import { financialGoalService } from '../services/financial/FinancialGoalService';
import { scenarioService } from '../services/financial/ScenarioService';
import { jwtService } from '../auth/jwt';
import { AppError, AuthErrors } from '../utils/errors';
import { financialValidationSchemas } from '@drishti/shared/validation/financial';

// Type definitions for request handlers
interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
  };
}

// Validation middleware
function validateBody(schema: any) {
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

function validateQuery(schema: any) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema.safeParse(request.query);
      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid query parameters',
          details: result.error.errors,
        });
      }
      request.query = result.data;
    } catch (error) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid query parameters',
      });
    }
  };
}

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

// Financial routes
export async function financialRoutes(fastify: FastifyInstance) {
  // Apply authentication to all financial routes
  fastify.addHook('preHandler', authenticate);

  // Financial Accounts Routes

  // Create financial account
  fastify.post(
    '/accounts',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      preHandler: validateBody(
        financialValidationSchemas.createFinancialAccount
      ),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const account = await financialAccountService.createAccount(
          request.user!.userId,
          request.body as any
        );

        return reply.code(201).send({
          success: true,
          data: account,
          message: 'Financial account created successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to create financial account',
        });
      }
    }
  );

  // Get user's financial accounts
  fastify.get(
    '/accounts',
    {
      preHandler: validateQuery(
        financialValidationSchemas.financialAccountQuery
      ),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const query = request.query as any;
        const accounts = await financialAccountService.getUserAccounts(
          request.user!.userId,
          query
        );

        return reply.send(accounts);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch financial accounts',
        });
      }
    }
  );

  // Get specific financial account
  fastify.get(
    '/accounts/:accountId',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { accountId } = request.params as { accountId: string };
        const account = await financialAccountService.getAccountById(
          request.user!.userId,
          accountId
        );

        if (!account) {
          return reply.code(404).send({
            success: false,
            error: 'Financial account not found',
          });
        }

        return reply.send({
          success: true,
          data: account,
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch financial account',
        });
      }
    }
  );

  // Update financial account
  fastify.put(
    '/accounts/:accountId',
    {
      preHandler: validateBody(
        financialValidationSchemas.updateFinancialAccount
      ),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { accountId } = request.params as { accountId: string };
        const account = await financialAccountService.updateAccount(
          request.user!.userId,
          accountId,
          request.body as any
        );

        if (!account) {
          return reply.code(404).send({
            success: false,
            error: 'Financial account not found',
          });
        }

        return reply.send({
          success: true,
          data: account,
          message: 'Financial account updated successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to update financial account',
        });
      }
    }
  );

  // Delete financial account
  fastify.delete(
    '/accounts/:accountId',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { accountId } = request.params as { accountId: string };
        const deleted = await financialAccountService.deleteAccount(
          request.user!.userId,
          accountId
        );

        if (!deleted) {
          return reply.code(404).send({
            success: false,
            error: 'Financial account not found',
          });
        }

        return reply.send({
          success: true,
          message: 'Financial account deleted successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete financial account',
        });
      }
    }
  );

  // Get account summary
  fastify.get(
    '/accounts/summary',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const summary = await financialAccountService.getAccountSummary(
          request.user!.userId
        );
        return reply.send({
          success: true,
          data: summary,
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch account summary',
        });
      }
    }
  );

  // Financial Goals Routes

  // Create financial goal
  fastify.post(
    '/goals',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      preHandler: validateBody(financialValidationSchemas.createFinancialGoal),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const goal = await financialGoalService.createGoal(
          request.user!.userId,
          request.body as any
        );

        return reply.code(201).send({
          success: true,
          data: goal,
          message: 'Financial goal created successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to create financial goal',
        });
      }
    }
  );

  // Get user's financial goals
  fastify.get(
    '/goals',
    {
      preHandler: validateQuery(financialValidationSchemas.financialGoalQuery),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const query = request.query as any;
        const goals = await financialGoalService.getUserGoals(
          request.user!.userId,
          query
        );

        return reply.send(goals);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch financial goals',
        });
      }
    }
  );

  // Get specific financial goal
  fastify.get(
    '/goals/:goalId',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { goalId } = request.params as { goalId: string };
        const goal = await financialGoalService.getGoalById(
          request.user!.userId,
          goalId
        );

        if (!goal) {
          return reply.code(404).send({
            success: false,
            error: 'Financial goal not found',
          });
        }

        return reply.send({
          success: true,
          data: goal,
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch financial goal',
        });
      }
    }
  );

  // Update financial goal
  fastify.put(
    '/goals/:goalId',
    {
      preHandler: validateBody(financialValidationSchemas.updateFinancialGoal),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { goalId } = request.params as { goalId: string };
        const goal = await financialGoalService.updateGoal(
          request.user!.userId,
          goalId,
          request.body as any
        );

        if (!goal) {
          return reply.code(404).send({
            success: false,
            error: 'Financial goal not found',
          });
        }

        return reply.send({
          success: true,
          data: goal,
          message: 'Financial goal updated successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to update financial goal',
        });
      }
    }
  );

  // Delete financial goal
  fastify.delete(
    '/goals/:goalId',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { goalId } = request.params as { goalId: string };
        const deleted = await financialGoalService.deleteGoal(
          request.user!.userId,
          goalId
        );

        if (!deleted) {
          return reply.code(404).send({
            success: false,
            error: 'Financial goal not found',
          });
        }

        return reply.send({
          success: true,
          message: 'Financial goal deleted successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete financial goal',
        });
      }
    }
  );

  // Get goal summary
  fastify.get(
    '/goals/summary',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const summary = await financialGoalService.getGoalSummary(
          request.user!.userId
        );
        return reply.send({
          success: true,
          data: summary,
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch goal summary',
        });
      }
    }
  );

  // Scenarios Routes

  // Create scenario
  fastify.post(
    '/scenarios',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
      preHandler: validateBody(financialValidationSchemas.createScenario),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const scenario = await scenarioService.createScenario(
          request.user!.userId,
          request.body as any
        );

        return reply.code(201).send({
          success: true,
          data: scenario,
          message: 'Scenario created successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to create scenario',
        });
      }
    }
  );

  // Get user's scenarios
  fastify.get(
    '/scenarios',
    {
      preHandler: validateQuery(financialValidationSchemas.scenarioQuery),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const query = request.query as any;
        const scenarios = await scenarioService.getUserScenarios(
          request.user!.userId,
          query
        );

        return reply.send(scenarios);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch scenarios',
        });
      }
    }
  );

  // Get default scenario
  fastify.get(
    '/scenarios/default',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const scenario = await scenarioService.getDefaultScenario(
          request.user!.userId
        );

        if (!scenario) {
          return reply.code(404).send({
            success: false,
            error: 'No default scenario found',
          });
        }

        return reply.send({
          success: true,
          data: scenario,
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch default scenario',
        });
      }
    }
  );

  // Get specific scenario
  fastify.get(
    '/scenarios/:scenarioId',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { scenarioId } = request.params as { scenarioId: string };
        const scenario = await scenarioService.getScenarioById(
          request.user!.userId,
          scenarioId
        );

        if (!scenario) {
          return reply.code(404).send({
            success: false,
            error: 'Scenario not found',
          });
        }

        return reply.send({
          success: true,
          data: scenario,
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch scenario',
        });
      }
    }
  );

  // Update scenario
  fastify.put(
    '/scenarios/:scenarioId',
    {
      preHandler: validateBody(financialValidationSchemas.updateScenario),
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { scenarioId } = request.params as { scenarioId: string };
        const scenario = await scenarioService.updateScenario(
          request.user!.userId,
          scenarioId,
          request.body as any
        );

        if (!scenario) {
          return reply.code(404).send({
            success: false,
            error: 'Scenario not found',
          });
        }

        return reply.send({
          success: true,
          data: scenario,
          message: 'Scenario updated successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to update scenario',
        });
      }
    }
  );

  // Delete scenario
  fastify.delete(
    '/scenarios/:scenarioId',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { scenarioId } = request.params as { scenarioId: string };
        const deleted = await scenarioService.deleteScenario(
          request.user!.userId,
          scenarioId
        );

        if (!deleted) {
          return reply.code(404).send({
            success: false,
            error: 'Scenario not found',
          });
        }

        return reply.send({
          success: true,
          message: 'Scenario deleted successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete scenario',
        });
      }
    }
  );

  // Calculate scenario projections
  fastify.post(
    '/scenarios/:scenarioId/calculate',
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { scenarioId } = request.params as { scenarioId: string };
        const scenario = await scenarioService.calculateProjections(
          request.user!.userId,
          scenarioId
        );

        if (!scenario) {
          return reply.code(404).send({
            success: false,
            error: 'Scenario not found',
          });
        }

        return reply.send({
          success: true,
          data: scenario,
          message: 'Scenario projections calculated successfully',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return reply.code(error.statusCode).send(error.toUserResponse());
        }
        return reply.code(500).send({
          success: false,
          error: 'Failed to calculate scenario projections',
        });
      }
    }
  );
}
