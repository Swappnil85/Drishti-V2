import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Fastify from 'fastify';
import { financialRoutes } from '../routes/financial';

// Minimal Fastify instance for route tests (no DB init here; we will mock service methods)
const buildServer = async () => {
  const app = Fastify({ logger: false });
  await app.register(async function (f) {
    // Inject a fake auth preHandler by overriding addHook used in the routes file
    // Instead, we will call handlers directly with a fake request in unit scope.
  });
  await app.register(financialRoutes, { prefix: '/' });
  return app;
};

// Mock the jwtService and auth hook indirectly by stubbing request headers parsing
jest.mock('../auth/jwt', () => ({
  jwtService: {
    verifyAccessToken: () => ({ userId: 'user-1', email: 'u@example.com' }),
  },
}));

// Mock FinancialAccountService methods
jest.mock('../services/financial/FinancialAccountService', () => {
  const actual = jest.requireActual('../services/financial/FinancialAccountService');
  return {
    ...actual,
    financialAccountService: {
      getAccountSummary: jest.fn(async (userId: string) => ({
        total_assets: 120000,
        total_liabilities: 20000,
        net_worth: 100000,
        accounts_by_type: { savings: { count: 2, balance: 50000 } },
      })),
      getNetWorthTrends: jest.fn(async (userId: string, months: number) => (
        Array.from({ length: months }).map((_, i) => ({ month: 'Jan', value: 100000 + i * 1000 }))
      )),
    },
  };
});

import { financialAccountService } from '../services/financial/FinancialAccountService';

describe('Net worth routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /networth/summary returns summary', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/networth/summary',
      headers: { Authorization: 'Bearer test' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('net_worth', 100000);
  });

  it('GET /networth/trends returns series', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/networth/trends?months=6',
      headers: { Authorization: 'Bearer test' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(6);
  });
});

