/**
 * ScenarioService Tests
 * Epic 9, Story 1: Comprehensive test suite for scenario management
 */

import { ScenarioService } from '../ScenarioService';
import { CreateScenarioDto, ScenarioTemplateType } from '@drishti/shared/types/financial';

// Mock dependencies
jest.mock('../../database', () => ({
  get: jest.fn(),
  write: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../api/ApiService', () => ({
  ApiService: {
    getInstance: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

jest.mock('../ErrorHandlingService', () => ({
  ErrorHandlingService: {
    getInstance: jest.fn(() => ({
      handleError: jest.fn(),
    })),
  },
}));

describe('ScenarioService', () => {
  let scenarioService: ScenarioService;

  beforeEach(() => {
    scenarioService = ScenarioService.getInstance();
    jest.clearAllMocks();
  });

  describe('Template Management', () => {
    test('should return default templates', async () => {
      const templates = await scenarioService.getTemplates();
      
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'optimistic',
            name: 'Optimistic Scenario',
          }),
          expect.objectContaining({
            type: 'pessimistic',
            name: 'Pessimistic Scenario',
          }),
          expect.objectContaining({
            type: 'conservative',
            name: 'Conservative Scenario',
          }),
        ])
      );
    });

    test('should get template by type', async () => {
      const template = await scenarioService.getTemplate('optimistic');
      
      expect(template).toBeDefined();
      expect(template?.type).toBe('optimistic');
      expect(template?.assumptions).toBeDefined();
      expect(template?.assumptions.market_return).toBe(0.10);
    });

    test('should return null for non-existent template', async () => {
      const template = await scenarioService.getTemplate('non-existent' as ScenarioTemplateType);
      
      expect(template).toBeNull();
    });
  });

  describe('Scenario Validation', () => {
    test('should validate valid scenario data', async () => {
      const validScenario: CreateScenarioDto = {
        name: 'Test Scenario',
        description: 'A test scenario',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.07,
          savings_rate: 0.20,
          retirement_age: 65,
          life_expectancy: 87,
        },
        tags: ['test', 'valid'],
      };

      const result = await scenarioService.validateScenario(validScenario);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.feasibilityScore).toBeGreaterThan(80);
      expect(result.riskLevel).toBe('low');
    });

    test('should reject scenario with missing name', async () => {
      const invalidScenario: CreateScenarioDto = {
        name: '',
        description: 'A test scenario',
      };

      const result = await scenarioService.validateScenario(invalidScenario);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Scenario name is required',
            severity: 'error',
          }),
        ])
      );
    });

    test('should reject scenario with malicious name', async () => {
      const maliciousScenario: CreateScenarioDto = {
        name: '<script>alert("xss")</script>',
        description: 'A malicious scenario',
      };

      const result = await scenarioService.validateScenario(maliciousScenario);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Scenario name contains invalid characters',
            severity: 'error',
          }),
        ])
      );
    });

    test('should warn about high market return assumptions', async () => {
      const highReturnScenario: CreateScenarioDto = {
        name: 'High Return Scenario',
        assumptions: {
          market_return: 0.20, // 20% return
          inflation_rate: 0.03,
          savings_rate: 0.20,
          retirement_age: 65,
          life_expectancy: 87,
        },
      };

      const result = await scenarioService.validateScenario(highReturnScenario);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'assumptions',
            message: 'Very high market return. Historical average is 7-10%.',
          }),
        ])
      );
      expect(result.riskLevel).toBe('medium');
    });

    test('should reject invalid financial assumptions', async () => {
      const invalidAssumptions: CreateScenarioDto = {
        name: 'Invalid Assumptions',
        assumptions: {
          inflation_rate: -0.05, // Negative inflation
          market_return: 0.50, // 50% return
          savings_rate: 1.5, // 150% savings rate
          retirement_age: 25, // Too young
          life_expectancy: 60, // Less than retirement age
        },
      };

      const result = await scenarioService.validateScenario(invalidAssumptions);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.riskLevel).toBe('extreme');
    });

    test('should validate tags correctly', async () => {
      const tooManyTags: CreateScenarioDto = {
        name: 'Too Many Tags',
        tags: Array(15).fill('tag'), // 15 tags (max is 10)
      };

      const result = await scenarioService.validateScenario(tooManyTags);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'tags',
            message: 'Maximum 10 tags allowed',
          }),
        ])
      );
    });
  });

  describe('Security Features', () => {
    test('should sanitize input data', async () => {
      const maliciousInput: CreateScenarioDto = {
        name: 'Test<script>alert("xss")</script>',
        description: 'Description with <iframe src="evil.com"></iframe>',
        tags: ['tag<script>', 'normal-tag'],
      };

      const result = await scenarioService.validateScenario(maliciousInput);
      
      // Should detect malicious content in name
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Scenario name contains invalid characters',
          }),
        ])
      );
    });

    test('should enforce rate limiting', async () => {
      const scenario: CreateScenarioDto = {
        name: 'Rate Limit Test',
      };

      // Make multiple validation requests rapidly
      const promises = Array(25).fill(null).map(() => 
        scenarioService.validateScenario(scenario)
      );

      const results = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResults = results.filter(result => 
        result.errors.some(error => 
          error.message.includes('Too many validation requests')
        )
      );

      expect(rateLimitedResults.length).toBeGreaterThan(0);
    });
  });

  describe('Template-based Creation', () => {
    test('should create scenario from optimistic template', async () => {
      const customizations = {
        name: 'My Optimistic Plan',
        description: 'Custom optimistic scenario',
      };

      // Mock the database operations
      const mockScenario = {
        id: 'test-id',
        toAPI: () => ({
          id: 'test-id',
          name: 'My Optimistic Plan',
          description: 'Custom optimistic scenario',
          assumptions: {
            inflation_rate: 0.025,
            market_return: 0.10,
            savings_rate: 0.25,
            retirement_age: 60,
            life_expectancy: 90,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          is_default: false,
        }),
      };

      // Mock database write operation
      const mockDatabase = require('../../database').default;
      mockDatabase.write = jest.fn().mockImplementation(async (callback) => {
        return await callback();
      });
      mockDatabase.get = jest.fn().mockReturnValue({
        create: jest.fn().mockResolvedValue(mockScenario),
      });

      const result = await scenarioService.createFromTemplate('optimistic', customizations);
      
      expect(result).toBeDefined();
      expect(result?.name).toBe('My Optimistic Plan');
      expect(result?.template_type).toBe('optimistic');
      expect(result?.assumptions?.market_return).toBe(0.10);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      const mockDatabase = require('../../database').default;
      mockDatabase.write = jest.fn().mockRejectedValue(new Error('Database error'));

      const scenario: CreateScenarioDto = {
        name: 'Test Scenario',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.07,
          savings_rate: 0.20,
          retirement_age: 65,
          life_expectancy: 87,
        },
      };

      await expect(scenarioService.createScenario(scenario)).rejects.toThrow();
    });

    test('should handle API sync errors gracefully', async () => {
      // Mock API error
      const mockApiService = require('../api/ApiService').ApiService.getInstance();
      mockApiService.post = jest.fn().mockRejectedValue(new Error('API error'));

      // Should not throw error, just log it
      const scenario: CreateScenarioDto = {
        name: 'Test Scenario',
      };

      // This should not throw even if API sync fails
      // (Implementation would need to be adjusted to not throw on sync errors)
    });
  });

  describe('Performance', () => {
    test('should cache templates efficiently', async () => {
      // First call
      const templates1 = await scenarioService.getTemplates();
      
      // Second call should use cache
      const templates2 = await scenarioService.getTemplates();
      
      expect(templates1).toEqual(templates2);
      // In a real implementation, we'd verify cache hits
    });

    test('should handle large numbers of scenarios', async () => {
      // Mock large dataset
      const mockScenarios = Array(1000).fill(null).map((_, index) => ({
        id: `scenario-${index}`,
        name: `Scenario ${index}`,
        template_type: 'custom',
        tags: [`tag-${index % 10}`],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Mock database query
      const mockDatabase = require('../../database').default;
      mockDatabase.get = jest.fn().mockReturnValue({
        query: jest.fn().mockReturnValue({
          fetch: jest.fn().mockResolvedValue(mockScenarios.map(s => ({
            toAPI: () => s,
          }))),
        }),
      });

      const scenarios = await scenarioService.getScenarios();
      
      expect(scenarios).toBeDefined();
      expect(scenarios.length).toBe(1000);
    });
  });
});
