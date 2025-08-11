/**
 * Account Template Service
 * Manages predefined account templates for quick setup
 */

import type { 
  AccountType, 
  Currency, 
  TaxTreatment 
} from '@drishti/shared/types/financial';

export interface AccountTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fire' | 'beginner' | 'advanced' | 'business' | 'family';
  icon: string;
  color: string;
  accounts: AccountTemplateItem[];
  estimatedSetupTime: number; // in minutes
  tags: string[];
}

export interface AccountTemplateItem {
  name: string;
  accountType: AccountType;
  suggestedInstitutionTypes: string[];
  defaultBalance?: number;
  currency: Currency;
  taxTreatment?: TaxTreatment;
  interestRate?: number;
  tags: string[];
  color?: string;
  description: string;
  priority: number; // 1 = highest priority
  isRequired: boolean;
}

class AccountTemplateService {
  private static instance: AccountTemplateService;
  private templates: AccountTemplate[] = [];

  private constructor() {
    this.initializeTemplates();
  }

  static getInstance(): AccountTemplateService {
    if (!AccountTemplateService.instance) {
      AccountTemplateService.instance = new AccountTemplateService();
    }
    return AccountTemplateService.instance;
  }

  private initializeTemplates(): void {
    this.templates = [
      // FIRE Templates
      {
        id: 'standard-fire-portfolio',
        name: 'Standard FIRE Portfolio',
        description: 'Complete setup for Financial Independence Retire Early strategy',
        category: 'fire',
        icon: 'flame-outline',
        color: '#FF9800',
        estimatedSetupTime: 15,
        tags: ['FIRE', 'Retirement', 'Investment'],
        accounts: [
          {
            name: 'Emergency Fund',
            accountType: 'savings',
            suggestedInstitutionTypes: ['bank', 'credit_union'],
            defaultBalance: 10000,
            currency: 'USD',
            interestRate: 0.04,
            tags: ['Emergency', 'Safety Net'],
            color: 'green',
            description: '3-6 months of expenses for emergencies',
            priority: 1,
            isRequired: true,
          },
          {
            name: 'Investment Account',
            accountType: 'investment',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 50000,
            currency: 'USD',
            taxTreatment: 'taxable',
            interestRate: 0.07,
            tags: ['Investment', 'Growth'],
            color: 'blue',
            description: 'Taxable investment account for FIRE savings',
            priority: 2,
            isRequired: true,
          },
          {
            name: '401(k) Retirement',
            accountType: 'retirement',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 75000,
            currency: 'USD',
            taxTreatment: 'traditional_401k',
            interestRate: 0.07,
            tags: ['Retirement', '401k'],
            color: 'purple',
            description: 'Employer-sponsored retirement account',
            priority: 3,
            isRequired: true,
          },
          {
            name: 'Roth IRA',
            accountType: 'retirement',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 25000,
            currency: 'USD',
            taxTreatment: 'roth_ira',
            interestRate: 0.07,
            tags: ['Retirement', 'Roth', 'Tax-Free'],
            color: 'indigo',
            description: 'After-tax retirement savings',
            priority: 4,
            isRequired: false,
          },
        ],
      },
      
      // Beginner Templates
      {
        id: 'beginner-essentials',
        name: 'Beginner Essentials',
        description: 'Basic accounts to start your financial journey',
        category: 'beginner',
        icon: 'school-outline',
        color: '#4CAF50',
        estimatedSetupTime: 8,
        tags: ['Beginner', 'Essentials'],
        accounts: [
          {
            name: 'Primary Checking',
            accountType: 'checking',
            suggestedInstitutionTypes: ['bank', 'credit_union'],
            defaultBalance: 2000,
            currency: 'USD',
            interestRate: 0.001,
            tags: ['Primary', 'Daily Use'],
            color: 'blue',
            description: 'Main account for daily expenses',
            priority: 1,
            isRequired: true,
          },
          {
            name: 'Emergency Savings',
            accountType: 'savings',
            suggestedInstitutionTypes: ['bank', 'credit_union'],
            defaultBalance: 5000,
            currency: 'USD',
            interestRate: 0.02,
            tags: ['Emergency', 'Savings'],
            color: 'green',
            description: 'Start building your emergency fund',
            priority: 2,
            isRequired: true,
          },
          {
            name: 'Goal Savings',
            accountType: 'savings',
            suggestedInstitutionTypes: ['bank', 'credit_union'],
            defaultBalance: 1000,
            currency: 'USD',
            interestRate: 0.02,
            tags: ['Goals', 'Savings'],
            color: 'orange',
            description: 'Save for specific goals like vacation or car',
            priority: 3,
            isRequired: false,
          },
        ],
      },

      // Advanced Templates
      {
        id: 'advanced-investor',
        name: 'Advanced Investor',
        description: 'Comprehensive setup for experienced investors',
        category: 'advanced',
        icon: 'trending-up-outline',
        color: '#9C27B0',
        estimatedSetupTime: 20,
        tags: ['Advanced', 'Investment', 'Tax Optimization'],
        accounts: [
          {
            name: 'Taxable Investment',
            accountType: 'investment',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 100000,
            currency: 'USD',
            taxTreatment: 'taxable',
            interestRate: 0.08,
            tags: ['Investment', 'Taxable'],
            color: 'blue',
            description: 'Main investment account for flexibility',
            priority: 1,
            isRequired: true,
          },
          {
            name: 'Traditional 401(k)',
            accountType: 'retirement',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 150000,
            currency: 'USD',
            taxTreatment: 'traditional_401k',
            interestRate: 0.07,
            tags: ['Retirement', '401k', 'Pre-tax'],
            color: 'purple',
            description: 'Maximize employer match',
            priority: 2,
            isRequired: true,
          },
          {
            name: 'Roth IRA',
            accountType: 'retirement',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 50000,
            currency: 'USD',
            taxTreatment: 'roth_ira',
            interestRate: 0.07,
            tags: ['Retirement', 'Roth', 'Tax-Free'],
            color: 'indigo',
            description: 'Tax-free growth and withdrawals',
            priority: 3,
            isRequired: true,
          },
          {
            name: 'HSA Investment',
            accountType: 'savings',
            suggestedInstitutionTypes: ['investment', 'bank'],
            defaultBalance: 15000,
            currency: 'USD',
            taxTreatment: 'hsa',
            interestRate: 0.06,
            tags: ['HSA', 'Health', 'Triple Tax Advantage'],
            color: 'teal',
            description: 'Triple tax-advantaged health account',
            priority: 4,
            isRequired: false,
          },
        ],
      },

      // Business Templates
      {
        id: 'small-business-starter',
        name: 'Small Business Starter',
        description: 'Essential accounts for small business owners',
        category: 'business',
        icon: 'business-outline',
        color: '#FF5722',
        estimatedSetupTime: 12,
        tags: ['Business', 'Entrepreneur'],
        accounts: [
          {
            name: 'Business Checking',
            accountType: 'checking',
            suggestedInstitutionTypes: ['bank', 'credit_union'],
            defaultBalance: 5000,
            currency: 'USD',
            interestRate: 0.001,
            tags: ['Business', 'Operating'],
            color: 'blue',
            description: 'Main business operating account',
            priority: 1,
            isRequired: true,
          },
          {
            name: 'Business Savings',
            accountType: 'savings',
            suggestedInstitutionTypes: ['bank', 'credit_union'],
            defaultBalance: 10000,
            currency: 'USD',
            interestRate: 0.02,
            tags: ['Business', 'Emergency'],
            color: 'green',
            description: 'Business emergency fund',
            priority: 2,
            isRequired: true,
          },
          {
            name: 'SEP-IRA',
            accountType: 'retirement',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 20000,
            currency: 'USD',
            taxTreatment: 'sep_ira',
            interestRate: 0.07,
            tags: ['Retirement', 'SEP-IRA', 'Self-Employed'],
            color: 'purple',
            description: 'Self-employed retirement savings',
            priority: 3,
            isRequired: false,
          },
        ],
      },

      // Family Templates
      {
        id: 'family-financial-plan',
        name: 'Family Financial Plan',
        description: 'Comprehensive setup for families with children',
        category: 'family',
        icon: 'people-outline',
        color: '#E91E63',
        estimatedSetupTime: 18,
        tags: ['Family', 'Children', 'Education'],
        accounts: [
          {
            name: 'Family Checking',
            accountType: 'checking',
            suggestedInstitutionTypes: ['bank', 'credit_union'],
            defaultBalance: 5000,
            currency: 'USD',
            interestRate: 0.001,
            tags: ['Family', 'Primary'],
            color: 'blue',
            description: 'Main family checking account',
            priority: 1,
            isRequired: true,
          },
          {
            name: 'Emergency Fund',
            accountType: 'savings',
            suggestedInstitutionTypes: ['bank', 'credit_union'],
            defaultBalance: 20000,
            currency: 'USD',
            interestRate: 0.03,
            tags: ['Emergency', 'Family Safety'],
            color: 'green',
            description: '6+ months of family expenses',
            priority: 2,
            isRequired: true,
          },
          {
            name: 'Education Savings (529)',
            accountType: 'investment',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 15000,
            currency: 'USD',
            taxTreatment: 'other_tax_advantaged',
            interestRate: 0.06,
            tags: ['Education', '529', 'Children'],
            color: 'orange',
            description: 'Tax-advantaged education savings',
            priority: 3,
            isRequired: false,
          },
          {
            name: 'Family Investment',
            accountType: 'investment',
            suggestedInstitutionTypes: ['investment'],
            defaultBalance: 30000,
            currency: 'USD',
            taxTreatment: 'taxable',
            interestRate: 0.07,
            tags: ['Investment', 'Family Goals'],
            color: 'purple',
            description: 'Long-term family wealth building',
            priority: 4,
            isRequired: false,
          },
        ],
      },
    ];
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): AccountTemplate[] {
    return [...this.templates];
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: AccountTemplate['category']): AccountTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): AccountTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  /**
   * Search templates by name or description
   */
  searchTemplates(query: string): AccountTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get recommended templates based on user profile
   */
  getRecommendedTemplates(userProfile?: {
    age?: number;
    hasChildren?: boolean;
    isBusinessOwner?: boolean;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  }): AccountTemplate[] {
    if (!userProfile) {
      return this.getTemplatesByCategory('beginner');
    }

    const recommendations: AccountTemplate[] = [];

    // Age-based recommendations
    if (userProfile.age && userProfile.age < 30) {
      recommendations.push(...this.getTemplatesByCategory('fire'));
    }

    // Experience-based recommendations
    if (userProfile.experienceLevel === 'beginner') {
      recommendations.push(...this.getTemplatesByCategory('beginner'));
    } else if (userProfile.experienceLevel === 'advanced') {
      recommendations.push(...this.getTemplatesByCategory('advanced'));
    }

    // Family-based recommendations
    if (userProfile.hasChildren) {
      recommendations.push(...this.getTemplatesByCategory('family'));
    }

    // Business-based recommendations
    if (userProfile.isBusinessOwner) {
      recommendations.push(...this.getTemplatesByCategory('business'));
    }

    // Remove duplicates and return
    const uniqueRecommendations = recommendations.filter(
      (template, index, self) => 
        index === self.findIndex(t => t.id === template.id)
    );

    return uniqueRecommendations.length > 0 
      ? uniqueRecommendations 
      : this.getTemplatesByCategory('beginner');
  }
}

export const accountTemplateService = AccountTemplateService.getInstance();
