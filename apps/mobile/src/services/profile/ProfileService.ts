/**
 * Profile Service
 * Manages user profile data, validation, and recommendations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  UserProfile,
  PersonalInformation,
  FinancialInformation,
  SecuritySettings,
  PrivacySettings,
  RegionalSettings,
  ProfileChangeHistory,
  PersonalizedRecommendation,
  SecurityEvent,
  ProfileValidationRules,
  ProfileExportData,
  UpdateProfileRequest,
  DEFAULT_PROFILE_VALIDATION_RULES,
  EXPENSE_CATEGORIES,
  INCOME_TYPES,
} from '../../types/profile';

class ProfileService {
  private storageKey = 'USER_PROFILE';
  private changeHistoryKey = 'PROFILE_CHANGE_HISTORY';
  private recommendationsKey = 'PROFILE_RECOMMENDATIONS';
  private securityEventsKey = 'SECURITY_EVENTS';
  
  private currentProfile: UserProfile | null = null;
  private changeHistory: ProfileChangeHistory[] = [];
  private recommendations: PersonalizedRecommendation[] = [];
  private securityEvents: SecurityEvent[] = [];
  private validationRules: ProfileValidationRules = DEFAULT_PROFILE_VALIDATION_RULES;

  /**
   * Initialize profile service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadProfile();
      await this.loadChangeHistory();
      await this.loadRecommendations();
      await this.loadSecurityEvents();
    } catch (error) {
      console.error('Failed to initialize ProfileService:', error);
    }
  }

  /**
   * Create new user profile
   */
  async createProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const now = Date.now();
    const profile: UserProfile = {
      id: profileData.id || `profile_${now}`,
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
        ...profileData.personalInfo,
      },
      financialInfo: {
        age: 25,
        currentSavings: 0,
        desiredRetirementAge: 65,
        riskTolerance: 'moderate',
        primaryIncome: {
          id: 'primary',
          type: 'salary',
          description: 'Primary Salary',
          amount: 0,
          frequency: 'annually',
          taxable: true,
          active: true,
        },
        additionalIncomes: [],
        totalAnnualIncome: 0,
        monthlyExpenses: 0,
        annualExpenses: 0,
        expenseCategories: [],
        savingsRate: 0,
        fireNumber: 0,
        yearsToFire: 0,
        monthlyRequiredSavings: 0,
        ...profileData.financialInfo,
      },
      regionalSettings: {
        country: 'US',
        currency: 'USD',
        taxSystem: 'US',
        retirementSystem: 'US_401K',
        ...profileData.regionalSettings,
      },
      securitySettings: {
        biometricEnabled: false,
        pinEnabled: false,
        twoFactorEnabled: false,
        sessionTimeout: 15,
        autoLockEnabled: true,
        localOnlyMode: false,
        cloudSyncEnabled: true,
        ...profileData.securitySettings,
      },
      privacySettings: {
        analyticsEnabled: true,
        crashReportingEnabled: true,
        performanceDataEnabled: true,
        marketingEmailsEnabled: false,
        dataRetentionPeriod: 365,
        gdprCompliant: true,
        ...profileData.privacySettings,
      },
      securityEvents: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    // Calculate derived financial values
    this.calculateFinancialMetrics(profile.financialInfo);

    this.currentProfile = profile;
    await this.saveProfile();
    
    // Log profile creation
    await this.logSecurityEvent({
      type: 'settings_change',
      details: 'Profile created',
      success: true,
    });

    return profile;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile | null> {
    if (this.currentProfile) {
      return this.currentProfile;
    }
    
    await this.loadProfile();
    return this.currentProfile;
  }

  /**
   * Update profile field
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
    if (!this.currentProfile) {
      throw new Error('No profile found');
    }

    const oldValue = this.getNestedValue(this.currentProfile, request.field);
    
    // Validate the new value
    this.validateProfileField(request.field, request.value);
    
    // Update the profile
    this.setNestedValue(this.currentProfile, request.field, request.value);
    this.currentProfile.updatedAt = Date.now();
    this.currentProfile.version += 1;

    // Recalculate financial metrics if financial data changed
    if (request.field.startsWith('financialInfo')) {
      this.calculateFinancialMetrics(this.currentProfile.financialInfo);
    }

    // Save profile
    await this.saveProfile();

    // Log change
    await this.logProfileChange({
      field: request.field,
      oldValue,
      newValue: request.value,
      reason: request.reason,
    });

    // Log security event
    await this.logSecurityEvent({
      type: 'settings_change',
      details: `Updated ${request.field}`,
      success: true,
    });

    // Generate new recommendations if needed
    if (this.shouldRegenerateRecommendations(request.field)) {
      await this.generateRecommendations();
    }

    return this.currentProfile;
  }

  /**
   * Update multiple profile fields
   */
  async updateMultipleFields(updates: UpdateProfileRequest[]): Promise<UserProfile> {
    if (!this.currentProfile) {
      throw new Error('No profile found');
    }

    const changes: ProfileChangeHistory[] = [];
    
    for (const update of updates) {
      const oldValue = this.getNestedValue(this.currentProfile, update.field);
      
      // Validate the new value
      this.validateProfileField(update.field, update.value);
      
      // Update the profile
      this.setNestedValue(this.currentProfile, update.field, update.value);
      
      // Track change
      changes.push({
        id: `change_${Date.now()}_${Math.random()}`,
        userId: this.currentProfile.id,
        field: update.field,
        oldValue,
        newValue: update.value,
        timestamp: Date.now(),
        reason: update.reason,
        deviceInfo: 'Mobile App',
      });
    }

    this.currentProfile.updatedAt = Date.now();
    this.currentProfile.version += 1;

    // Recalculate financial metrics
    this.calculateFinancialMetrics(this.currentProfile.financialInfo);

    // Save profile and changes
    await this.saveProfile();
    await this.saveChangeHistory(changes);

    // Log security event
    await this.logSecurityEvent({
      type: 'settings_change',
      details: `Bulk update: ${updates.length} fields`,
      success: true,
    });

    // Generate new recommendations
    await this.generateRecommendations();

    return this.currentProfile;
  }

  /**
   * Calculate financial metrics
   */
  private calculateFinancialMetrics(financialInfo: FinancialInformation): void {
    // Calculate total annual income
    financialInfo.totalAnnualIncome = financialInfo.primaryIncome.amount;
    financialInfo.additionalIncomes.forEach(income => {
      if (income.active) {
        let annualAmount = income.amount;
        if (income.frequency === 'monthly') {
          annualAmount *= 12;
        } else if (income.frequency === 'quarterly') {
          annualAmount *= 4;
        }
        financialInfo.totalAnnualIncome += annualAmount;
      }
    });

    // Calculate annual expenses
    financialInfo.annualExpenses = financialInfo.monthlyExpenses * 12;

    // Calculate savings rate
    const annualSavings = financialInfo.totalAnnualIncome - financialInfo.annualExpenses;
    financialInfo.savingsRate = financialInfo.totalAnnualIncome > 0 
      ? annualSavings / financialInfo.totalAnnualIncome 
      : 0;

    // Calculate FIRE number (25x annual expenses)
    financialInfo.fireNumber = financialInfo.annualExpenses * 25;

    // Calculate years to FIRE
    if (annualSavings > 0) {
      const remainingAmount = financialInfo.fireNumber - financialInfo.currentSavings;
      financialInfo.yearsToFire = Math.max(0, remainingAmount / annualSavings);
    } else {
      financialInfo.yearsToFire = Infinity;
    }

    // Calculate monthly required savings
    const yearsToRetirement = financialInfo.desiredRetirementAge - financialInfo.age;
    if (yearsToRetirement > 0) {
      const remainingAmount = financialInfo.fireNumber - financialInfo.currentSavings;
      financialInfo.monthlyRequiredSavings = remainingAmount / (yearsToRetirement * 12);
    } else {
      financialInfo.monthlyRequiredSavings = 0;
    }
  }

  /**
   * Validate profile field
   */
  private validateProfileField(field: string, value: any): void {
    const rules = this.validationRules;
    
    if (field === 'financialInfo.age') {
      if (value < rules.age.min || value > rules.age.max) {
        throw new Error(`Age must be between ${rules.age.min} and ${rules.age.max}`);
      }
    }
    
    if (field === 'financialInfo.totalAnnualIncome' || field === 'financialInfo.primaryIncome.amount') {
      if (value < rules.income.min || value > rules.income.max) {
        throw new Error(`Income must be between ${rules.income.min} and ${rules.income.max}`);
      }
    }
    
    if (field === 'financialInfo.currentSavings') {
      if (value < rules.savings.min || value > rules.savings.max) {
        throw new Error(`Savings must be between ${rules.savings.min} and ${rules.savings.max}`);
      }
    }
    
    if (field === 'financialInfo.monthlyExpenses') {
      if (value < rules.expenses.min || value > rules.expenses.max) {
        throw new Error(`Monthly expenses must be between ${rules.expenses.min} and ${rules.expenses.max}`);
      }
    }
    
    if (field === 'financialInfo.desiredRetirementAge') {
      if (value < rules.retirementAge.min || value > rules.retirementAge.max) {
        throw new Error(`Retirement age must be between ${rules.retirementAge.min} and ${rules.retirementAge.max}`);
      }
    }
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(): Promise<PersonalizedRecommendation[]> {
    if (!this.currentProfile) {
      return [];
    }

    const recommendations: PersonalizedRecommendation[] = [];
    const financial = this.currentProfile.financialInfo;
    const now = Date.now();

    // Savings rate recommendation
    if (financial.savingsRate < 0.2) {
      recommendations.push({
        id: `rec_savings_${now}`,
        type: 'savings_rate',
        title: 'Increase Your Savings Rate',
        description: `Your current savings rate is ${(financial.savingsRate * 100).toFixed(1)}%. Consider increasing it to 20% or higher.`,
        rationale: 'A higher savings rate will significantly reduce your time to FIRE.',
        actionSteps: [
          'Review your monthly expenses for areas to cut',
          'Automate savings transfers',
          'Consider increasing your income through side hustles',
        ],
        impact: {
          timeToFire: financial.yearsToFire * 0.8, // 20% reduction
        },
        priority: 'high',
        confidence: 0.9,
        createdAt: now,
        expiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30 days
      });
    }

    // Emergency fund recommendation
    const emergencyFund = financial.monthlyExpenses * 6;
    if (financial.currentSavings < emergencyFund) {
      recommendations.push({
        id: `rec_emergency_${now}`,
        type: 'savings_rate',
        title: 'Build Your Emergency Fund',
        description: `You should have 6 months of expenses (${this.formatCurrency(emergencyFund)}) in emergency savings.`,
        rationale: 'An emergency fund protects your FIRE journey from unexpected expenses.',
        actionSteps: [
          'Open a high-yield savings account',
          'Set up automatic transfers',
          'Prioritize emergency fund before investing',
        ],
        impact: {
          riskReduction: 0.3,
        },
        priority: 'high',
        confidence: 0.95,
        createdAt: now,
      });
    }

    // Investment allocation recommendation
    if (financial.riskTolerance === 'conservative' && financial.age < 40) {
      recommendations.push({
        id: `rec_allocation_${now}`,
        type: 'investment_allocation',
        title: 'Consider More Aggressive Allocation',
        description: 'At your age, you might benefit from a more aggressive investment strategy.',
        rationale: 'Younger investors can typically handle more risk for higher returns.',
        actionSteps: [
          'Review your risk tolerance',
          'Consider increasing stock allocation',
          'Consult with a financial advisor',
        ],
        impact: {
          timeToFire: financial.yearsToFire * 0.9, // 10% reduction
        },
        priority: 'medium',
        confidence: 0.7,
        createdAt: now,
      });
    }

    this.recommendations = recommendations;
    await this.saveRecommendations();
    
    return recommendations;
  }

  /**
   * Get recommendations
   */
  async getRecommendations(): Promise<PersonalizedRecommendation[]> {
    if (this.recommendations.length === 0) {
      await this.loadRecommendations();
    }
    
    // Filter out expired recommendations
    const now = Date.now();
    return this.recommendations.filter(rec => 
      !rec.expiresAt || rec.expiresAt > now
    );
  }

  /**
   * Accept recommendation
   */
  async acceptRecommendation(recommendationId: string): Promise<void> {
    const recommendation = this.recommendations.find(r => r.id === recommendationId);
    if (recommendation) {
      recommendation.accepted = true;
      await this.saveRecommendations();
      
      await this.logSecurityEvent({
        type: 'settings_change',
        details: `Accepted recommendation: ${recommendation.title}`,
        success: true,
      });
    }
  }

  /**
   * Dismiss recommendation
   */
  async dismissRecommendation(recommendationId: string, feedback?: string): Promise<void> {
    const recommendation = this.recommendations.find(r => r.id === recommendationId);
    if (recommendation) {
      recommendation.dismissed = true;
      recommendation.feedback = feedback;
      await this.saveRecommendations();
    }
  }

  /**
   * Export profile data
   */
  async exportProfileData(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (!this.currentProfile) {
      throw new Error('No profile found');
    }

    const exportData: ProfileExportData = {
      profile: this.currentProfile,
      changeHistory: this.changeHistory,
      recommendations: this.recommendations,
      securityEvents: this.securityEvents,
      exportedAt: Date.now(),
      format,
      requestedBy: this.currentProfile.id,
    };

    const fileName = `profile_export_${Date.now()}.${format}`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    if (format === 'json') {
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(exportData, null, 2)
      );
    } else {
      // Convert to CSV format
      const csvData = this.convertToCSV(exportData);
      await FileSystem.writeAsStringAsync(filePath, csvData);
    }

    // Log export event
    await this.logSecurityEvent({
      type: 'data_export',
      details: `Exported profile data in ${format} format`,
      success: true,
    });

    return filePath;
  }

  /**
   * Delete profile and all associated data
   */
  async deleteProfile(): Promise<void> {
    if (!this.currentProfile) {
      return;
    }

    // Log deletion event
    await this.logSecurityEvent({
      type: 'settings_change',
      details: 'Profile deletion requested',
      success: true,
    });

    // Clear all data
    await AsyncStorage.multiRemove([
      this.storageKey,
      this.changeHistoryKey,
      this.recommendationsKey,
      this.securityEventsKey,
    ]);

    // Clear in-memory data
    this.currentProfile = null;
    this.changeHistory = [];
    this.recommendations = [];
    this.securityEvents = [];
  }

  /**
   * Utility methods
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private shouldRegenerateRecommendations(field: string): boolean {
    const financialFields = [
      'financialInfo.totalAnnualIncome',
      'financialInfo.monthlyExpenses',
      'financialInfo.currentSavings',
      'financialInfo.riskTolerance',
      'financialInfo.desiredRetirementAge',
    ];
    return financialFields.includes(field);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private convertToCSV(data: ProfileExportData): string {
    // Simple CSV conversion - in a real app, you'd want a more robust solution
    const headers = ['Type', 'Field', 'Value', 'Timestamp'];
    const rows = [headers.join(',')];
    
    // Add profile data
    Object.entries(data.profile).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          rows.push(`Profile,${key}.${subKey},"${subValue}",${data.exportedAt}`);
        });
      } else {
        rows.push(`Profile,${key},"${value}",${data.exportedAt}`);
      }
    });
    
    return rows.join('\n');
  }

  private async logProfileChange(change: Omit<ProfileChangeHistory, 'id' | 'userId' | 'timestamp' | 'deviceInfo'>): Promise<void> {
    if (!this.currentProfile) return;

    const changeRecord: ProfileChangeHistory = {
      id: `change_${Date.now()}_${Math.random()}`,
      userId: this.currentProfile.id,
      timestamp: Date.now(),
      deviceInfo: 'Mobile App',
      ...change,
    };

    this.changeHistory.push(changeRecord);
    await this.saveChangeHistory([changeRecord]);
  }

  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'deviceInfo'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      deviceInfo: 'Mobile App',
      ...event,
    };

    this.securityEvents.push(securityEvent);
    
    // Keep only last 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(-100);
    }
    
    await this.saveSecurityEvents();
  }

  /**
   * Storage methods
   */
  private async loadProfile(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.currentProfile = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  private async saveProfile(): Promise<void> {
    if (!this.currentProfile) return;
    
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.currentProfile));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  private async loadChangeHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.changeHistoryKey);
      if (stored) {
        this.changeHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load change history:', error);
    }
  }

  private async saveChangeHistory(newChanges: ProfileChangeHistory[]): Promise<void> {
    try {
      this.changeHistory.push(...newChanges);
      // Keep only last 1000 changes
      if (this.changeHistory.length > 1000) {
        this.changeHistory = this.changeHistory.slice(-1000);
      }
      await AsyncStorage.setItem(this.changeHistoryKey, JSON.stringify(this.changeHistory));
    } catch (error) {
      console.error('Failed to save change history:', error);
    }
  }

  private async loadRecommendations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.recommendationsKey);
      if (stored) {
        this.recommendations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }

  private async saveRecommendations(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.recommendationsKey, JSON.stringify(this.recommendations));
    } catch (error) {
      console.error('Failed to save recommendations:', error);
    }
  }

  private async loadSecurityEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.securityEventsKey);
      if (stored) {
        this.securityEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load security events:', error);
    }
  }

  private async saveSecurityEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.securityEventsKey, JSON.stringify(this.securityEvents));
    } catch (error) {
      console.error('Failed to save security events:', error);
    }
  }
}

export default new ProfileService();
