/**
 * GraphQL API Routes
 * Provides efficient data fetching for mobile clients
 */

import { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import { buildSchema } from 'graphql';
import { jwtService } from '../auth/jwt';
import { financialAccountService } from '../services/financial/FinancialAccountService';
import { financialGoalService } from '../services/financial/FinancialGoalService';
import { scenarioService } from '../services/financial/ScenarioService';
import { cacheService } from '../services/cache/CacheService';

// GraphQL Schema Definition
const schema = buildSchema(`
  type User {
    id: ID!
    email: String!
    name: String!
    createdAt: String!
    updatedAt: String!
  }

  type FinancialAccount {
    id: ID!
    userId: ID!
    name: String!
    type: String!
    balance: Float!
    interestRate: Float
    taxTreatment: String
    institution: String
    accountNumber: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type FinancialGoal {
    id: ID!
    userId: ID!
    name: String!
    type: String!
    targetAmount: Float!
    targetDate: String!
    currentAmount: Float!
    monthlyContribution: Float!
    priority: Int!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    progress: Float!
  }

  type Scenario {
    id: ID!
    userId: ID!
    name: String!
    description: String
    assumptions: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type NetWorthSummary {
    totalAssets: Float!
    totalLiabilities: Float!
    netWorth: Float!
    accountBreakdown: [AccountBreakdown!]!
  }

  type AccountBreakdown {
    type: String!
    balance: Float!
    count: Int!
  }

  type GoalProgress {
    goalId: ID!
    progress: Float!
    projectedCompletion: String
    onTrack: Boolean!
    requiredMonthlyContribution: Float!
  }

  input CreateAccountInput {
    name: String!
    type: String!
    balance: Float!
    interestRate: Float
    taxTreatment: String
    institution: String
    accountNumber: String
  }

  input UpdateAccountInput {
    name: String
    balance: Float
    interestRate: Float
    taxTreatment: String
    institution: String
    isActive: Boolean
  }

  input CreateGoalInput {
    name: String!
    type: String!
    targetAmount: Float!
    targetDate: String!
    monthlyContribution: Float!
    priority: Int
  }

  input UpdateGoalInput {
    name: String
    targetAmount: Float
    targetDate: String
    monthlyContribution: Float
    priority: Int
    isActive: Boolean
  }

  type Query {
    me: User
    accounts: [FinancialAccount!]!
    account(id: ID!): FinancialAccount
    goals: [FinancialGoal!]!
    goal(id: ID!): FinancialGoal
    scenarios: [Scenario!]!
    scenario(id: ID!): Scenario
    netWorthSummary: NetWorthSummary!
    goalProgress(goalId: ID!): GoalProgress
    allGoalProgress: [GoalProgress!]!
  }

  type Mutation {
    createAccount(input: CreateAccountInput!): FinancialAccount!
    updateAccount(id: ID!, input: UpdateAccountInput!): FinancialAccount!
    deleteAccount(id: ID!): Boolean!
    createGoal(input: CreateGoalInput!): FinancialGoal!
    updateGoal(id: ID!, input: UpdateGoalInput!): FinancialGoal!
    deleteGoal(id: ID!): Boolean!
  }
`);

// GraphQL Resolvers
const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: any) => {
      return context.user;
    },

    accounts: async (_parent: any, _args: any, context: any) => {
      const cacheKey = `accounts:${context.user.id}`;
      let accounts = await cacheService.get(cacheKey);

      if (!accounts) {
        accounts = await financialAccountService.getAccountsByUserId(
          context.user.id
        );
        await cacheService.set(cacheKey, accounts, { ttl: 300 }); // 5 minutes
      }

      return accounts;
    },

    account: async (_parent: any, args: { id: string }, context: any) => {
      const cacheKey = `account:${args.id}`;
      let account = await cacheService.get(cacheKey);

      if (!account) {
        account = await financialAccountService.getAccountById(
          context.user.id,
          args.id
        );
        if (account && account.userId === context.user.id) {
          await cacheService.set(cacheKey, account, { ttl: 300 });
        } else {
          return null;
        }
      }

      return account;
    },

    goals: async (_parent: any, _args: any, context: any) => {
      const cacheKey = `goals:${context.user.id}`;
      let goals = await cacheService.get(cacheKey);

      if (!goals) {
        goals = await financialGoalService.getGoalsByUserId(context.user.id);
        await cacheService.set(cacheKey, goals, { ttl: 300 });
      }

      return goals;
    },

    goal: async (_parent: any, args: { id: string }, context: any) => {
      const cacheKey = `goal:${args.id}`;
      let goal = await cacheService.get(cacheKey);

      if (!goal) {
        goal = await financialGoalService.getGoalById(context.user.id, args.id);
        if (goal && goal.userId === context.user.id) {
          await cacheService.set(cacheKey, goal, { ttl: 300 });
        } else {
          return null;
        }
      }

      return goal;
    },

    scenarios: async (_parent: any, _args: any, context: any) => {
      const cacheKey = `scenarios:${context.user.id}`;
      let scenarios = await cacheService.get(cacheKey);

      if (!scenarios) {
        scenarios = await scenarioService.getScenariosByUserId(context.user.id);
        await cacheService.set(cacheKey, scenarios, { ttl: 600 }); // 10 minutes
      }

      return scenarios;
    },

    netWorthSummary: async (_parent: any, _args: any, context: any) => {
      const cacheKey = `networth:${context.user.id}`;
      let summary = await cacheService.get(cacheKey);

      if (!summary) {
        const accounts = await financialAccountService.getAccountsByUserId(
          context.user.id
        );

        let totalAssets = 0;
        let totalLiabilities = 0;
        const breakdown: { [key: string]: { balance: number; count: number } } =
          {};

        accounts.forEach(account => {
          if (account.balance >= 0) {
            totalAssets += account.balance;
          } else {
            totalLiabilities += Math.abs(account.balance);
          }

          if (!breakdown[account.account_type]) {
            breakdown[account.account_type] = { balance: 0, count: 0 };
          }
          breakdown[account.account_type].balance += account.balance;
          breakdown[account.account_type].count += 1;
        });

        summary = {
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities,
          accountBreakdown: Object.entries(breakdown).map(([type, data]) => ({
            type,
            balance: data.balance,
            count: data.count,
          })),
        };

        await cacheService.set(cacheKey, summary, { ttl: 300 });
      }

      return summary;
    },
  },

  Mutation: {
    createAccount: async (_parent: any, args: { input: any }, context: any) => {
      const account = await financialAccountService.createAccount(
        context.user.id,
        {
          ...args.input,
          userId: context.user.id,
        }
      );

      // Invalidate cache
      await cacheService.invalidatePattern(`accounts:${context.user.id}`);
      await cacheService.invalidatePattern(`networth:${context.user.id}`);

      return account;
    },

    updateAccount: async (
      _parent: any,
      args: { id: string; input: any },
      context: any
    ) => {
      const account = await financialAccountService.updateAccount(
        context.user.id,
        args.id,
        args.input
      );

      // Invalidate cache
      await cacheService.delete(`account:${args.id}`);
      await cacheService.invalidatePattern(`accounts:${context.user.id}`);
      await cacheService.invalidatePattern(`networth:${context.user.id}`);

      return account;
    },

    deleteAccount: async (_parent: any, args: { id: string }, context: any) => {
      const success = await financialAccountService.deleteAccount(
        context.user.id,
        args.id
      );

      // Invalidate cache
      await cacheService.delete(`account:${args.id}`);
      await cacheService.invalidatePattern(`accounts:${context.user.id}`);
      await cacheService.invalidatePattern(`networth:${context.user.id}`);

      return success;
    },

    createGoal: async (_parent: any, args: { input: any }, context: any) => {
      const goal = await financialGoalService.createGoal(context.user.id, {
        ...args.input,
        userId: context.user.id,
      });

      // Invalidate cache
      await cacheService.invalidatePattern(`goals:${context.user.id}`);

      return goal;
    },

    updateGoal: async (
      _parent: any,
      args: { id: string; input: any },
      context: any
    ) => {
      const goal = await financialGoalService.updateGoal(
        context.user.id,
        args.id,
        args.input
      );

      // Invalidate cache
      await cacheService.delete(`goal:${args.id}`);
      await cacheService.invalidatePattern(`goals:${context.user.id}`);

      return goal;
    },

    deleteGoal: async (_parent: any, args: { id: string }, context: any) => {
      const success = await financialGoalService.deleteGoal(
        context.user.id,
        args.id
      );

      // Invalidate cache
      await cacheService.delete(`goal:${args.id}`);
      await cacheService.invalidatePattern(`goals:${context.user.id}`);

      return success;
    },
  },
};

export async function graphqlRoutes(fastify: FastifyInstance) {
  await fastify.register(mercurius, {
    schema,
    resolvers,
    context: async (request: any) => {
      // Extract user from JWT token
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authentication required');
      }

      const token = authHeader.substring(7);
      const payload = jwtService.verifyAccessToken(token);

      if (!payload) {
        throw new Error('Invalid token');
      }

      return {
        user: { id: payload.userId, email: payload.email },
      };
    },
    graphiql: process.env.NODE_ENV === 'development',
  });
}
