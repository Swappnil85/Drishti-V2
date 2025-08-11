/**
 * AccountTemplateService Tests
 * Unit tests for account template functionality
 */

import { accountTemplateService } from '../AccountTemplateService';

describe('AccountTemplateService', () => {
  describe('getAllTemplates', () => {
    it('should return all available templates', () => {
      const templates = accountTemplateService.getAllTemplates();
      
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            category: expect.any(String),
            accounts: expect.any(Array),
          }),
        ])
      );
    });

    it('should return templates with required properties', () => {
      const templates = accountTemplateService.getAllTemplates();
      
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('icon');
        expect(template).toHaveProperty('color');
        expect(template).toHaveProperty('accounts');
        expect(template).toHaveProperty('estimatedSetupTime');
        expect(template).toHaveProperty('tags');
        
        expect(template.accounts.length).toBeGreaterThan(0);
        expect(template.estimatedSetupTime).toBeGreaterThan(0);
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates for valid categories', () => {
      const fireTemplates = accountTemplateService.getTemplatesByCategory('fire');
      const beginnerTemplates = accountTemplateService.getTemplatesByCategory('beginner');
      const businessTemplates = accountTemplateService.getTemplatesByCategory('business');
      
      expect(fireTemplates.length).toBeGreaterThan(0);
      expect(beginnerTemplates.length).toBeGreaterThan(0);
      expect(businessTemplates.length).toBeGreaterThan(0);
      
      fireTemplates.forEach(template => {
        expect(template.category).toBe('fire');
      });
      
      beginnerTemplates.forEach(template => {
        expect(template.category).toBe('beginner');
      });
      
      businessTemplates.forEach(template => {
        expect(template.category).toBe('business');
      });
    });

    it('should return empty array for non-existent category', () => {
      const templates = accountTemplateService.getTemplatesByCategory('non-existent' as any);
      expect(templates).toEqual([]);
    });
  });

  describe('getTemplateById', () => {
    it('should return template for valid ID', () => {
      const allTemplates = accountTemplateService.getAllTemplates();
      const firstTemplate = allTemplates[0];
      
      const foundTemplate = accountTemplateService.getTemplateById(firstTemplate.id);
      
      expect(foundTemplate).toEqual(firstTemplate);
    });

    it('should return null for invalid ID', () => {
      const template = accountTemplateService.getTemplateById('non-existent-id');
      expect(template).toBeNull();
    });
  });

  describe('searchTemplates', () => {
    it('should find templates by name', () => {
      const results = accountTemplateService.searchTemplates('FIRE');
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(template => {
        expect(
          template.name.toLowerCase().includes('fire') ||
          template.description.toLowerCase().includes('fire') ||
          template.tags.some(tag => tag.toLowerCase().includes('fire'))
        ).toBe(true);
      });
    });

    it('should find templates by description', () => {
      const results = accountTemplateService.searchTemplates('beginner');
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(template => {
        expect(
          template.name.toLowerCase().includes('beginner') ||
          template.description.toLowerCase().includes('beginner') ||
          template.tags.some(tag => tag.toLowerCase().includes('beginner'))
        ).toBe(true);
      });
    });

    it('should find templates by tags', () => {
      const results = accountTemplateService.searchTemplates('retirement');
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(template => {
        expect(
          template.name.toLowerCase().includes('retirement') ||
          template.description.toLowerCase().includes('retirement') ||
          template.tags.some(tag => tag.toLowerCase().includes('retirement'))
        ).toBe(true);
      });
    });

    it('should return empty array for non-matching search', () => {
      const results = accountTemplateService.searchTemplates('xyz123nonexistent');
      expect(results).toEqual([]);
    });

    it('should be case insensitive', () => {
      const lowerResults = accountTemplateService.searchTemplates('fire');
      const upperResults = accountTemplateService.searchTemplates('FIRE');
      const mixedResults = accountTemplateService.searchTemplates('Fire');
      
      expect(lowerResults).toEqual(upperResults);
      expect(upperResults).toEqual(mixedResults);
    });
  });

  describe('getRecommendedTemplates', () => {
    it('should return beginner templates for no profile', () => {
      const recommendations = accountTemplateService.getRecommendedTemplates();
      
      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(template => {
        expect(template.category).toBe('beginner');
      });
    });

    it('should recommend FIRE templates for young users', () => {
      const recommendations = accountTemplateService.getRecommendedTemplates({
        age: 25,
        experienceLevel: 'intermediate',
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(template => template.category === 'fire')).toBe(true);
    });

    it('should recommend family templates for users with children', () => {
      const recommendations = accountTemplateService.getRecommendedTemplates({
        hasChildren: true,
        experienceLevel: 'intermediate',
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(template => template.category === 'family')).toBe(true);
    });

    it('should recommend business templates for business owners', () => {
      const recommendations = accountTemplateService.getRecommendedTemplates({
        isBusinessOwner: true,
        experienceLevel: 'advanced',
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(template => template.category === 'business')).toBe(true);
    });

    it('should recommend advanced templates for advanced users', () => {
      const recommendations = accountTemplateService.getRecommendedTemplates({
        experienceLevel: 'advanced',
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(template => template.category === 'advanced')).toBe(true);
    });

    it('should recommend beginner templates for beginner users', () => {
      const recommendations = accountTemplateService.getRecommendedTemplates({
        experienceLevel: 'beginner',
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(template => template.category === 'beginner')).toBe(true);
    });

    it('should not return duplicate templates', () => {
      const recommendations = accountTemplateService.getRecommendedTemplates({
        age: 25,
        hasChildren: true,
        isBusinessOwner: true,
        experienceLevel: 'advanced',
      });
      
      const templateIds = recommendations.map(template => template.id);
      const uniqueIds = [...new Set(templateIds)];
      
      expect(templateIds.length).toBe(uniqueIds.length);
    });

    it('should fallback to beginner templates if no matches', () => {
      const recommendations = accountTemplateService.getRecommendedTemplates({
        experienceLevel: 'intermediate', // This alone shouldn't match specific categories
      });
      
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('template structure validation', () => {
    it('should have valid account structures in all templates', () => {
      const templates = accountTemplateService.getAllTemplates();
      
      templates.forEach(template => {
        template.accounts.forEach(account => {
          expect(account).toHaveProperty('name');
          expect(account).toHaveProperty('accountType');
          expect(account).toHaveProperty('suggestedInstitutionTypes');
          expect(account).toHaveProperty('currency');
          expect(account).toHaveProperty('tags');
          expect(account).toHaveProperty('description');
          expect(account).toHaveProperty('priority');
          expect(account).toHaveProperty('isRequired');
          
          expect(typeof account.name).toBe('string');
          expect(typeof account.accountType).toBe('string');
          expect(Array.isArray(account.suggestedInstitutionTypes)).toBe(true);
          expect(typeof account.currency).toBe('string');
          expect(Array.isArray(account.tags)).toBe(true);
          expect(typeof account.description).toBe('string');
          expect(typeof account.priority).toBe('number');
          expect(typeof account.isRequired).toBe('boolean');
          
          expect(account.priority).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid categories', () => {
      const templates = accountTemplateService.getAllTemplates();
      const validCategories = ['fire', 'beginner', 'advanced', 'business', 'family'];
      
      templates.forEach(template => {
        expect(validCategories).toContain(template.category);
      });
    });

    it('should have reasonable setup times', () => {
      const templates = accountTemplateService.getAllTemplates();
      
      templates.forEach(template => {
        expect(template.estimatedSetupTime).toBeGreaterThan(0);
        expect(template.estimatedSetupTime).toBeLessThan(60); // Should be less than 1 hour
      });
    });

    it('should have at least one required account per template', () => {
      const templates = accountTemplateService.getAllTemplates();
      
      templates.forEach(template => {
        const requiredAccounts = template.accounts.filter(account => account.isRequired);
        expect(requiredAccounts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('specific template validation', () => {
    it('should have Standard FIRE Portfolio template', () => {
      const fireTemplate = accountTemplateService.getTemplateById('standard-fire-portfolio');
      
      expect(fireTemplate).toBeDefined();
      expect(fireTemplate?.name).toBe('Standard FIRE Portfolio');
      expect(fireTemplate?.category).toBe('fire');
      expect(fireTemplate?.accounts.length).toBeGreaterThan(2);
    });

    it('should have Beginner Essentials template', () => {
      const beginnerTemplate = accountTemplateService.getTemplateById('beginner-essentials');
      
      expect(beginnerTemplate).toBeDefined();
      expect(beginnerTemplate?.name).toBe('Beginner Essentials');
      expect(beginnerTemplate?.category).toBe('beginner');
      expect(beginnerTemplate?.accounts.length).toBeGreaterThan(1);
    });

    it('should have Small Business Starter template', () => {
      const businessTemplate = accountTemplateService.getTemplateById('small-business-starter');
      
      expect(businessTemplate).toBeDefined();
      expect(businessTemplate?.name).toBe('Small Business Starter');
      expect(businessTemplate?.category).toBe('business');
      expect(businessTemplate?.accounts.length).toBeGreaterThan(1);
    });
  });
});
