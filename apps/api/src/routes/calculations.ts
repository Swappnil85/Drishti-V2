/**
 * Financial Calculations API Routes
 * Comprehensive financial calculation endpoints with validation and caching
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  financialCalculationEngine,
  CompoundInterestParams,
  AccountProjectionParams,
  MonteCarloParams,
  FIRECalculationParams,
  DebtPayoffParams,
  GoalProjectionParams,
  CalculationRequest,
  BatchCalculationRequest,
  CalculationResponse,
  BatchCalculationResponse,
  financialValidationSchemas,
} from '@drishti/shared';

// Request interfaces
interface CalculationRequestBody {
  type: string;
  params: any;
  priority?: 'low' | 'normal' | 'high' | 'realtime';
  cacheKey?: string;
  timeout?: number;
}

interface BatchCalculationRequestBody {
  calculations: CalculationRequestBody[];
  parallel?: boolean;
  maxConcurrency?: number;
  failFast?: boolean;
}

export default async function calculationsRoutes(fastify: FastifyInstance) {
  // Add authentication hook
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  /**
   * POST /calculations/compound-interest
   * Calculate compound interest with detailed breakdown
   */
  fastify.post<{
    Body: CompoundInterestParams;
  }>(
    '/compound-interest',
    {
      schema: {
        description: 'Calculate compound interest with detailed breakdown',
        tags: ['calculations'],
        body: financialValidationSchemas.compoundInterestParams,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  futureValue: { type: 'number' },
                  totalContributions: { type: 'number' },
                  totalInterestEarned: { type: 'number' },
                  effectiveAnnualRate: { type: 'number' },
                  breakdown: {
                    type: 'object',
                    properties: {
                      principalGrowth: { type: 'number' },
                      contributionGrowth: { type: 'number' },
                      compoundInterest: { type: 'number' },
                    },
                  },
                },
              },
              executionTime: { type: 'number' },
              cacheHit: { type: 'boolean' },
              metadata: {
                type: 'object',
                properties: {
                  calculationType: { type: 'string' },
                  timestamp: { type: 'string' },
                  version: { type: 'string' },
                  confidence: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CompoundInterestParams }>,
      reply: FastifyReply
    ) => {
      const startTime = performance.now();

      try {
        const result =
          financialCalculationEngine.calculateCompoundInterestDetailed(
            request.body
          );
        const executionTime = performance.now() - startTime;

        const response: CalculationResponse = {
          success: true,
          data: result,
          executionTime,
          cacheHit: executionTime < 1, // Assume cache hit if very fast
          metadata: {
            calculationType: 'compound_interest',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            confidence: 1.0,
          },
        };

        reply.code(200).send(response);
      } catch (error) {
        const executionTime = performance.now() - startTime;

        const response: CalculationResponse = {
          success: false,
          error: error.message,
          executionTime,
          cacheHit: false,
          metadata: {
            calculationType: 'compound_interest',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            confidence: 0,
          },
        };

        reply.code(400).send(response);
      }
    }
  );

  /**
   * POST /calculations/monte-carlo
   * Run Monte Carlo simulation for investment projections
   */
  fastify.post<{
    Body: MonteCarloParams;
  }>(
    '/monte-carlo',
    {
      schema: {
        description: 'Run Monte Carlo simulation for investment projections',
        tags: ['calculations'],
        body: financialValidationSchemas.monteCarloParams,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              executionTime: { type: 'number' },
              cacheHit: { type: 'boolean' },
              metadata: { type: 'object' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: MonteCarloParams }>,
      reply: FastifyReply
    ) => {
      const startTime = performance.now();

      try {
        // Set timeout for long-running calculations
        const timeout = request.body.iterations > 5000 ? 30000 : 15000;

        const result = await Promise.race([
          Promise.resolve(
            financialCalculationEngine.runMonteCarloSimulation(request.body)
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Calculation timeout')), timeout)
          ),
        ]);

        const executionTime = performance.now() - startTime;

        const response: CalculationResponse = {
          success: true,
          data: result,
          executionTime,
          cacheHit: executionTime < 100, // Assume cache hit if very fast
          metadata: {
            calculationType: 'monte_carlo',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            confidence: 0.95, // 95% confidence for Monte Carlo
          },
        };

        reply.code(200).send(response);
      } catch (error) {
        const executionTime = performance.now() - startTime;

        const response: CalculationResponse = {
          success: false,
          error: error.message,
          executionTime,
          cacheHit: false,
          metadata: {
            calculationType: 'monte_carlo',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            confidence: 0,
          },
        };

        reply
          .code(error.message === 'Calculation timeout' ? 408 : 400)
          .send(response);
      }
    }
  );

  /**
   * POST /calculations/debt-payoff
   * Calculate debt payoff strategies
   */
  fastify.post<{
    Body: DebtPayoffParams;
  }>(
    '/debt-payoff',
    {
      schema: {
        description:
          'Calculate debt payoff strategies (snowball, avalanche, custom)',
        tags: ['calculations'],
        body: financialValidationSchemas.debtPayoffParams,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              executionTime: { type: 'number' },
              cacheHit: { type: 'boolean' },
              metadata: { type: 'object' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: DebtPayoffParams }>,
      reply: FastifyReply
    ) => {
      const startTime = performance.now();

      try {
        const result = financialCalculationEngine.calculateDebtPayoff(
          request.body
        );
        const executionTime = performance.now() - startTime;

        const response: CalculationResponse = {
          success: true,
          data: result,
          executionTime,
          cacheHit: executionTime < 10,
          metadata: {
            calculationType: 'debt_payoff',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            confidence: 1.0,
          },
        };

        reply.code(200).send(response);
      } catch (error) {
        const executionTime = performance.now() - startTime;

        const response: CalculationResponse = {
          success: false,
          error: error.message,
          executionTime,
          cacheHit: false,
          metadata: {
            calculationType: 'debt_payoff',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            confidence: 0,
          },
        };

        reply.code(400).send(response);
      }
    }
  );

  /**
   * POST /calculations/batch
   * Execute multiple calculations in batch
   */
  fastify.post<{
    Body: BatchCalculationRequestBody;
  }>(
    '/batch',
    {
      schema: {
        description:
          'Execute multiple calculations in batch with parallel processing',
        tags: ['calculations'],
        body: financialValidationSchemas.batchCalculationRequest,
        response: {
          200: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: { type: 'object' },
              },
              totalExecutionTime: { type: 'number' },
              successCount: { type: 'number' },
              errorCount: { type: 'number' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    index: { type: 'number' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: BatchCalculationRequestBody }>,
      reply: FastifyReply
    ) => {
      const startTime = performance.now();
      const {
        calculations,
        parallel = true,
        maxConcurrency = 3,
        failFast = false,
      } = request.body;

      try {
        const results: CalculationResponse[] = [];
        const errors: Array<{ index: number; error: string }> = [];

        if (parallel) {
          // Process calculations in parallel with concurrency limit
          const chunks = [];
          for (let i = 0; i < calculations.length; i += maxConcurrency) {
            chunks.push(calculations.slice(i, i + maxConcurrency));
          }

          for (const chunk of chunks) {
            const chunkPromises = chunk.map(async (calc, index) => {
              try {
                const calcStartTime = performance.now();
                let result: any;

                switch (calc.type) {
                  case 'compound_interest':
                    result =
                      financialCalculationEngine.calculateCompoundInterestDetailed(
                        calc.params
                      );
                    break;
                  case 'monte_carlo':
                    result = financialCalculationEngine.runMonteCarloSimulation(
                      calc.params
                    );
                    break;
                  case 'debt_payoff':
                    result = financialCalculationEngine.calculateDebtPayoff(
                      calc.params
                    );
                    break;
                  default:
                    throw new Error(
                      `Unsupported calculation type: ${calc.type}`
                    );
                }

                const calcExecutionTime = performance.now() - calcStartTime;

                return {
                  success: true,
                  data: result,
                  executionTime: calcExecutionTime,
                  cacheHit: calcExecutionTime < 5,
                  metadata: {
                    calculationType: calc.type,
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    confidence: calc.type === 'monte_carlo' ? 0.95 : 1.0,
                  },
                };
              } catch (error) {
                const errorResult = {
                  success: false,
                  error: error.message,
                  executionTime: performance.now() - startTime,
                  cacheHit: false,
                  metadata: {
                    calculationType: calc.type,
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    confidence: 0,
                  },
                };

                if (failFast) {
                  throw error;
                }

                return errorResult;
              }
            });

            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
          }
        } else {
          // Process calculations sequentially
          for (let i = 0; i < calculations.length; i++) {
            const calc = calculations[i];
            try {
              const calcStartTime = performance.now();
              let result: any;

              switch (calc.type) {
                case 'compound_interest':
                  result =
                    financialCalculationEngine.calculateCompoundInterestDetailed(
                      calc.params
                    );
                  break;
                case 'monte_carlo':
                  result = financialCalculationEngine.runMonteCarloSimulation(
                    calc.params
                  );
                  break;
                case 'debt_payoff':
                  result = financialCalculationEngine.calculateDebtPayoff(
                    calc.params
                  );
                  break;
                default:
                  throw new Error(`Unsupported calculation type: ${calc.type}`);
              }

              const calcExecutionTime = performance.now() - calcStartTime;

              results.push({
                success: true,
                data: result,
                executionTime: calcExecutionTime,
                cacheHit: calcExecutionTime < 5,
                metadata: {
                  calculationType: calc.type,
                  timestamp: new Date().toISOString(),
                  version: '1.0.0',
                  confidence: calc.type === 'monte_carlo' ? 0.95 : 1.0,
                },
              });
            } catch (error) {
              const errorResult = {
                success: false,
                error: error.message,
                executionTime: performance.now() - startTime,
                cacheHit: false,
                metadata: {
                  calculationType: calc.type,
                  timestamp: new Date().toISOString(),
                  version: '1.0.0',
                  confidence: 0,
                },
              };

              results.push(errorResult);
              errors.push({ index: i, error: error.message });

              if (failFast) {
                break;
              }
            }
          }
        }

        const totalExecutionTime = performance.now() - startTime;
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        const response: BatchCalculationResponse = {
          results,
          totalExecutionTime,
          successCount,
          errorCount,
          errors,
        };

        reply.code(200).send(response);
      } catch (error) {
        const totalExecutionTime = performance.now() - startTime;

        reply.code(500).send({
          results: [],
          totalExecutionTime,
          successCount: 0,
          errorCount: calculations.length,
          errors: [{ index: -1, error: error.message }],
        });
      }
    }
  );

  /**
   * GET /calculations/performance
   * Get calculation performance metrics
   */
  fastify.get(
    '/performance',
    {
      schema: {
        description: 'Get calculation performance metrics and statistics',
        tags: ['calculations', 'monitoring'],
        response: {
          200: {
            type: 'object',
            properties: {
              metrics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    functionName: { type: 'string' },
                    executionTime: { type: 'number' },
                    cacheHit: { type: 'boolean' },
                    inputSize: { type: 'number' },
                    complexity: { type: 'string' },
                    memoryUsage: { type: 'number' },
                    timestamp: { type: 'number' },
                  },
                },
              },
              cacheStats: {
                type: 'object',
                properties: {
                  size: { type: 'number' },
                  hitRate: { type: 'number' },
                  averageComputationTime: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const metrics = financialCalculationEngine.getPerformanceMetrics();
        const cacheStats = financialCalculationEngine.getCacheStats();

        reply.code(200).send({
          metrics,
          cacheStats,
        });
      } catch (error) {
        reply.code(500).send({
          error: 'Failed to retrieve performance metrics',
          message: error.message,
        });
      }
    }
  );

  /**
   * DELETE /calculations/cache
   * Clear calculation cache
   */
  fastify.delete<{
    Body: { dependencies?: string[] };
  }>(
    '/cache',
    {
      schema: {
        description:
          'Clear calculation cache for specific dependencies or all cache',
        tags: ['calculations', 'cache'],
        body: {
          type: 'object',
          properties: {
            dependencies: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of dependency IDs to clear cache for. If not provided, clears all cache.',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              clearedEntries: { type: 'number' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { dependencies?: string[] } }>,
      reply: FastifyReply
    ) => {
      try {
        const { dependencies } = request.body || {};
        const initialCacheSize =
          financialCalculationEngine.getCacheStats().size;

        financialCalculationEngine.clearCache(dependencies);

        const finalCacheSize = financialCalculationEngine.getCacheStats().size;
        const clearedEntries = initialCacheSize - finalCacheSize;

        reply.code(200).send({
          success: true,
          message: dependencies
            ? `Cleared cache for ${dependencies.length} dependencies`
            : 'Cleared all cache entries',
          clearedEntries,
        });
      } catch (error) {
        reply.code(500).send({
          success: false,
          message: 'Failed to clear cache',
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /calculations/health
   * Health check for calculation engine
   */
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check for calculation engine',
        tags: ['calculations', 'health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              cacheSize: { type: 'number' },
              averageResponseTime: { type: 'number' },
              totalCalculations: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const cacheStats = financialCalculationEngine.getCacheStats();
        const metrics = financialCalculationEngine.getPerformanceMetrics();

        const averageResponseTime =
          metrics.length > 0
            ? metrics.reduce((sum, m) => sum + m.executionTime, 0) /
              metrics.length
            : 0;

        reply.code(200).send({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cacheSize: cacheStats.size,
          averageResponseTime,
          totalCalculations: metrics.length,
        });
      } catch (error) {
        reply.code(503).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    }
  );
}
