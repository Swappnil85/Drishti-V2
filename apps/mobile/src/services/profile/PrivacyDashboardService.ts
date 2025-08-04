/**
 * Privacy Dashboard Service
 * Manages privacy settings, data collection transparency, and user rights
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PrivacyDashboard,
  DataCollectionInfo,
  DataUsageInfo,
  ThirdPartyInfo,
  RetentionPolicyInfo,
  UserRightsInfo,
} from '../../types/profile';

class PrivacyDashboardService {
  private storageKey = 'PRIVACY_DASHBOARD';
  private currentDashboard: PrivacyDashboard | null = null;

  /**
   * Initialize privacy dashboard
   */
  async initialize(): Promise<PrivacyDashboard> {
    try {
      await this.loadDashboard();
      
      if (!this.currentDashboard) {
        this.currentDashboard = this.createDefaultDashboard();
        await this.saveDashboard();
      }
      
      return this.currentDashboard;
    } catch (error) {
      console.error('Failed to initialize privacy dashboard:', error);
      return this.createDefaultDashboard();
    }
  }

  /**
   * Get privacy dashboard
   */
  async getDashboard(): Promise<PrivacyDashboard> {
    if (this.currentDashboard) {
      return this.currentDashboard;
    }
    
    return await this.initialize();
  }

  /**
   * Update data collection setting
   */
  async updateDataCollection(category: string, enabled: boolean): Promise<void> {
    if (!this.currentDashboard) {
      await this.initialize();
    }

    if (this.currentDashboard) {
      const item = this.currentDashboard.dataCollected.find(d => d.category === category);
      if (item && !item.required) {
        item.enabled = enabled;
        await this.saveDashboard();
      }
    }
  }

  /**
   * Update third-party sharing setting
   */
  async updateThirdPartySharing(name: string, enabled: boolean): Promise<void> {
    if (!this.currentDashboard) {
      await this.initialize();
    }

    if (this.currentDashboard) {
      const item = this.currentDashboard.thirdPartySharing.find(t => t.name === name);
      if (item) {
        item.enabled = enabled;
        await this.saveDashboard();
      }
    }
  }

  /**
   * Get data collection summary
   */
  getDataCollectionSummary(): {
    totalCategories: number;
    enabledCategories: number;
    requiredCategories: number;
    optionalCategories: number;
  } {
    if (!this.currentDashboard) {
      return { totalCategories: 0, enabledCategories: 0, requiredCategories: 0, optionalCategories: 0 };
    }

    const data = this.currentDashboard.dataCollected;
    return {
      totalCategories: data.length,
      enabledCategories: data.filter(d => d.enabled).length,
      requiredCategories: data.filter(d => d.required).length,
      optionalCategories: data.filter(d => !d.required).length,
    };
  }

  /**
   * Get third-party sharing summary
   */
  getThirdPartySharingSummary(): {
    totalPartners: number;
    activePartners: number;
    dataTypesShared: string[];
  } {
    if (!this.currentDashboard) {
      return { totalPartners: 0, activePartners: 0, dataTypesShared: [] };
    }

    const partners = this.currentDashboard.thirdPartySharing;
    const activePartners = partners.filter(p => p.enabled);
    const dataTypesShared = [...new Set(
      activePartners.flatMap(p => p.dataShared)
    )];

    return {
      totalPartners: partners.length,
      activePartners: activePartners.length,
      dataTypesShared,
    };
  }

  /**
   * Export privacy data
   */
  async exportPrivacyData(): Promise<string> {
    const dashboard = await this.getDashboard();
    const summary = {
      dataCollection: this.getDataCollectionSummary(),
      thirdPartySharing: this.getThirdPartySharingSummary(),
      dashboard,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Create default privacy dashboard
   */
  private createDefaultDashboard(): PrivacyDashboard {
    return {
      dataCollected: [
        {
          category: 'Financial Data',
          description: 'Income, expenses, savings, and investment information',
          purpose: 'FIRE calculations and personalized recommendations',
          frequency: 'When you update your profile',
          enabled: true,
          required: true,
        },
        {
          category: 'Usage Analytics',
          description: 'App usage patterns, feature interactions, and performance data',
          purpose: 'Improve app functionality and user experience',
          frequency: 'Continuously while using the app',
          enabled: true,
          required: false,
        },
        {
          category: 'Device Information',
          description: 'Device type, OS version, and app version',
          purpose: 'Technical support and compatibility',
          frequency: 'Once per app session',
          enabled: true,
          required: true,
        },
        {
          category: 'Location Data',
          description: 'General location for regional financial recommendations',
          purpose: 'Provide region-specific financial advice',
          frequency: 'When you update regional settings',
          enabled: false,
          required: false,
        },
        {
          category: 'Crash Reports',
          description: 'Technical error logs and crash information',
          purpose: 'Fix bugs and improve app stability',
          frequency: 'When app crashes occur',
          enabled: true,
          required: false,
        },
      ],
      dataUsage: [
        {
          purpose: 'FIRE Calculations',
          description: 'Calculate your FIRE number, savings rate, and timeline',
          dataTypes: ['Financial Data', 'Personal Information'],
          frequency: 'Real-time when data changes',
        },
        {
          purpose: 'Personalized Recommendations',
          description: 'Generate AI-powered suggestions for your FIRE journey',
          dataTypes: ['Financial Data', 'Usage Analytics', 'Personal Information'],
          frequency: 'Daily analysis and updates',
        },
        {
          purpose: 'App Improvement',
          description: 'Analyze usage patterns to enhance features',
          dataTypes: ['Usage Analytics', 'Device Information'],
          frequency: 'Continuous aggregated analysis',
        },
        {
          purpose: 'Technical Support',
          description: 'Diagnose and resolve technical issues',
          dataTypes: ['Device Information', 'Crash Reports'],
          frequency: 'When support is needed',
        },
      ],
      thirdPartySharing: [
        {
          name: 'Analytics Provider',
          purpose: 'App usage analytics and performance monitoring',
          dataShared: ['Usage Analytics', 'Device Information'],
          privacyPolicy: 'https://example.com/analytics-privacy',
          enabled: true,
        },
        {
          name: 'Crash Reporting Service',
          purpose: 'Automated crash detection and reporting',
          dataShared: ['Crash Reports', 'Device Information'],
          privacyPolicy: 'https://example.com/crash-privacy',
          enabled: true,
        },
        {
          name: 'Financial Data Provider',
          purpose: 'Market data and financial information',
          dataShared: ['General Location'],
          privacyPolicy: 'https://example.com/financial-privacy',
          enabled: false,
        },
      ],
      retentionPolicy: {
        category: 'All User Data',
        retentionPeriod: 365, // 1 year
        deletionMethod: 'Secure deletion with overwriting',
        exceptions: ['Legal compliance requirements', 'Active disputes'],
      },
      userRights: {
        canExport: true,
        canDelete: true,
        canCorrect: true,
        canRestrict: true,
        canPortability: true,
      },
    };
  }

  /**
   * Load dashboard from storage
   */
  private async loadDashboard(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.currentDashboard = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load privacy dashboard:', error);
    }
  }

  /**
   * Save dashboard to storage
   */
  private async saveDashboard(): Promise<void> {
    if (!this.currentDashboard) {
      return;
    }

    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.currentDashboard));
    } catch (error) {
      console.error('Failed to save privacy dashboard:', error);
    }
  }

  /**
   * Reset to default settings
   */
  async resetToDefaults(): Promise<PrivacyDashboard> {
    this.currentDashboard = this.createDefaultDashboard();
    await this.saveDashboard();
    return this.currentDashboard;
  }

  /**
   * Get privacy score (0-100)
   */
  getPrivacyScore(): number {
    if (!this.currentDashboard) {
      return 0;
    }

    let score = 0;
    const weights = {
      dataCollection: 40,
      thirdPartySharing: 35,
      userRights: 25,
    };

    // Data collection score (higher for fewer enabled optional items)
    const dataCollection = this.currentDashboard.dataCollected;
    const optionalItems = dataCollection.filter(d => !d.required);
    const enabledOptional = optionalItems.filter(d => d.enabled);
    const dataScore = optionalItems.length > 0 
      ? ((optionalItems.length - enabledOptional.length) / optionalItems.length) * weights.dataCollection
      : weights.dataCollection;

    // Third-party sharing score (higher for fewer enabled partners)
    const thirdParty = this.currentDashboard.thirdPartySharing;
    const enabledPartners = thirdParty.filter(p => p.enabled);
    const thirdPartyScore = thirdParty.length > 0
      ? ((thirdParty.length - enabledPartners.length) / thirdParty.length) * weights.thirdPartySharing
      : weights.thirdPartySharing;

    // User rights score (full score if all rights available)
    const rights = this.currentDashboard.userRights;
    const availableRights = Object.values(rights).filter(Boolean).length;
    const totalRights = Object.keys(rights).length;
    const rightsScore = (availableRights / totalRights) * weights.userRights;

    score = dataScore + thirdPartyScore + rightsScore;
    return Math.round(score);
  }

  /**
   * Get privacy recommendations
   */
  getPrivacyRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.currentDashboard) {
      return recommendations;
    }

    const summary = this.getDataCollectionSummary();
    const thirdPartySummary = this.getThirdPartySharingSummary();

    if (summary.enabledCategories > summary.requiredCategories + 1) {
      recommendations.push('Consider disabling optional data collection to improve privacy');
    }

    if (thirdPartySummary.activePartners > 1) {
      recommendations.push('Review third-party data sharing settings');
    }

    if (this.currentDashboard.dataCollected.some(d => d.category === 'Location Data' && d.enabled)) {
      recommendations.push('Location data is enabled - consider if this is necessary');
    }

    return recommendations;
  }
}

export default new PrivacyDashboardService();
