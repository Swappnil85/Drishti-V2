/**
 * EnhancedProgressService
 * Social comparison and progress sharing capabilities
 * Epic 8, Enhanced Acceptance Criteria for Progress Tracking
 */

import { FinancialGoal, FIREGoalProgress } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SocialComparison {
  userPercentile: number; // 0-100
  demographicGroup: {
    ageRange: string;
    incomeRange: string;
    location: string;
    familyStatus: string;
  };
  benchmarkMetrics: {
    averageProgress: number;
    averageSavingsRate: number;
    averageTimeToFIRE: number;
    topPerformerProgress: number;
  };
  insights: string[];
  motivationalMessages: string[];
  improvementSuggestions: string[];
}

export interface ProgressSharingConfig {
  enabled: boolean;
  platforms: Array<'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'custom'>;
  privacyLevel: 'public' | 'friends' | 'private_group';
  shareFrequency: 'milestone_only' | 'monthly' | 'quarterly' | 'manual';
  contentSettings: {
    includeSpecificAmounts: boolean;
    includePercentageProgress: boolean;
    includeTimeline: boolean;
    includeMotivationalQuote: boolean;
    customMessage?: string;
  };
  privacyControls: {
    allowComments: boolean;
    allowScreenshots: boolean;
    hideFromSearch: boolean;
    restrictToFollowers: boolean;
  };
}

export interface SharedProgressPost {
  id: string;
  goalId: string;
  timestamp: string;
  platform: string;
  content: {
    title: string;
    description: string;
    progressPercentage?: number;
    milestone?: string;
    image?: string; // Base64 or URL
    hashtags: string[];
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  privacyLevel: ProgressSharingConfig['privacyLevel'];
}

export interface AnonymousBenchmark {
  category: 'age_group' | 'income_bracket' | 'family_status' | 'location' | 'career_field';
  value: string;
  metrics: {
    participantCount: number;
    averageProgress: number;
    medianProgress: number;
    topQuartileProgress: number;
    averageSavingsRate: number;
    averageTimeToFIRE: number;
  };
  trends: {
    monthlyGrowth: number;
    yearlyGrowth: number;
    seasonalPatterns: Array<{
      month: number;
      averageProgress: number;
    }>;
  };
}

export class EnhancedProgressService {
  private static instance: EnhancedProgressService;
  private readonly SOCIAL_STORAGE_KEY = 'social_comparison_data';
  private readonly SHARING_STORAGE_KEY = 'progress_sharing_config';
  private readonly POSTS_STORAGE_KEY = 'shared_progress_posts';
  private readonly BENCHMARKS_STORAGE_KEY = 'anonymous_benchmarks';

  private constructor() {}

  public static getInstance(): EnhancedProgressService {
    if (!EnhancedProgressService.instance) {
      EnhancedProgressService.instance = new EnhancedProgressService();
    }
    return EnhancedProgressService.instance;
  }

  /**
   * Get social comparison data for anonymous benchmarking
   */
  public async getSocialComparison(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    userProfile: {
      age: number;
      income: number;
      location: string;
      familyStatus: string;
    }
  ): Promise<SocialComparison> {
    // Determine demographic group
    const demographicGroup = {
      ageRange: this.getAgeRange(userProfile.age),
      incomeRange: this.getIncomeRange(userProfile.income),
      location: userProfile.location,
      familyStatus: userProfile.familyStatus,
    };

    // Get benchmark data for this demographic
    const benchmarks = await this.getBenchmarkData(demographicGroup);
    
    // Calculate user's percentile
    const userPercentile = this.calculatePercentile(progress.progressPercentage, benchmarks);

    // Generate insights and suggestions
    const insights = this.generateSocialInsights(progress, benchmarks, userPercentile);
    const motivationalMessages = this.generateMotivationalMessages(userPercentile, benchmarks);
    const improvementSuggestions = this.generateImprovementSuggestions(progress, benchmarks);

    return {
      userPercentile,
      demographicGroup,
      benchmarkMetrics: benchmarks,
      insights,
      motivationalMessages,
      improvementSuggestions,
    };
  }

  /**
   * Configure progress sharing settings
   */
  public async configureProgressSharing(
    goalId: string,
    config: ProgressSharingConfig
  ): Promise<boolean> {
    try {
      const existingConfigs = await this.getSharingConfigs();
      existingConfigs[goalId] = config;
      
      await AsyncStorage.setItem(
        this.SHARING_STORAGE_KEY,
        JSON.stringify(existingConfigs)
      );

      return true;
    } catch (error) {
      console.error('Failed to configure progress sharing:', error);
      return false;
    }
  }

  /**
   * Share progress to social media platforms
   */
  public async shareProgress(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    platform: ProgressSharingConfig['platforms'][0],
    customMessage?: string
  ): Promise<SharedProgressPost> {
    const config = await this.getSharingConfig(goal.id);
    
    if (!config?.enabled) {
      throw new Error('Progress sharing is not enabled for this goal');
    }

    // Generate share content
    const content = this.generateShareContent(goal, progress, config, customMessage);
    
    // Create post record
    const post: SharedProgressPost = {
      id: this.generateId(),
      goalId: goal.id,
      timestamp: new Date().toISOString(),
      platform,
      content,
      engagement: { likes: 0, comments: 0, shares: 0 },
      privacyLevel: config.privacyLevel,
    };

    // Store post record
    await this.storeSharedPost(post);

    // In real implementation, would integrate with social media APIs
    console.log('Sharing to', platform, ':', content);

    return post;
  }

  /**
   * Get anonymous benchmark data for comparison
   */
  public async getAnonymousBenchmarks(
    category: AnonymousBenchmark['category'],
    value: string
  ): Promise<AnonymousBenchmark> {
    // In real implementation, would fetch from secure analytics service
    const mockBenchmark: AnonymousBenchmark = {
      category,
      value,
      metrics: {
        participantCount: this.getMockParticipantCount(category),
        averageProgress: this.getMockAverageProgress(category, value),
        medianProgress: this.getMockMedianProgress(category, value),
        topQuartileProgress: this.getMockTopQuartileProgress(category, value),
        averageSavingsRate: this.getMockAverageSavingsRate(category, value),
        averageTimeToFIRE: this.getMockAverageTimeToFIRE(category, value),
      },
      trends: {
        monthlyGrowth: Math.random() * 2 - 1, // -1% to +1%
        yearlyGrowth: Math.random() * 10 + 5, // 5% to 15%
        seasonalPatterns: this.generateSeasonalPatterns(),
      },
    };

    return mockBenchmark;
  }

  /**
   * Generate progress sharing content with privacy controls
   */
  public generateShareContent(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    config: ProgressSharingConfig,
    customMessage?: string
  ): SharedProgressPost['content'] {
    const { contentSettings } = config;
    
    let title = customMessage || this.getDefaultShareTitle(progress);
    let description = this.getShareDescription(goal, progress, contentSettings);
    
    // Apply privacy controls
    if (!contentSettings.includeSpecificAmounts) {
      description = description.replace(/\$[\d,]+/g, '[Amount Hidden]');
    }

    const hashtags = this.generateHashtags(goal, progress);

    return {
      title,
      description,
      progressPercentage: contentSettings.includePercentageProgress ? progress.progressPercentage : undefined,
      milestone: this.getCurrentMilestone(progress),
      hashtags,
    };
  }

  /**
   * Get sharing history and engagement metrics
   */
  public async getSharingHistory(goalId: string): Promise<SharedProgressPost[]> {
    try {
      const postsData = await AsyncStorage.getItem(this.POSTS_STORAGE_KEY);
      if (!postsData) return [];

      const allPosts: SharedProgressPost[] = JSON.parse(postsData);
      return allPosts
        .filter(post => post.goalId === goalId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get sharing history:', error);
      return [];
    }
  }

  // Private helper methods

  private getAgeRange(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  private getIncomeRange(income: number): string {
    if (income < 50000) return '<$50K';
    if (income < 75000) return '$50K-$75K';
    if (income < 100000) return '$75K-$100K';
    if (income < 150000) return '$100K-$150K';
    return '$150K+';
  }

  private async getBenchmarkData(demographicGroup: SocialComparison['demographicGroup']): Promise<SocialComparison['benchmarkMetrics']> {
    // Mock benchmark data - in real implementation would come from secure analytics
    return {
      averageProgress: 35 + Math.random() * 20, // 35-55%
      averageSavingsRate: 0.15 + Math.random() * 0.15, // 15-30%
      averageTimeToFIRE: 20 + Math.random() * 15, // 20-35 years
      topPerformerProgress: 75 + Math.random() * 20, // 75-95%
    };
  }

  private calculatePercentile(userProgress: number, benchmarks: SocialComparison['benchmarkMetrics']): number {
    // Simplified percentile calculation
    if (userProgress >= benchmarks.topPerformerProgress) return 95;
    if (userProgress >= benchmarks.averageProgress * 1.5) return 80;
    if (userProgress >= benchmarks.averageProgress) return 60;
    if (userProgress >= benchmarks.averageProgress * 0.7) return 40;
    return 20;
  }

  private generateSocialInsights(
    progress: FIREGoalProgress,
    benchmarks: SocialComparison['benchmarkMetrics'],
    percentile: number
  ): string[] {
    const insights = [];

    if (percentile >= 80) {
      insights.push(`You're in the top ${100 - percentile}% of FIRE savers in your demographic!`);
    } else if (percentile >= 60) {
      insights.push('You\'re ahead of the average FIRE saver in your group.');
    } else {
      insights.push('There\'s room to catch up with your peer group.');
    }

    if (progress.progressPercentage > benchmarks.averageProgress) {
      const difference = progress.progressPercentage - benchmarks.averageProgress;
      insights.push(`You're ${difference.toFixed(1)}% ahead of the average progress.`);
    }

    return insights;
  }

  private generateMotivationalMessages(percentile: number, benchmarks: SocialComparison['benchmarkMetrics']): string[] {
    const messages = [];

    if (percentile >= 80) {
      messages.push('🎉 You\'re crushing your FIRE goals!');
      messages.push('💪 Keep up the excellent momentum!');
    } else if (percentile >= 60) {
      messages.push('📈 You\'re on a great trajectory!');
      messages.push('🎯 Stay focused on your goals!');
    } else {
      messages.push('🚀 Every step forward counts!');
      messages.push('💡 Small improvements lead to big results!');
    }

    return messages;
  }

  private generateImprovementSuggestions(
    progress: FIREGoalProgress,
    benchmarks: SocialComparison['benchmarkMetrics']
  ): string[] {
    const suggestions = [];

    if (progress.progressPercentage < benchmarks.averageProgress) {
      suggestions.push('Consider increasing your savings rate to match your peer group');
      suggestions.push('Review your investment allocation for potential optimization');
    }

    if (progress.velocityTrend < 0) {
      suggestions.push('Your progress has slowed - consider reviewing your strategy');
    }

    return suggestions;
  }

  private async getSharingConfigs(): Promise<Record<string, ProgressSharingConfig>> {
    try {
      const data = await AsyncStorage.getItem(this.SHARING_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get sharing configs:', error);
      return {};
    }
  }

  private async getSharingConfig(goalId: string): Promise<ProgressSharingConfig | null> {
    const configs = await this.getSharingConfigs();
    return configs[goalId] || null;
  }

  private getDefaultShareTitle(progress: FIREGoalProgress): string {
    if (progress.progressPercentage >= 75) {
      return '🔥 FIRE Goal Update: Almost There!';
    } else if (progress.progressPercentage >= 50) {
      return '📈 FIRE Journey: Halfway Milestone!';
    } else if (progress.progressPercentage >= 25) {
      return '🎯 FIRE Progress: Quarter Way There!';
    } else {
      return '🚀 Starting My FIRE Journey!';
    }
  }

  private getShareDescription(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    settings: ProgressSharingConfig['contentSettings']
  ): string {
    let description = `Making progress on my FIRE goal! `;

    if (settings.includePercentageProgress) {
      description += `Currently at ${progress.progressPercentage.toFixed(1)}% `;
    }

    if (settings.includeTimeline) {
      description += `with ${progress.estimatedTimeRemaining} months to go. `;
    }

    if (settings.includeSpecificAmounts) {
      description += `Target: $${goal.target_amount.toLocaleString()}, Current: $${goal.current_amount.toLocaleString()}. `;
    }

    if (settings.includeMotivationalQuote) {
      const quotes = [
        'Financial independence is freedom! 💪',
        'Every dollar saved is a step closer to freedom! 🎯',
        'Building wealth one day at a time! 📈',
        'The journey to FIRE continues! 🔥',
      ];
      description += quotes[Math.floor(Math.random() * quotes.length)];
    }

    return description.trim();
  }

  private generateHashtags(goal: FinancialGoal, progress: FIREGoalProgress): string[] {
    const hashtags = ['#FIRE', '#FinancialIndependence', '#WealthBuilding'];

    if (progress.progressPercentage >= 50) {
      hashtags.push('#HalfwayThere');
    }

    if (goal.goal_type.includes('lean')) {
      hashtags.push('#LeanFIRE');
    } else if (goal.goal_type.includes('fat')) {
      hashtags.push('#FatFIRE');
    }

    hashtags.push('#PersonalFinance', '#Investing', '#RetirementPlanning');

    return hashtags;
  }

  private getCurrentMilestone(progress: FIREGoalProgress): string | undefined {
    const percentage = progress.progressPercentage;
    
    if (percentage >= 100) return '🎉 Goal Achieved!';
    if (percentage >= 75) return '🔥 75% Complete';
    if (percentage >= 50) return '📈 Halfway There';
    if (percentage >= 25) return '🎯 Quarter Complete';
    if (percentage >= 10) return '🚀 10% Milestone';
    
    return undefined;
  }

  private async storeSharedPost(post: SharedProgressPost): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(this.POSTS_STORAGE_KEY);
      const posts = existingData ? JSON.parse(existingData) : [];
      
      posts.push(post);
      
      // Keep only recent posts (last 50)
      const recentPosts = posts.slice(-50);
      await AsyncStorage.setItem(this.POSTS_STORAGE_KEY, JSON.stringify(recentPosts));
    } catch (error) {
      console.error('Failed to store shared post:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getMockParticipantCount(category: AnonymousBenchmark['category']): number {
    const baseCounts = {
      age_group: 5000,
      income_bracket: 3000,
      family_status: 4000,
      location: 2000,
      career_field: 1500,
    };
    return baseCounts[category] + Math.floor(Math.random() * 1000);
  }

  private getMockAverageProgress(category: AnonymousBenchmark['category'], value: string): number {
    // Different demographics have different average progress
    let base = 35;
    
    if (category === 'age_group') {
      if (value === '25-34') base = 25;
      if (value === '35-44') base = 45;
      if (value === '45-54') base = 60;
    }
    
    return base + Math.random() * 10;
  }

  private getMockMedianProgress(category: AnonymousBenchmark['category'], value: string): number {
    return this.getMockAverageProgress(category, value) * 0.85;
  }

  private getMockTopQuartileProgress(category: AnonymousBenchmark['category'], value: string): number {
    return this.getMockAverageProgress(category, value) * 1.8;
  }

  private getMockAverageSavingsRate(category: AnonymousBenchmark['category'], value: string): number {
    return 0.15 + Math.random() * 0.15; // 15-30%
  }

  private getMockAverageTimeToFIRE(category: AnonymousBenchmark['category'], value: string): number {
    return 20 + Math.random() * 15; // 20-35 years
  }

  private generateSeasonalPatterns(): AnonymousBenchmark['trends']['seasonalPatterns'] {
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      averageProgress: 30 + Math.random() * 20 + (i === 0 ? 5 : 0), // January boost
    }));
  }
}
