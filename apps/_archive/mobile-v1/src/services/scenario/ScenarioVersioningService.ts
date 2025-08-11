/**
 * Scenario Versioning Service
 * Epic 9, Story 3: Advanced scenario management with versioning, sharing, and archival
 * Provides comprehensive version control and collaboration features for scenarios
 */

import { EnhancedScenario } from '@drishti/shared/types/financial';

export interface ScenarioVersion {
  id: string;
  scenarioId: string;
  version: number;
  name: string;
  description: string;
  scenario: EnhancedScenario;
  changes: VersionChange[];
  createdAt: Date;
  createdBy: string;
  parentVersionId?: string;
  tags: string[];
  isActive: boolean;
  metadata: VersionMetadata;
}

export interface VersionChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
  description: string;
}

export interface VersionMetadata {
  changeReason: string;
  impactLevel: 'minor' | 'moderate' | 'major';
  reviewStatus: 'draft' | 'reviewed' | 'approved';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes: string[];
}

export interface ScenarioShare {
  id: string;
  scenarioId: string;
  versionId: string;
  shareType: 'public' | 'private' | 'team';
  shareCode: string;
  expiresAt?: Date;
  permissions: SharePermissions;
  sharedBy: string;
  sharedAt: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  anonymized: boolean;
}

export interface SharePermissions {
  canView: boolean;
  canCopy: boolean;
  canComment: boolean;
  canModify: boolean;
}

export interface ArchivedScenario {
  id: string;
  originalScenario: EnhancedScenario;
  versions: ScenarioVersion[];
  archivedAt: Date;
  archivedBy: string;
  archiveReason: string;
  retentionPeriod: number; // days
  canRestore: boolean;
  metadata: {
    originalCreatedAt: Date;
    lastModifiedAt: Date;
    totalVersions: number;
    usageStats: {
      viewCount: number;
      shareCount: number;
      comparisonCount: number;
    };
  };
}

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  scenario: EnhancedScenario;
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  downloadCount: number;
  rating: number;
  reviews: TemplateReview[];
  tags: string[];
}

export interface TemplateReview {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
}

/**
 * Scenario Versioning Service
 */
export class ScenarioVersioningService {
  private static instance: ScenarioVersioningService;
  private versions: Map<string, ScenarioVersion[]> = new Map();
  private shares: Map<string, ScenarioShare> = new Map();
  private archives: Map<string, ArchivedScenario> = new Map();
  private templates: Map<string, ScenarioTemplate> = new Map();

  private constructor() {
    this.initializeTemplateMarketplace();
  }

  public static getInstance(): ScenarioVersioningService {
    if (!ScenarioVersioningService.instance) {
      ScenarioVersioningService.instance = new ScenarioVersioningService();
    }
    return ScenarioVersioningService.instance;
  }

  /**
   * Create a new version of a scenario
   */
  public async createVersion(
    scenarioId: string,
    scenario: EnhancedScenario,
    changeReason: string,
    parentVersionId?: string
  ): Promise<ScenarioVersion> {
    const existingVersions = this.versions.get(scenarioId) || [];
    const parentVersion = parentVersionId 
      ? existingVersions.find(v => v.id === parentVersionId)
      : existingVersions[existingVersions.length - 1];

    // Calculate changes from parent version
    const changes = parentVersion 
      ? this.calculateChanges(parentVersion.scenario, scenario)
      : [];

    const version: ScenarioVersion = {
      id: `version_${Date.now()}`,
      scenarioId,
      version: existingVersions.length + 1,
      name: `${scenario.name} v${existingVersions.length + 1}`,
      description: scenario.description,
      scenario,
      changes,
      createdAt: new Date(),
      createdBy: 'current_user', // Would be actual user ID
      parentVersionId,
      tags: scenario.tags || [],
      isActive: true,
      metadata: {
        changeReason,
        impactLevel: this.determineImpactLevel(changes),
        reviewStatus: 'draft',
        notes: [],
      },
    };

    // Deactivate previous active version
    existingVersions.forEach(v => v.isActive = false);

    // Add new version
    existingVersions.push(version);
    this.versions.set(scenarioId, existingVersions);

    return version;
  }

  /**
   * Get all versions for a scenario
   */
  public getVersions(scenarioId: string): ScenarioVersion[] {
    return this.versions.get(scenarioId) || [];
  }

  /**
   * Get specific version
   */
  public getVersion(scenarioId: string, versionId: string): ScenarioVersion | null {
    const versions = this.versions.get(scenarioId) || [];
    return versions.find(v => v.id === versionId) || null;
  }

  /**
   * Get active version
   */
  public getActiveVersion(scenarioId: string): ScenarioVersion | null {
    const versions = this.versions.get(scenarioId) || [];
    return versions.find(v => v.isActive) || null;
  }

  /**
   * Rollback to a previous version
   */
  public async rollbackToVersion(
    scenarioId: string,
    versionId: string,
    reason: string
  ): Promise<ScenarioVersion> {
    const targetVersion = this.getVersion(scenarioId, versionId);
    if (!targetVersion) {
      throw new Error('Version not found');
    }

    // Create new version based on target version
    return this.createVersion(
      scenarioId,
      { ...targetVersion.scenario },
      `Rollback to v${targetVersion.version}: ${reason}`,
      versionId
    );
  }

  /**
   * Share a scenario
   */
  public async shareScenario(
    scenarioId: string,
    versionId: string,
    shareType: 'public' | 'private' | 'team',
    permissions: SharePermissions,
    expiresIn?: number // days
  ): Promise<ScenarioShare> {
    const shareCode = this.generateShareCode();
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
      : undefined;

    const share: ScenarioShare = {
      id: `share_${Date.now()}`,
      scenarioId,
      versionId,
      shareType,
      shareCode,
      expiresAt,
      permissions,
      sharedBy: 'current_user',
      sharedAt: new Date(),
      accessCount: 0,
      anonymized: shareType === 'public',
    };

    this.shares.set(share.id, share);
    return share;
  }

  /**
   * Access shared scenario
   */
  public async accessSharedScenario(shareCode: string): Promise<{
    scenario: EnhancedScenario;
    share: ScenarioShare;
  } | null> {
    const share = Array.from(this.shares.values()).find(s => s.shareCode === shareCode);
    if (!share) return null;

    // Check expiration
    if (share.expiresAt && share.expiresAt < new Date()) {
      return null;
    }

    // Update access stats
    share.accessCount++;
    share.lastAccessedAt = new Date();

    // Get scenario version
    const version = this.getVersion(share.scenarioId, share.versionId);
    if (!version) return null;

    let scenario = version.scenario;
    
    // Anonymize if needed
    if (share.anonymized) {
      scenario = this.anonymizeScenario(scenario);
    }

    return { scenario, share };
  }

  /**
   * Archive a scenario
   */
  public async archiveScenario(
    scenarioId: string,
    reason: string,
    retentionDays: number = 90
  ): Promise<ArchivedScenario> {
    const versions = this.getVersions(scenarioId);
    if (versions.length === 0) {
      throw new Error('No versions found for scenario');
    }

    const activeVersion = versions.find(v => v.isActive);
    if (!activeVersion) {
      throw new Error('No active version found');
    }

    const archived: ArchivedScenario = {
      id: `archive_${Date.now()}`,
      originalScenario: activeVersion.scenario,
      versions,
      archivedAt: new Date(),
      archivedBy: 'current_user',
      archiveReason: reason,
      retentionPeriod: retentionDays,
      canRestore: true,
      metadata: {
        originalCreatedAt: versions[0].createdAt,
        lastModifiedAt: activeVersion.createdAt,
        totalVersions: versions.length,
        usageStats: {
          viewCount: 0, // Would track actual usage
          shareCount: Array.from(this.shares.values()).filter(s => s.scenarioId === scenarioId).length,
          comparisonCount: 0, // Would track actual usage
        },
      },
    };

    this.archives.set(scenarioId, archived);
    
    // Remove from active versions
    this.versions.delete(scenarioId);

    return archived;
  }

  /**
   * Restore archived scenario
   */
  public async restoreScenario(scenarioId: string): Promise<ScenarioVersion> {
    const archived = this.archives.get(scenarioId);
    if (!archived || !archived.canRestore) {
      throw new Error('Cannot restore scenario');
    }

    // Restore versions
    this.versions.set(scenarioId, archived.versions);
    
    // Remove from archives
    this.archives.delete(scenarioId);

    // Return active version
    const activeVersion = archived.versions.find(v => v.isActive);
    if (!activeVersion) {
      throw new Error('No active version in archived scenario');
    }

    return activeVersion;
  }

  /**
   * Get archived scenarios
   */
  public getArchivedScenarios(): ArchivedScenario[] {
    return Array.from(this.archives.values()).sort(
      (a, b) => b.archivedAt.getTime() - a.archivedAt.getTime()
    );
  }

  /**
   * Create template from scenario
   */
  public async createTemplate(
    scenario: EnhancedScenario,
    name: string,
    description: string,
    category: string,
    isPublic: boolean = false
  ): Promise<ScenarioTemplate> {
    const template: ScenarioTemplate = {
      id: `template_${Date.now()}`,
      name,
      description,
      category,
      scenario: this.sanitizeScenarioForTemplate(scenario),
      createdBy: 'current_user',
      createdAt: new Date(),
      isPublic,
      downloadCount: 0,
      rating: 0,
      reviews: [],
      tags: scenario.tags || [],
    };

    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Get template marketplace
   */
  public getTemplateMarketplace(category?: string): ScenarioTemplate[] {
    let templates = Array.from(this.templates.values()).filter(t => t.isPublic);
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    return templates.sort((a, b) => b.downloadCount - a.downloadCount);
  }

  /**
   * Download template
   */
  public async downloadTemplate(templateId: string): Promise<EnhancedScenario> {
    const template = this.templates.get(templateId);
    if (!template || !template.isPublic) {
      throw new Error('Template not found or not public');
    }

    // Update download count
    template.downloadCount++;

    // Return a copy of the scenario
    return { ...template.scenario, id: `scenario_${Date.now()}` };
  }

  /**
   * Calculate changes between scenarios
   */
  private calculateChanges(oldScenario: EnhancedScenario, newScenario: EnhancedScenario): VersionChange[] {
    const changes: VersionChange[] = [];

    // Compare basic properties
    if (oldScenario.name !== newScenario.name) {
      changes.push({
        field: 'name',
        oldValue: oldScenario.name,
        newValue: newScenario.name,
        changeType: 'modified',
        description: 'Scenario name changed',
      });
    }

    if (oldScenario.description !== newScenario.description) {
      changes.push({
        field: 'description',
        oldValue: oldScenario.description,
        newValue: newScenario.description,
        changeType: 'modified',
        description: 'Scenario description changed',
      });
    }

    // Compare assumptions
    const oldAssumptions = oldScenario.assumptions;
    const newAssumptions = newScenario.assumptions;

    Object.keys(newAssumptions).forEach(key => {
      const oldValue = oldAssumptions[key as keyof typeof oldAssumptions];
      const newValue = newAssumptions[key as keyof typeof newAssumptions];

      if (oldValue !== newValue) {
        changes.push({
          field: `assumptions.${key}`,
          oldValue,
          newValue,
          changeType: 'modified',
          description: `${key.replace('_', ' ')} changed from ${oldValue} to ${newValue}`,
        });
      }
    });

    return changes;
  }

  /**
   * Determine impact level of changes
   */
  private determineImpactLevel(changes: VersionChange[]): 'minor' | 'moderate' | 'major' {
    const significantFields = ['market_return', 'savings_rate', 'retirement_age'];
    const hasSignificantChanges = changes.some(change => 
      significantFields.some(field => change.field.includes(field))
    );

    if (changes.length === 0) return 'minor';
    if (changes.length > 5 || hasSignificantChanges) return 'major';
    if (changes.length > 2) return 'moderate';
    return 'minor';
  }

  /**
   * Generate share code
   */
  private generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Anonymize scenario for sharing
   */
  private anonymizeScenario(scenario: EnhancedScenario): EnhancedScenario {
    return {
      ...scenario,
      name: `Anonymous ${scenario.type} Scenario`,
      description: 'Shared anonymously',
      created_by: 'anonymous',
      tags: scenario.tags?.filter(tag => !tag.includes('personal')) || [],
    };
  }

  /**
   * Sanitize scenario for template
   */
  private sanitizeScenarioForTemplate(scenario: EnhancedScenario): EnhancedScenario {
    return {
      ...scenario,
      id: '', // Will be generated when used
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'template',
      tags: scenario.tags?.filter(tag => !tag.includes('personal')) || [],
    };
  }

  /**
   * Initialize template marketplace with sample templates
   */
  private initializeTemplateMarketplace(): void {
    // This would be populated from a backend service
    // Adding a few sample templates for demonstration
    const sampleTemplates = [
      {
        name: 'Conservative FIRE',
        description: 'Low-risk approach to FIRE with conservative assumptions',
        category: 'Conservative',
        assumptions: {
          inflation_rate: 0.03,
          market_return: 0.06,
          savings_rate: 0.25,
          retirement_age: 65,
          life_expectancy: 85,
          emergency_fund_months: 12,
          healthcare_inflation: 0.05,
          tax_rate: 0.22,
        },
      },
      {
        name: 'Aggressive FIRE',
        description: 'High-growth approach with aggressive savings and returns',
        category: 'Aggressive',
        assumptions: {
          inflation_rate: 0.025,
          market_return: 0.10,
          savings_rate: 0.50,
          retirement_age: 45,
          life_expectancy: 85,
          emergency_fund_months: 6,
          healthcare_inflation: 0.04,
          tax_rate: 0.20,
        },
      },
    ];

    sampleTemplates.forEach((template, index) => {
      const scenarioTemplate: ScenarioTemplate = {
        id: `template_sample_${index}`,
        name: template.name,
        description: template.description,
        category: template.category,
        scenario: {
          id: '',
          name: template.name,
          description: template.description,
          type: template.category.toLowerCase() as any,
          category: 'template',
          assumptions: template.assumptions,
          tags: [template.category.toLowerCase()],
          color: index === 0 ? '#4CAF50' : '#FF9800',
          emoji: index === 0 ? '🛡️' : '🚀',
          popularity_score: 100 - index * 10,
          created_by: 'system',
          created_at: new Date(),
          updated_at: new Date(),
        },
        createdBy: 'system',
        createdAt: new Date(),
        isPublic: true,
        downloadCount: 50 - index * 10,
        rating: 4.5 - index * 0.2,
        reviews: [],
        tags: [template.category.toLowerCase()],
      };

      this.templates.set(scenarioTemplate.id, scenarioTemplate);
    });
  }
}

export const scenarioVersioningService = ScenarioVersioningService.getInstance();
