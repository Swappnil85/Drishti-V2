/**
 * EnhancedMilestoneService
 * Custom milestones, rewards system, and community celebrations
 * Epic 8, Enhanced Acceptance Criteria for Milestone Features
 */

import { FinancialGoal, FIREGoalProgress } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomMilestone {
  id: string;
  goalId: string;
  name: string;
  description: string;
  type: 'amount' | 'percentage' | 'time_based' | 'savings_rate' | 'custom';
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  completedDate?: string;
  significance: 'personal' | 'financial' | 'motivational';
  category: 'first_milestone' | 'major_achievement' | 'personal_goal' | 'time_milestone';
  
  // Celebration settings
  celebrationConfig: {
    enableNotification: boolean;
    enableAnimation: boolean;
    enableSharing: boolean;
    customMessage?: string;
    rewardType?: 'badge' | 'achievement' | 'virtual_gift' | 'real_reward';
  };
  
  // Progress tracking
  createdDate: string;
  estimatedCompletionDate?: string;
  progressHistory: Array<{
    date: string;
    value: number;
    note?: string;
  }>;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'progress' | 'consistency' | 'achievement' | 'community' | 'special';
  
  // Unlock criteria
  unlockCriteria: {
    type: 'milestone_reached' | 'streak_achieved' | 'goal_completed' | 'community_participation' | 'time_based';
    value: number;
    description: string;
  };
  
  // Metadata
  earnedDate?: string;
  isUnlocked: boolean;
  shareCount: number;
  globalEarnCount: number; // How many users have earned this badge
}

export interface CommunityLeaderboard {
  category: 'progress_speed' | 'consistency' | 'milestone_count' | 'community_engagement';
  timeframe: 'weekly' | 'monthly' | 'quarterly' | 'all_time';
  entries: Array<{
    rank: number;
    userId: string; // Anonymous ID
    displayName: string; // Anonymous display name
    score: number;
    badge?: string;
    demographic?: {
      ageRange: string;
      location: string;
    };
  }>;
  userRank?: number;
  totalParticipants: number;
  lastUpdated: string;
}

export interface MilestoneReflection {
  milestoneId: string;
  reflectionDate: string;
  prompts: Array<{
    question: string;
    response: string;
    category: 'achievement' | 'learning' | 'gratitude' | 'future_planning';
  }>;
  mood: 'excited' | 'proud' | 'motivated' | 'grateful' | 'determined';
  keyLearnings: string[];
  nextSteps: string[];
  shareWithCommunity: boolean;
}

export interface TimeMilestone {
  id: string;
  goalId: string;
  type: 'anniversary' | 'streak' | 'consistency' | 'duration';
  name: string;
  description: string;
  targetDuration: number; // in days
  currentDuration: number;
  isCompleted: boolean;
  completedDate?: string;
  
  // Streak tracking
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    streakType: 'daily_contribution' | 'weekly_review' | 'monthly_progress' | 'goal_engagement';
    lastActivityDate: string;
  };
}

export class EnhancedMilestoneService {
  private static instance: EnhancedMilestoneService;
  private readonly CUSTOM_MILESTONES_KEY = 'custom_milestones';
  private readonly BADGES_KEY = 'achievement_badges';
  private readonly LEADERBOARD_KEY = 'community_leaderboard';
  private readonly REFLECTIONS_KEY = 'milestone_reflections';
  private readonly TIME_MILESTONES_KEY = 'time_milestones';

  private constructor() {}

  public static getInstance(): EnhancedMilestoneService {
    if (!EnhancedMilestoneService.instance) {
      EnhancedMilestoneService.instance = new EnhancedMilestoneService();
    }
    return EnhancedMilestoneService.instance;
  }

  /**
   * Create custom milestone for personal significance
   */
  public async createCustomMilestone(
    goalId: string,
    milestoneData: Omit<CustomMilestone, 'id' | 'createdDate' | 'progressHistory' | 'isCompleted' | 'currentValue'>
  ): Promise<CustomMilestone> {
    const milestone: CustomMilestone = {
      ...milestoneData,
      id: this.generateId(),
      goalId,
      createdDate: new Date().toISOString(),
      isCompleted: false,
      currentValue: 0,
      progressHistory: [],
    };

    await this.storeMilestone(milestone);
    return milestone;
  }

  /**
   * Update milestone progress and check for completion
   */
  public async updateMilestoneProgress(
    milestoneId: string,
    newValue: number,
    note?: string
  ): Promise<{ milestone: CustomMilestone; justCompleted: boolean }> {
    const milestones = await this.getCustomMilestones();
    const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
    
    if (milestoneIndex === -1) {
      throw new Error('Milestone not found');
    }

    const milestone = milestones[milestoneIndex];
    const wasCompleted = milestone.isCompleted;
    
    // Update progress
    milestone.currentValue = newValue;
    milestone.progressHistory.push({
      date: new Date().toISOString(),
      value: newValue,
      note,
    });

    // Check for completion
    const justCompleted = !wasCompleted && newValue >= milestone.targetValue;
    if (justCompleted) {
      milestone.isCompleted = true;
      milestone.completedDate = new Date().toISOString();
      
      // Award badges if applicable
      await this.checkForBadgeUnlocks(milestone);
    }

    // Update storage
    milestones[milestoneIndex] = milestone;
    await AsyncStorage.setItem(this.CUSTOM_MILESTONES_KEY, JSON.stringify(milestones));

    return { milestone, justCompleted };
  }

  /**
   * Get achievement badges for user
   */
  public async getAchievementBadges(): Promise<AchievementBadge[]> {
    try {
      const badgesData = await AsyncStorage.getItem(this.BADGES_KEY);
      if (!badgesData) {
        // Initialize with default badges
        const defaultBadges = this.createDefaultBadges();
        await AsyncStorage.setItem(this.BADGES_KEY, JSON.stringify(defaultBadges));
        return defaultBadges;
      }
      return JSON.parse(badgesData);
    } catch (error) {
      console.error('Failed to get achievement badges:', error);
      return [];
    }
  }

  /**
   * Unlock achievement badge
   */
  public async unlockBadge(badgeId: string): Promise<AchievementBadge | null> {
    try {
      const badges = await this.getAchievementBadges();
      const badgeIndex = badges.findIndex(b => b.id === badgeId);
      
      if (badgeIndex === -1 || badges[badgeIndex].isUnlocked) {
        return null;
      }

      badges[badgeIndex].isUnlocked = true;
      badges[badgeIndex].earnedDate = new Date().toISOString();
      badges[badgeIndex].globalEarnCount += 1;

      await AsyncStorage.setItem(this.BADGES_KEY, JSON.stringify(badges));
      return badges[badgeIndex];
    } catch (error) {
      console.error('Failed to unlock badge:', error);
      return null;
    }
  }

  /**
   * Get community leaderboard (anonymous)
   */
  public async getCommunityLeaderboard(
    category: CommunityLeaderboard['category'],
    timeframe: CommunityLeaderboard['timeframe']
  ): Promise<CommunityLeaderboard> {
    // In real implementation, would fetch from secure backend
    const mockLeaderboard: CommunityLeaderboard = {
      category,
      timeframe,
      entries: this.generateMockLeaderboardEntries(),
      userRank: Math.floor(Math.random() * 100) + 1,
      totalParticipants: 1000 + Math.floor(Math.random() * 5000),
      lastUpdated: new Date().toISOString(),
    };

    return mockLeaderboard;
  }

  /**
   * Create milestone reflection
   */
  public async createMilestoneReflection(
    milestoneId: string,
    reflectionData: Omit<MilestoneReflection, 'milestoneId' | 'reflectionDate'>
  ): Promise<MilestoneReflection> {
    const reflection: MilestoneReflection = {
      ...reflectionData,
      milestoneId,
      reflectionDate: new Date().toISOString(),
    };

    await this.storeReflection(reflection);
    return reflection;
  }

  /**
   * Get milestone reflection prompts
   */
  public getMilestoneReflectionPrompts(milestoneType: CustomMilestone['type']): Array<{
    question: string;
    category: MilestoneReflection['prompts'][0]['category'];
  }> {
    const basePrompts = [
      { question: 'How do you feel about reaching this milestone?', category: 'achievement' as const },
      { question: 'What did you learn during this journey?', category: 'learning' as const },
      { question: 'What are you most grateful for right now?', category: 'gratitude' as const },
      { question: 'What\'s your next focus area?', category: 'future_planning' as const },
    ];

    const typeSpecificPrompts = {
      amount: [
        { question: 'What sacrifices did you make to reach this amount?', category: 'learning' as const },
        { question: 'How has your relationship with money changed?', category: 'learning' as const },
      ],
      percentage: [
        { question: 'What percentage of your goal feels most challenging?', category: 'future_planning' as const },
      ],
      time_based: [
        { question: 'How has your consistency improved over time?', category: 'achievement' as const },
      ],
      savings_rate: [
        { question: 'What lifestyle changes helped you increase your savings rate?', category: 'learning' as const },
      ],
      custom: [
        { question: 'Why was this milestone personally significant to you?', category: 'achievement' as const },
      ],
    };

    return [...basePrompts, ...(typeSpecificPrompts[milestoneType] || [])];
  }

  /**
   * Track time-based milestones (streaks, anniversaries)
   */
  public async trackTimeMilestone(
    goalId: string,
    activityType: TimeMilestone['streakData']['streakType']
  ): Promise<TimeMilestone[]> {
    const timeMilestones = await this.getTimeMilestones(goalId);
    const today = new Date().toISOString().split('T')[0];

    // Update relevant streaks
    for (const milestone of timeMilestones) {
      if (milestone.streakData?.streakType === activityType) {
        const lastActivity = milestone.streakData.lastActivityDate.split('T')[0];
        const daysDiff = this.getDaysDifference(lastActivity, today);

        if (daysDiff === 1) {
          // Continue streak
          milestone.streakData.currentStreak += 1;
          milestone.streakData.longestStreak = Math.max(
            milestone.streakData.longestStreak,
            milestone.streakData.currentStreak
          );
        } else if (daysDiff > 1) {
          // Streak broken
          milestone.streakData.currentStreak = 1;
        }
        // If daysDiff === 0, already tracked today

        milestone.streakData.lastActivityDate = new Date().toISOString();
        milestone.currentDuration = milestone.streakData.currentStreak;

        // Check for completion
        if (!milestone.isCompleted && milestone.currentDuration >= milestone.targetDuration) {
          milestone.isCompleted = true;
          milestone.completedDate = new Date().toISOString();
        }
      }
    }

    await this.storeTimeMilestones(goalId, timeMilestones);
    return timeMilestones;
  }

  // Private helper methods

  private async getCustomMilestones(): Promise<CustomMilestone[]> {
    try {
      const data = await AsyncStorage.getItem(this.CUSTOM_MILESTONES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get custom milestones:', error);
      return [];
    }
  }

  private async storeMilestone(milestone: CustomMilestone): Promise<void> {
    try {
      const milestones = await this.getCustomMilestones();
      milestones.push(milestone);
      await AsyncStorage.setItem(this.CUSTOM_MILESTONES_KEY, JSON.stringify(milestones));
    } catch (error) {
      console.error('Failed to store milestone:', error);
    }
  }

  private async checkForBadgeUnlocks(milestone: CustomMilestone): Promise<void> {
    const badges = await this.getAchievementBadges();
    
    // Check for milestone-related badge unlocks
    for (const badge of badges) {
      if (!badge.isUnlocked && badge.unlockCriteria.type === 'milestone_reached') {
        if (milestone.significance === 'personal' && badge.id === 'first_personal_milestone') {
          await this.unlockBadge(badge.id);
        }
      }
    }
  }

  private createDefaultBadges(): AchievementBadge[] {
    return [
      {
        id: 'first_milestone',
        name: 'First Steps',
        description: 'Completed your first milestone',
        iconName: 'flag',
        color: '#28A745',
        rarity: 'common',
        category: 'progress',
        unlockCriteria: {
          type: 'milestone_reached',
          value: 1,
          description: 'Complete any milestone',
        },
        isUnlocked: false,
        shareCount: 0,
        globalEarnCount: 1250,
      },
      {
        id: 'first_personal_milestone',
        name: 'Personal Achievement',
        description: 'Created and completed a personal milestone',
        iconName: 'heart',
        color: '#DC3545',
        rarity: 'uncommon',
        category: 'achievement',
        unlockCriteria: {
          type: 'milestone_reached',
          value: 1,
          description: 'Complete a personal significance milestone',
        },
        isUnlocked: false,
        shareCount: 0,
        globalEarnCount: 850,
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintained a 30-day consistency streak',
        iconName: 'zap',
        color: '#FFC107',
        rarity: 'rare',
        category: 'consistency',
        unlockCriteria: {
          type: 'streak_achieved',
          value: 30,
          description: 'Maintain any 30-day streak',
        },
        isUnlocked: false,
        shareCount: 0,
        globalEarnCount: 420,
      },
      {
        id: 'fire_champion',
        name: 'FIRE Champion',
        description: 'Completed a FIRE goal',
        iconName: 'trophy',
        color: '#FFD700',
        rarity: 'epic',
        category: 'achievement',
        unlockCriteria: {
          type: 'goal_completed',
          value: 1,
          description: 'Complete any FIRE goal',
        },
        isUnlocked: false,
        shareCount: 0,
        globalEarnCount: 125,
      },
      {
        id: 'community_supporter',
        name: 'Community Supporter',
        description: 'Active community participant',
        iconName: 'users',
        color: '#007AFF',
        rarity: 'uncommon',
        category: 'community',
        unlockCriteria: {
          type: 'community_participation',
          value: 10,
          description: 'Participate in community features 10 times',
        },
        isUnlocked: false,
        shareCount: 0,
        globalEarnCount: 680,
      },
    ];
  }

  private generateMockLeaderboardEntries(): CommunityLeaderboard['entries'] {
    const entries = [];
    const names = ['FireSeeker', 'WealthBuilder', 'FreedomChaser', 'InvestorPro', 'SaverSupreme'];
    
    for (let i = 0; i < 10; i++) {
      entries.push({
        rank: i + 1,
        userId: `user_${i + 1}`,
        displayName: `${names[i % names.length]}${Math.floor(Math.random() * 1000)}`,
        score: 1000 - (i * 50) + Math.floor(Math.random() * 40),
        badge: i < 3 ? ['🥇', '🥈', '🥉'][i] : undefined,
        demographic: {
          ageRange: ['25-34', '35-44', '45-54'][Math.floor(Math.random() * 3)],
          location: ['US', 'CA', 'UK', 'AU'][Math.floor(Math.random() * 4)],
        },
      });
    }
    
    return entries;
  }

  private async storeReflection(reflection: MilestoneReflection): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(this.REFLECTIONS_KEY);
      const reflections = existingData ? JSON.parse(existingData) : [];
      
      reflections.push(reflection);
      await AsyncStorage.setItem(this.REFLECTIONS_KEY, JSON.stringify(reflections));
    } catch (error) {
      console.error('Failed to store reflection:', error);
    }
  }

  private async getTimeMilestones(goalId: string): Promise<TimeMilestone[]> {
    try {
      const data = await AsyncStorage.getItem(this.TIME_MILESTONES_KEY);
      const allMilestones = data ? JSON.parse(data) : {};
      return allMilestones[goalId] || [];
    } catch (error) {
      console.error('Failed to get time milestones:', error);
      return [];
    }
  }

  private async storeTimeMilestones(goalId: string, milestones: TimeMilestone[]): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.TIME_MILESTONES_KEY);
      const allMilestones = data ? JSON.parse(data) : {};
      
      allMilestones[goalId] = milestones;
      await AsyncStorage.setItem(this.TIME_MILESTONES_KEY, JSON.stringify(allMilestones));
    } catch (error) {
      console.error('Failed to store time milestones:', error);
    }
  }

  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
