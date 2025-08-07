/**
 * Enhanced Scenario Service for Mobile App
 * Epic 9, Story 1: Scenario Creation & Management
 * Provides comprehensive scenario management with offline support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import database, { Q } from '../../database';
import Scenario from '../../database/models/Scenario';
import {
  EnhancedScenario,
  CreateScenarioDto,
  UpdateScenarioDto,
  ScenarioTemplate,
  ScenarioTemplateType,
  ScenarioValidationResult,
  ScenarioComparison,
  ScenarioAssumptions,
} from '@drishti/shared/types/financial';
import { ApiService } from '../api/ApiService';
import { ErrorHandlingService } from '../ErrorHandlingService';
import {
  validateScenarioName,
  validateFinancialAssumptions,
  validateScenarioTags,
  checkScenarioRateLimit,
  sanitizeScenarioInput,
} from '../../utils/validation';

export interface ScenarioServiceConfig {
  enableOfflineMode: boolean;
  autoSyncEnabled: boolean;
  cacheTimeout: number; // milliseconds
  maxCachedScenarios: number;
}

export interface ScenarioSearchFilters {
  query?: string;
  tags?: string[];
  templateType?: ScenarioTemplateType;
  folder?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface ScenarioStats {
  totalScenarios: number;
  activeScenarios: number;
  defaultScenario?: EnhancedScenario;
  mostUsedTemplate: ScenarioTemplateType;
  averageFeasibilityScore: number;
  lastSyncTime?: Date;
}

/**
 * Enhanced Scenario Service with comprehensive scenario management
 */
export class ScenarioService {
  private static instance: ScenarioService;
  private config: ScenarioServiceConfig;
  private cache: Map<string, EnhancedScenario> = new Map();
  private templates: ScenarioTemplate[] = [];
  private apiService: ApiService;
  private errorHandler: ErrorHandlingService;

  private constructor() {
    this.config = {
      enableOfflineMode: true,
      autoSyncEnabled: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxCachedScenarios: 100,
    };
    this.apiService = ApiService.getInstance();
    this.errorHandler = ErrorHandlingService.getInstance();
    // Initialize templates asynchronously without blocking constructor
    this.initializeTemplates().catch(error => {
      console.error('Failed to initialize templates:', error);
      // Set default templates as fallback
      this.templates = this.getDefaultTemplates();
    });
  }

  public static getInstance(): ScenarioService {
    if (!ScenarioService.instance) {
      ScenarioService.instance = new ScenarioService();
    }
    return ScenarioService.instance;
  }

  /**
   * Initialize scenario templates
   */
  private async initializeTemplates(): Promise<void> {
    try {
      // Check if AsyncStorage is available (might not be on web)
      if (typeof AsyncStorage !== 'undefined' && AsyncStorage.getItem) {
        // Load templates from cache first
        const cachedTemplates =
          await AsyncStorage.getItem('scenario_templates');
        if (cachedTemplates) {
          this.templates = JSON.parse(cachedTemplates);
        }
      }

      // Load default templates if cache is empty
      if (this.templates.length === 0) {
        this.templates = this.getDefaultTemplates();
        await this.cacheTemplates();
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.initializeTemplates',
        severity: 'medium',
      });
      // Fallback to default templates
      this.templates = this.getDefaultTemplates();
    }
  }

  /**
   * Get default scenario templates
   */
  private getDefaultTemplates(): ScenarioTemplate[] {
    return [
      {
        id: 'optimistic',
        name: 'Optimistic Scenario',
        description: 'Best-case scenario with favorable market conditions',
        type: 'optimistic',
        category: 'financial',
        assumptions: {
          inflation_rate: 0.025,
          market_return: 0.1,
          savings_rate: 0.25,
          retirement_age: 60,
          life_expectancy: 90,
          emergency_fund_months: 6,
          healthcare_inflation: 0.05,
          tax_rate: 0.22,
        },
        tags: ['optimistic', 'high-growth', 'early-retirement'],
        color: '#4CAF50',
        emoji: '📈',
        popularity_score: 85,
        created_by: 'system',
      },
      {
        id: 'pessimistic',
        name: 'Pessimistic Scenario',
        description: 'Conservative scenario with challenging market conditions',
        type: 'pessimistic',
        category: 'financial',
        assumptions: {
          inflation_rate: 0.04,
          market_return: 0.05,
          savings_rate: 0.15,
          retirement_age: 67,
          life_expectancy: 85,
          emergency_fund_months: 12,
          healthcare_inflation: 0.07,
          tax_rate: 0.28,
        },
        tags: ['pessimistic', 'conservative', 'safe'],
        color: '#F44336',
        emoji: '📉',
        popularity_score: 70,
        created_by: 'system',
      },
      {
        id: 'conservative',
        name: 'Conservative Scenario',
        description: 'Balanced scenario with moderate assumptions',
        type: 'conservative',
        category: 'financial',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.07,
          savings_rate: 0.2,
          retirement_age: 65,
          life_expectancy: 87,
          emergency_fund_months: 8,
          healthcare_inflation: 0.06,
          tax_rate: 0.25,
        },
        tags: ['conservative', 'balanced', 'moderate'],
        color: '#FF9800',
        emoji: '⚖️',
        popularity_score: 95,
        created_by: 'system',
      },
      {
        id: 'job_loss',
        name: 'Job Loss Recovery',
        description: 'Scenario planning for unexpected job loss',
        type: 'job_loss',
        category: 'life_event',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.06,
          savings_rate: 0.05, // Reduced during unemployment
          retirement_age: 67,
          life_expectancy: 87,
          emergency_fund_months: 12,
          healthcare_inflation: 0.08,
          tax_rate: 0.2,
        },
        tags: ['job-loss', 'emergency', 'recovery'],
        color: '#9C27B0',
        emoji: '💼',
        popularity_score: 60,
        created_by: 'system',
      },
      {
        id: 'inheritance',
        name: 'Inheritance Windfall',
        description: 'Scenario with unexpected inheritance or windfall',
        type: 'inheritance',
        category: 'life_event',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.08,
          savings_rate: 0.3, // Higher due to windfall
          retirement_age: 62,
          life_expectancy: 88,
          emergency_fund_months: 6,
          healthcare_inflation: 0.06,
          tax_rate: 0.25,
        },
        tags: ['inheritance', 'windfall', 'accelerated'],
        color: '#2196F3',
        emoji: '💰',
        popularity_score: 45,
        created_by: 'system',
      },
      // Economic Environment Scenarios
      {
        id: 'recession',
        name: 'Economic Recession',
        description: 'Extended economic downturn with market volatility',
        type: 'recession',
        category: 'economic_environment',
        assumptions: {
          inflation_rate: 0.015,
          market_return: 0.04,
          savings_rate: 0.35,
          retirement_age: 67,
          life_expectancy: 85,
          emergency_fund_months: 12,
          healthcare_inflation: 0.06,
          tax_rate: 0.25,
        },
        tags: ['recession', 'conservative', 'defensive'],
        color: '#F44336',
        emoji: '📉',
        popularity_score: 70,
        created_by: 'system',
      },
      {
        id: 'high_inflation',
        name: 'High Inflation Period',
        description: 'Sustained high inflation affecting purchasing power',
        type: 'high_inflation',
        category: 'economic_environment',
        assumptions: {
          inflation_rate: 0.07,
          market_return: 0.09,
          savings_rate: 0.4,
          retirement_age: 65,
          life_expectancy: 85,
          emergency_fund_months: 9,
          healthcare_inflation: 0.08,
          tax_rate: 0.28,
        },
        tags: ['inflation', 'high-savings', 'defensive'],
        color: '#FF5722',
        emoji: '📈',
        popularity_score: 65,
        created_by: 'system',
      },
      {
        id: 'market_boom',
        name: 'Market Boom',
        description: 'Extended bull market with strong returns',
        type: 'market_boom',
        category: 'economic_environment',
        assumptions: {
          inflation_rate: 0.02,
          market_return: 0.12,
          savings_rate: 0.25,
          retirement_age: 55,
          life_expectancy: 85,
          emergency_fund_months: 6,
          healthcare_inflation: 0.04,
          tax_rate: 0.2,
        },
        tags: ['bull-market', 'aggressive', 'early-retirement'],
        color: '#4CAF50',
        emoji: '🚀',
        popularity_score: 55,
        created_by: 'system',
      },
      {
        id: 'stagflation',
        name: 'Stagflation Era',
        description: 'High inflation with stagnant economic growth',
        type: 'stagflation',
        category: 'economic_environment',
        assumptions: {
          inflation_rate: 0.08,
          market_return: 0.05,
          savings_rate: 0.45,
          retirement_age: 70,
          life_expectancy: 85,
          emergency_fund_months: 15,
          healthcare_inflation: 0.09,
          tax_rate: 0.3,
        },
        tags: ['stagflation', 'high-inflation', 'low-growth'],
        color: '#795548',
        emoji: '🐌',
        popularity_score: 40,
        created_by: 'system',
      },
      {
        id: 'deflation',
        name: 'Deflationary Period',
        description: 'Rare deflationary environment with falling prices',
        type: 'deflation',
        category: 'economic_environment',
        assumptions: {
          inflation_rate: -0.01,
          market_return: 0.03,
          savings_rate: 0.3,
          retirement_age: 62,
          life_expectancy: 85,
          emergency_fund_months: 8,
          healthcare_inflation: 0.02,
          tax_rate: 0.18,
        },
        tags: ['deflation', 'low-growth', 'conservative'],
        color: '#607D8B',
        emoji: '❄️',
        popularity_score: 30,
        created_by: 'system',
      },
      // Personal Milestone Scenarios
      {
        id: 'home_purchase',
        name: 'Home Purchase',
        description: 'Planning for first home purchase with down payment',
        type: 'home_purchase',
        category: 'personal_milestone',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.07,
          savings_rate: 0.35, // Higher to save for down payment
          retirement_age: 65,
          life_expectancy: 85,
          emergency_fund_months: 8, // Higher due to homeownership costs
          healthcare_inflation: 0.05,
          tax_rate: 0.24, // Considering mortgage interest deduction
        },
        tags: ['home-purchase', 'real-estate', 'milestone'],
        color: '#8BC34A',
        emoji: '🏠',
        popularity_score: 85,
        created_by: 'system',
      },
      {
        id: 'first_child',
        name: 'First Child',
        description: 'Adjusting finances for first child and childcare costs',
        type: 'first_child',
        category: 'personal_milestone',
        assumptions: {
          inflation_rate: 0.035, // Higher due to childcare inflation
          market_return: 0.075,
          savings_rate: 0.2, // Reduced due to childcare costs
          retirement_age: 67, // Delayed due to reduced savings
          life_expectancy: 85,
          emergency_fund_months: 10, // Higher for family security
          healthcare_inflation: 0.06, // Higher family healthcare costs
          tax_rate: 0.2, // Child tax credits
        },
        tags: ['children', 'family', 'childcare'],
        color: '#FFEB3B',
        emoji: '👶',
        popularity_score: 80,
        created_by: 'system',
      },
      {
        id: 'college_planning',
        name: 'College Education Planning',
        description: "Saving for children's college education expenses",
        type: 'college_planning',
        category: 'personal_milestone',
        assumptions: {
          inflation_rate: 0.04, // Higher due to education inflation
          market_return: 0.08,
          savings_rate: 0.3, // Higher to fund education
          retirement_age: 67,
          life_expectancy: 85,
          emergency_fund_months: 8,
          healthcare_inflation: 0.05,
          tax_rate: 0.22, // Education tax benefits
        },
        tags: ['education', 'college', 'children'],
        color: '#3F51B5',
        emoji: '🎓',
        popularity_score: 75,
        created_by: 'system',
      },
      {
        id: 'career_change',
        name: 'Career Change',
        description: 'Transitioning to new career with potential income gap',
        type: 'career_change',
        category: 'personal_milestone',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.07,
          savings_rate: 0.15, // Lower during transition
          retirement_age: 68, // Delayed due to career restart
          life_expectancy: 85,
          emergency_fund_months: 12, // Higher for income uncertainty
          healthcare_inflation: 0.05,
          tax_rate: 0.22,
        },
        tags: ['career-change', 'transition', 'income-gap'],
        color: '#FF9800',
        emoji: '🔄',
        popularity_score: 60,
        created_by: 'system',
      },
      {
        id: 'elderly_care',
        name: 'Elderly Parent Care',
        description: 'Planning for elderly parent care expenses',
        type: 'elderly_care',
        category: 'personal_milestone',
        assumptions: {
          inflation_rate: 0.035,
          market_return: 0.07,
          savings_rate: 0.25, // Reduced due to care costs
          retirement_age: 67,
          life_expectancy: 85,
          emergency_fund_months: 12, // Higher for care emergencies
          healthcare_inflation: 0.07, // Higher healthcare costs
          tax_rate: 0.24, // Dependent care tax benefits
        },
        tags: ['elderly-care', 'family', 'healthcare'],
        color: '#9E9E9E',
        emoji: '👴',
        popularity_score: 50,
        created_by: 'system',
      },
      {
        id: 'divorce',
        name: 'Divorce Settlement',
        description: 'Financial planning after divorce settlement',
        type: 'divorce',
        category: 'personal_milestone',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.07,
          savings_rate: 0.3, // Higher to rebuild finances
          retirement_age: 68, // Delayed due to asset division
          life_expectancy: 85,
          emergency_fund_months: 12, // Higher for single income
          healthcare_inflation: 0.06, // Individual healthcare costs
          tax_rate: 0.25, // Single filing status
        },
        tags: ['divorce', 'single', 'rebuild'],
        color: '#E91E63',
        emoji: '💔',
        popularity_score: 40,
        created_by: 'system',
      },
    ];
  }

  /**
   * Cache templates to local storage
   */
  private async cacheTemplates(): Promise<void> {
    try {
      // Check if AsyncStorage is available (might not be on web)
      if (typeof AsyncStorage !== 'undefined' && AsyncStorage.setItem) {
        await AsyncStorage.setItem(
          'scenario_templates',
          JSON.stringify(this.templates)
        );
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.cacheTemplates',
        severity: 'low',
      });
    }
  }

  /**
   * Get all scenario templates
   */
  public async getTemplates(): Promise<ScenarioTemplate[]> {
    return this.templates;
  }

  /**
   * Get template by type
   */
  public async getTemplate(
    type: ScenarioTemplateType
  ): Promise<ScenarioTemplate | null> {
    return this.templates.find(template => template.type === type) || null;
  }

  /**
   * Create a new scenario
   */
  public async createScenario(
    scenarioData: CreateScenarioDto
  ): Promise<EnhancedScenario> {
    try {
      // Validate scenario data
      const validation = await this.validateScenario(scenarioData);
      if (!validation.isValid) {
        throw new Error(
          `Scenario validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Create scenario in local database
      if (!database) {
        throw new Error('Database not available');
      }
      const scenario = await database.write(async () => {
        const scenariosCollection = database.get<Scenario>('scenarios');
        return await scenariosCollection.create(scenario => {
          scenario.userId = 'current-user'; // TODO: Get from auth context
          scenario.name = scenarioData.name;
          scenario.description = scenarioData.description || '';
          scenario.assumptionsRaw = JSON.stringify(
            scenarioData.assumptions || {}
          );
          scenario.projectionsRaw = JSON.stringify({});
          scenario.isActive = true;
          scenario.isDefault = scenarioData.is_default || false;
        });
      });

      // Convert to enhanced scenario
      const enhancedScenario = this.convertToEnhanced(scenario);
      // Override with provided data
      enhancedScenario.template_type = scenarioData.template_type || 'custom';
      enhancedScenario.tags = scenarioData.tags || [];
      enhancedScenario.color = scenarioData.color || '#2196F3';
      enhancedScenario.emoji = scenarioData.emoji || '📊';
      enhancedScenario.folder = scenarioData.folder;
      enhancedScenario.version = 1;
      enhancedScenario.calculation_status = 'pending';

      // Cache the scenario
      this.cache.set(enhancedScenario.id, enhancedScenario);

      // Sync with API if online
      if (this.config.autoSyncEnabled) {
        this.syncScenarioToAPI(enhancedScenario).catch(error => {
          this.errorHandler.handleError(error, {
            context: 'ScenarioService.createScenario.sync',
            severity: 'low',
          });
        });
      }

      return enhancedScenario;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.createScenario',
        severity: 'high',
      });
      throw error;
    }
  }

  /**
   * Validate scenario data with enhanced security checks
   */
  public async validateScenario(
    scenarioData: Partial<CreateScenarioDto>
  ): Promise<ScenarioValidationResult> {
    const errors: ScenarioValidationResult['errors'] = [];
    const warnings: ScenarioValidationResult['warnings'] = [];

    // Check rate limiting first
    const userId = 'current-user'; // TODO: Get from auth context
    if (!checkScenarioRateLimit(userId, 'validate')) {
      errors.push({
        field: 'general',
        message: 'Too many validation requests. Please wait a moment.',
        severity: 'error',
      });
      return {
        isValid: false,
        errors,
        warnings,
        feasibilityScore: 0,
        riskLevel: 'extreme',
      };
    }

    // Validate scenario name with security checks
    if (scenarioData.name) {
      const nameValidation = validateScenarioName(scenarioData.name);
      nameValidation.errors.forEach(error => {
        errors.push({
          field: 'name',
          message: error,
          severity: 'error',
        });
      });
      nameValidation.warnings?.forEach(warning => {
        warnings.push({
          field: 'name',
          message: warning,
          suggestion: 'Consider using a different name',
        });
      });
    } else {
      errors.push({
        field: 'name',
        message: 'Scenario name is required',
        severity: 'error',
      });
    }

    // Validate description if provided
    if (scenarioData.description) {
      const sanitizedDescription = sanitizeScenarioInput(
        scenarioData.description
      );
      if (sanitizedDescription.length > 500) {
        errors.push({
          field: 'description',
          message: 'Description must be less than 500 characters',
          severity: 'error',
        });
      }
    }

    // Validate financial assumptions
    if (scenarioData.assumptions) {
      const assumptionsValidation = validateFinancialAssumptions(
        scenarioData.assumptions
      );
      assumptionsValidation.errors.forEach(error => {
        errors.push({
          field: 'assumptions',
          message: error,
          severity: 'error',
        });
      });
      assumptionsValidation.warnings?.forEach(warning => {
        warnings.push({
          field: 'assumptions',
          message: warning,
          suggestion: 'Consider adjusting this assumption',
        });
      });
    }

    // Validate tags if provided
    if (scenarioData.tags) {
      const tagsValidation = validateScenarioTags(scenarioData.tags);
      tagsValidation.errors.forEach(error => {
        errors.push({
          field: 'tags',
          message: error,
          severity: 'error',
        });
      });
    }

    // Calculate feasibility score
    let feasibilityScore = 100;
    feasibilityScore -= errors.length * 20;
    feasibilityScore -= warnings.length * 5;
    feasibilityScore = Math.max(0, feasibilityScore);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (errors.length > 0) riskLevel = 'extreme';
    else if (warnings.length > 2) riskLevel = 'high';
    else if (warnings.length > 0) riskLevel = 'medium';

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      feasibilityScore,
      riskLevel,
    };
  }

  /**
   * Get all scenarios with filtering and search
   */
  public async getScenarios(
    filters?: ScenarioSearchFilters
  ): Promise<EnhancedScenario[]> {
    try {
      if (!database) {
        return [];
      }
      const scenariosCollection = database.get<Scenario>('scenarios');
      let query = scenariosCollection.query(Q.where('is_active', true));

      // Apply filters
      if (filters?.query) {
        query = scenariosCollection.query(
          Q.where('is_active', true),
          Q.or(
            Q.where('name', Q.like(`%${filters.query}%`)),
            Q.where('description', Q.like(`%${filters.query}%`))
          )
        );
      }

      const scenarios = await query.fetch();

      // Convert to enhanced scenarios and apply additional filters
      let enhancedScenarios = scenarios.map(scenario =>
        this.convertToEnhanced(scenario)
      );

      if (filters?.tags && filters.tags.length > 0) {
        enhancedScenarios = enhancedScenarios.filter(scenario =>
          scenario.tags?.some(tag => filters.tags!.includes(tag))
        );
      }

      if (filters?.templateType) {
        enhancedScenarios = enhancedScenarios.filter(
          scenario => scenario.template_type === filters.templateType
        );
      }

      if (filters?.folder) {
        enhancedScenarios = enhancedScenarios.filter(
          scenario => scenario.folder === filters.folder
        );
      }

      // Apply sorting
      if (filters?.sortBy) {
        enhancedScenarios.sort((a, b) => {
          const aValue = a[filters.sortBy as keyof EnhancedScenario];
          const bValue = b[filters.sortBy as keyof EnhancedScenario];

          if (filters.sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
      }

      return enhancedScenarios;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.getScenarios',
        severity: 'medium',
      });
      return [];
    }
  }

  /**
   * Get scenario by ID
   */
  public async getScenarioById(id: string): Promise<EnhancedScenario | null> {
    try {
      // Check cache first
      if (this.cache.has(id)) {
        return this.cache.get(id)!;
      }

      if (!database) {
        return null;
      }
      const scenariosCollection = database.get<Scenario>('scenarios');
      const scenario = await scenariosCollection.find(id);

      if (!scenario) {
        return null;
      }

      const enhancedScenario = this.convertToEnhanced(scenario);
      this.cache.set(id, enhancedScenario);

      return enhancedScenario;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.getScenarioById',
        severity: 'medium',
      });
      return null;
    }
  }

  /**
   * Update scenario
   */
  public async updateScenario(
    id: string,
    updates: UpdateScenarioDto
  ): Promise<EnhancedScenario | null> {
    try {
      if (!database) {
        return null;
      }
      const scenariosCollection = database.get<Scenario>('scenarios');
      const scenario = await scenariosCollection.find(id);

      if (!scenario) {
        return null;
      }

      // Validate updates
      const validation = await this.validateScenario(updates);
      if (!validation.isValid) {
        throw new Error(
          `Scenario validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      const updatedScenario = await database.write(async () => {
        return await scenario.update(s => {
          if (updates.name !== undefined) s.name = updates.name;
          if (updates.description !== undefined)
            s.description = updates.description;
          if (updates.assumptions !== undefined) {
            const currentAssumptions = s.assumptions;
            s.assumptionsRaw = JSON.stringify({
              ...currentAssumptions,
              ...updates.assumptions,
            });
          }
          if (updates.projections !== undefined) {
            const currentProjections = s.projections;
            s.projectionsRaw = JSON.stringify({
              ...currentProjections,
              ...updates.projections,
            });
          }
          if (updates.is_active !== undefined) s.isActive = updates.is_active;
          if (updates.is_default !== undefined)
            s.isDefault = updates.is_default;
        });
      });

      const enhancedScenario = this.convertToEnhanced(updatedScenario);
      this.cache.set(id, enhancedScenario);

      // Sync with API if online
      if (this.config.autoSyncEnabled) {
        this.syncScenarioToAPI(enhancedScenario).catch(error => {
          this.errorHandler.handleError(error, {
            context: 'ScenarioService.updateScenario.sync',
            severity: 'low',
          });
        });
      }

      return enhancedScenario;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.updateScenario',
        severity: 'high',
      });
      throw error;
    }
  }

  /**
   * Delete scenario
   */
  public async deleteScenario(id: string): Promise<boolean> {
    try {
      if (!database) {
        return false;
      }
      const scenariosCollection = database.get<Scenario>('scenarios');
      const scenario = await scenariosCollection.find(id);

      if (!scenario) {
        return false;
      }

      await database.write(async () => {
        await scenario.update(s => {
          s.isActive = false;
        });
      });

      this.cache.delete(id);
      return true;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.deleteScenario',
        severity: 'medium',
      });
      return false;
    }
  }

  /**
   * Clone scenario
   */
  public async cloneScenario(
    id: string,
    newName: string
  ): Promise<EnhancedScenario | null> {
    try {
      const originalScenario = await this.getScenarioById(id);
      if (!originalScenario) {
        return null;
      }

      const cloneData: CreateScenarioDto = {
        name: newName,
        description: `Copy of ${originalScenario.description || originalScenario.name}`,
        assumptions: originalScenario.assumptions,
        template_type: originalScenario.template_type,
        tags: [...(originalScenario.tags || []), 'cloned'],
        color: originalScenario.color,
        emoji: originalScenario.emoji,
        folder: originalScenario.folder,
      };

      return await this.createScenario(cloneData);
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.cloneScenario',
        severity: 'medium',
      });
      return null;
    }
  }

  /**
   * Convert Scenario model to EnhancedScenario
   */
  private convertToEnhanced(scenario: any): EnhancedScenario {
    // Handle both WatermelonDB models and plain objects
    const baseData = scenario.toAPI
      ? scenario.toAPI()
      : {
          id: scenario.id,
          user_id: scenario.userId || scenario.user_id,
          name: scenario.name,
          description: scenario.description,
          assumptions:
            scenario.assumptions ||
            (scenario.assumptionsRaw
              ? JSON.parse(scenario.assumptionsRaw)
              : {}),
          projections:
            scenario.projections ||
            (scenario.projectionsRaw
              ? JSON.parse(scenario.projectionsRaw)
              : {}),
          is_active:
            scenario.isActive !== undefined
              ? scenario.isActive
              : scenario.is_active,
          is_default:
            scenario.isDefault !== undefined
              ? scenario.isDefault
              : scenario.is_default,
          created_at: scenario.createdAt || scenario.created_at,
          updated_at: scenario.updatedAt || scenario.updated_at,
          synced_at: scenario.syncedAt || scenario.synced_at,
        };

    return {
      ...baseData,
      template_type: 'custom', // Default, could be stored in metadata
      tags: [], // Default, could be stored in metadata
      color: '#2196F3', // Default
      emoji: '📊', // Default
      version: 1,
      calculation_status: 'pending',
    };
  }

  /**
   * Get scenario statistics
   */
  public async getScenarioStats(): Promise<ScenarioStats> {
    try {
      const scenarios = await this.getScenarios();
      const activeScenarios = scenarios.filter(s => s.is_active);
      const defaultScenario = scenarios.find(s => s.is_default);

      // Calculate template usage
      const templateCounts = scenarios.reduce(
        (acc, scenario) => {
          const type = scenario.template_type || 'custom';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const mostUsedTemplate =
        (Object.entries(templateCounts).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] as ScenarioTemplateType) || 'custom';

      // Calculate average feasibility score (mock for now)
      const averageFeasibilityScore = 75; // Would calculate from actual validations

      return {
        totalScenarios: scenarios.length,
        activeScenarios: activeScenarios.length,
        defaultScenario,
        mostUsedTemplate,
        averageFeasibilityScore,
        lastSyncTime: new Date(), // Would track actual sync time
      };
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.getScenarioStats',
        severity: 'low',
      });
      return {
        totalScenarios: 0,
        activeScenarios: 0,
        mostUsedTemplate: 'custom',
        averageFeasibilityScore: 0,
      };
    }
  }

  /**
   * Create scenario from template
   */
  public async createFromTemplate(
    templateType: ScenarioTemplateType,
    customizations?: Partial<CreateScenarioDto>
  ): Promise<EnhancedScenario | null> {
    try {
      const template = await this.getTemplate(templateType);
      if (!template) {
        throw new Error(`Template ${templateType} not found`);
      }

      const scenarioData: CreateScenarioDto = {
        name: customizations?.name || template.name,
        description: customizations?.description || template.description,
        assumptions: {
          ...template.assumptions,
          ...customizations?.assumptions,
        },
        template_type: templateType,
        tags: [...template.tags, ...(customizations?.tags || [])],
        color: customizations?.color || template.color,
        emoji: customizations?.emoji || template.emoji,
        folder: customizations?.folder,
        is_default: customizations?.is_default || false,
      };

      return await this.createScenario(scenarioData);
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.createFromTemplate',
        severity: 'medium',
      });
      return null;
    }
  }

  /**
   * Get folders with scenario counts
   */
  public async getFolders(): Promise<
    Array<{ name: string; count: number; scenarios: EnhancedScenario[] }>
  > {
    try {
      const scenarios = await this.getScenarios();
      const folderMap = new Map<string, EnhancedScenario[]>();

      scenarios.forEach(scenario => {
        const folder = scenario.folder || 'Uncategorized';
        if (!folderMap.has(folder)) {
          folderMap.set(folder, []);
        }
        folderMap.get(folder)!.push(scenario);
      });

      return Array.from(folderMap.entries()).map(([name, scenarios]) => ({
        name,
        count: scenarios.length,
        scenarios,
      }));
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.getFolders',
        severity: 'low',
      });
      return [];
    }
  }

  /**
   * Get all unique tags
   */
  public async getAllTags(): Promise<string[]> {
    try {
      const scenarios = await this.getScenarios();
      const tagSet = new Set<string>();

      scenarios.forEach(scenario => {
        scenario.tags?.forEach(tag => tagSet.add(tag));
      });

      return Array.from(tagSet).sort();
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.getAllTags',
        severity: 'low',
      });
      return [];
    }
  }

  /**
   * Sync scenario to API
   */
  private async syncScenarioToAPI(scenario: EnhancedScenario): Promise<void> {
    try {
      await this.apiService.post('/financial/scenarios', {
        name: scenario.name,
        description: scenario.description,
        assumptions: scenario.assumptions,
        is_default: scenario.is_default,
      });
    } catch (error) {
      // Handle sync error - will retry later
      throw error;
    }
  }

  /**
   * Get all unique tags from scenarios
   */
  public async getTags(): Promise<string[]> {
    try {
      const scenarios = await this.getScenarios();
      const tagSet = new Set<string>();

      scenarios.forEach(scenario => {
        if (scenario.tags) {
          scenario.tags.forEach(tag => tagSet.add(tag));
        }
      });

      return Array.from(tagSet).sort();
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        context: 'ScenarioService.getTags',
        severity: 'low',
      });
      return [];
    }
  }
}

export const scenarioService = ScenarioService.getInstance();
