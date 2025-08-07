import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandlingService } from '../ErrorHandlingService';

// Offline help interfaces
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category:
    | 'getting_started'
    | 'accounts'
    | 'goals'
    | 'calculations'
    | 'sync'
    | 'troubleshooting';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // minutes
  lastUpdated: number;
  version: string;
  offline: boolean;
  searchKeywords: string[];
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: TutorialStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  prerequisites: string[];
  completionRate: number;
  lastUpdated: number;
  offline: boolean;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  type: 'instruction' | 'action' | 'verification' | 'tip';
  media?: {
    type: 'image' | 'video' | 'animation';
    url: string;
    alt: string;
  };
  interactiveElements?: {
    type: 'button' | 'input' | 'selection';
    target: string;
    action: string;
  };
  completed?: boolean;
}

export interface HelpSearchResult {
  article?: HelpArticle;
  tutorial?: Tutorial;
  relevanceScore: number;
  matchedKeywords: string[];
  snippet: string;
}

export interface OfflineHelpStats {
  totalArticles: number;
  totalTutorials: number;
  completedTutorials: number;
  averageReadTime: number;
  mostViewedContent: Array<{ id: string; title: string; views: number }>;
  searchQueries: Array<{ query: string; count: number; results: number }>;
  offlineUsage: {
    totalSessions: number;
    totalTimeSpent: number; // minutes
    averageSessionDuration: number; // minutes
  };
}

/**
 * OfflineHelpService provides comprehensive offline help documentation and tutorials
 * Includes interactive tutorials, searchable help articles, and progress tracking
 */
export class OfflineHelpService {
  private static instance: OfflineHelpService;
  private errorHandler: ErrorHandlingService;
  private helpArticles: Map<string, HelpArticle> = new Map();
  private tutorials: Map<string, Tutorial> = new Map();
  private userProgress: Map<string, any> = new Map();
  private searchIndex: Map<string, string[]> = new Map();
  private isInitialized = false;

  private constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
  }

  public static getInstance(): OfflineHelpService {
    if (!OfflineHelpService.instance) {
      OfflineHelpService.instance = new OfflineHelpService();
    }
    return OfflineHelpService.instance;
  }

  /**
   * Initialize the offline help service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load help content
      await this.loadHelpContent();

      // Load user progress
      await this.loadUserProgress();

      // Build search index
      this.buildSearchIndex();

      this.isInitialized = true;
      console.log('OfflineHelpService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineHelpService:', error);
      this.errorHandler.handleError(error as Error, {
        context: 'OfflineHelpService.initialize',
        severity: 'medium',
      });
    }
  }

  /**
   * Load help content (articles and tutorials)
   */
  private async loadHelpContent(): Promise<void> {
    try {
      // Load articles
      const storedArticles = await AsyncStorage.getItem(
        'offline_help_articles'
      );
      if (storedArticles) {
        const articles: HelpArticle[] = JSON.parse(storedArticles);
        articles.forEach(article => this.helpArticles.set(article.id, article));
      } else {
        // Initialize with default content
        await this.initializeDefaultContent();
      }

      // Load tutorials
      const storedTutorials = await AsyncStorage.getItem(
        'offline_help_tutorials'
      );
      if (storedTutorials) {
        const tutorials: Tutorial[] = JSON.parse(storedTutorials);
        tutorials.forEach(tutorial =>
          this.tutorials.set(tutorial.id, tutorial)
        );
      } else {
        // Initialize with default tutorials
        await this.initializeDefaultTutorials();
      }
    } catch (error) {
      console.error('Failed to load help content:', error);
      await this.initializeDefaultContent();
      await this.initializeDefaultTutorials();
    }
  }

  /**
   * Initialize default help articles
   */
  private async initializeDefaultContent(): Promise<void> {
    const defaultArticles: HelpArticle[] = [
      {
        id: 'getting_started_basics',
        title: 'Getting Started with Drishti',
        content: `# Welcome to Drishti

Drishti is your comprehensive financial planning companion. This guide will help you get started with the basics.

## Key Features

### Account Management
- Add and manage multiple financial accounts
- Track balances across different institutions
- Categorize accounts by type (checking, savings, credit, etc.)

### Goal Setting
- Set financial goals with target amounts and dates
- Track progress towards your goals
- Get insights and recommendations

### Financial Calculations
- Compound interest calculator
- Savings goal planner
- Retirement planning tools

### Offline Functionality
- Use core features without internet connection
- Automatic sync when connection is restored
- Visual indicators for offline status

## Getting Started Steps

1. **Add Your First Account**: Start by adding your primary checking or savings account
2. **Set a Financial Goal**: Create your first savings or investment goal
3. **Explore Calculations**: Try the compound interest calculator
4. **Enable Sync**: Set up automatic data synchronization

## Need Help?
Browse other help articles or try our interactive tutorials to learn more about specific features.`,
        category: 'getting_started',
        tags: ['basics', 'introduction', 'overview'],
        difficulty: 'beginner',
        estimatedReadTime: 5,
        lastUpdated: Date.now(),
        version: '1.0',
        offline: true,
        searchKeywords: [
          'getting started',
          'basics',
          'introduction',
          'welcome',
          'overview',
          'features',
        ],
      },
      {
        id: 'offline_mode_guide',
        title: 'Using Drishti Offline',
        content: `# Offline Mode Guide

Drishti works seamlessly even when you don't have an internet connection. Here's everything you need to know about offline functionality.

## What Works Offline

### Full Functionality
- View and manage accounts
- Add, edit, and delete accounts
- Set and track financial goals
- Perform financial calculations
- View transaction history

### Visual Indicators
- Offline status indicator in the top bar
- Pending sync operations counter
- Network quality indicators
- Sync progress displays

## Offline Operations

### Data Changes
When you make changes offline, they are:
- Stored locally on your device
- Queued for synchronization
- Marked with offline indicators
- Automatically synced when online

### Conflict Resolution
If conflicts occur during sync:
- You'll be notified with clear options
- Choose between local or server data
- Smart merge suggestions available
- Bulk resolution for multiple conflicts

## Sync Process

### Automatic Sync
- Triggers when connection is restored
- Intelligent network quality detection
- Adaptive sync based on connection speed
- Background preparation for offline use

### Manual Sync
- Force sync option available
- Sync status and progress indicators
- Detailed sync analytics
- Error handling and retry logic

## Best Practices

1. **Regular Sync**: Connect to WiFi regularly for best experience
2. **Monitor Storage**: Check offline data usage in settings
3. **Resolve Conflicts**: Address sync conflicts promptly
4. **Update Regularly**: Keep the app updated for latest offline features

## Troubleshooting

### Common Issues
- **Sync Failures**: Check network connection and retry
- **Data Conflicts**: Use conflict resolution interface
- **Storage Issues**: Clear old offline data if needed
- **Performance**: Restart app if offline mode feels slow`,
        category: 'sync',
        tags: ['offline', 'sync', 'troubleshooting'],
        difficulty: 'intermediate',
        estimatedReadTime: 8,
        lastUpdated: Date.now(),
        version: '1.0',
        offline: true,
        searchKeywords: [
          'offline',
          'sync',
          'no internet',
          'connection',
          'troubleshooting',
        ],
      },
      {
        id: 'account_management_guide',
        title: 'Managing Your Accounts',
        content: `# Account Management Guide

Learn how to effectively manage your financial accounts in Drishti.

## Adding Accounts

### Manual Entry
1. Tap the "+" button on the Accounts screen
2. Choose "Create Manually"
3. Fill in account details:
   - Account name
   - Account type
   - Institution
   - Current balance
   - Currency

### Bank Integration
1. Tap "Link Bank Account"
2. Search for your bank
3. Enter your credentials securely
4. Select accounts to import
5. Confirm and sync

## Account Types

### Supported Types
- **Checking**: Daily transaction accounts
- **Savings**: Interest-bearing savings accounts
- **Credit**: Credit cards and lines of credit
- **Investment**: Brokerage and investment accounts
- **Retirement**: 401k, IRA, and pension accounts
- **Loan**: Mortgages, auto loans, student loans

## Managing Balances

### Manual Updates
- Tap the account to view details
- Use quick balance update button
- Enter new balance and save
- Changes sync automatically

### Automatic Updates
- Enable bank account linking
- Balances update automatically
- Conflict resolution for discrepancies
- Real-time sync notifications

## Account Organization

### Filtering and Sorting
- Filter by account type
- Sort by name, balance, or date
- Search across all accounts
- Custom tags for organization

### Bulk Operations
- Select multiple accounts
- Bulk balance updates
- Archive inactive accounts
- Export account data

## Security Features

### Data Protection
- Local encryption of sensitive data
- Secure bank connection protocols
- No storage of banking credentials
- Regular security updates

### Privacy Controls
- Control data sharing preferences
- Manage sync settings
- Export or delete account data
- GDPR and CCPA compliance`,
        category: 'accounts',
        tags: ['accounts', 'management', 'banking', 'security'],
        difficulty: 'beginner',
        estimatedReadTime: 10,
        lastUpdated: Date.now(),
        version: '1.0',
        offline: true,
        searchKeywords: [
          'accounts',
          'banking',
          'balance',
          'management',
          'security',
          'linking',
        ],
      },
    ];

    defaultArticles.forEach(article =>
      this.helpArticles.set(article.id, article)
    );
    await this.saveHelpArticles();
  }

  /**
   * Initialize default tutorials
   */
  private async initializeDefaultTutorials(): Promise<void> {
    const defaultTutorials: Tutorial[] = [
      {
        id: 'first_account_tutorial',
        title: 'Add Your First Account',
        description: 'Learn how to add your first financial account to Drishti',
        category: 'getting_started',
        difficulty: 'beginner',
        estimatedDuration: 3,
        prerequisites: [],
        completionRate: 0,
        lastUpdated: Date.now(),
        offline: true,
        steps: [
          {
            id: 'step_1',
            title: 'Navigate to Accounts',
            content:
              'Open the Drishti app and tap on the "Accounts" tab at the bottom of the screen.',
            type: 'instruction',
          },
          {
            id: 'step_2',
            title: 'Add New Account',
            content:
              'Tap the "+" button in the top right corner of the Accounts screen.',
            type: 'action',
            interactiveElements: {
              type: 'button',
              target: 'add_account_button',
              action: 'tap',
            },
          },
          {
            id: 'step_3',
            title: 'Choose Account Type',
            content:
              'Select "Create Manually" to add an account with your own details.',
            type: 'action',
          },
          {
            id: 'step_4',
            title: 'Enter Account Details',
            content:
              'Fill in your account information:\n- Name: Give your account a recognizable name\n- Type: Choose the appropriate account type\n- Institution: Enter your bank or financial institution\n- Balance: Enter your current account balance',
            type: 'instruction',
          },
          {
            id: 'step_5',
            title: 'Save Your Account',
            content:
              'Tap "Save" to create your account. You\'ll see it appear in your accounts list.',
            type: 'action',
          },
          {
            id: 'step_6',
            title: 'Verification',
            content:
              'Verify that your new account appears in the accounts list with the correct balance.',
            type: 'verification',
          },
        ],
      },
      {
        id: 'offline_mode_tutorial',
        title: 'Using Offline Mode',
        description:
          "Learn how to use Drishti when you don't have an internet connection",
        category: 'sync',
        difficulty: 'intermediate',
        estimatedDuration: 5,
        prerequisites: ['first_account_tutorial'],
        completionRate: 0,
        lastUpdated: Date.now(),
        offline: true,
        steps: [
          {
            id: 'step_1',
            title: 'Understanding Offline Indicators',
            content:
              'Look for the offline indicator in the top section of any screen. It shows your current connection status and any pending sync operations.',
            type: 'instruction',
          },
          {
            id: 'step_2',
            title: 'Make Changes Offline',
            content:
              'Try updating an account balance while offline. The change will be saved locally and marked for sync.',
            type: 'action',
          },
          {
            id: 'step_3',
            title: 'View Offline Queue',
            content:
              "Tap the offline indicator to see pending operations that will sync when you're back online.",
            type: 'action',
          },
          {
            id: 'step_4',
            title: 'Reconnect and Sync',
            content:
              'When you reconnect to the internet, your changes will automatically sync. Watch for the sync progress indicator.',
            type: 'instruction',
          },
          {
            id: 'step_5',
            title: 'Handle Conflicts',
            content:
              "If there are any sync conflicts, you'll see a conflict resolution interface. Choose how to resolve each conflict.",
            type: 'instruction',
          },
        ],
      },
    ];

    defaultTutorials.forEach(tutorial =>
      this.tutorials.set(tutorial.id, tutorial)
    );
    await this.saveTutorials();
  }

  /**
   * Build search index for help content
   */
  private buildSearchIndex(): void {
    this.searchIndex.clear();

    // Index articles
    for (const article of this.helpArticles.values()) {
      const keywords = [
        ...article.searchKeywords,
        ...article.tags,
        article.title.toLowerCase(),
        article.category,
      ];

      for (const keyword of keywords) {
        const existing = this.searchIndex.get(keyword) || [];
        existing.push(article.id);
        this.searchIndex.set(keyword, existing);
      }
    }

    // Index tutorials
    for (const tutorial of this.tutorials.values()) {
      const keywords = [
        tutorial.title.toLowerCase(),
        tutorial.description.toLowerCase(),
        tutorial.category,
        ...tutorial.steps.map(step => step.title.toLowerCase()),
      ];

      for (const keyword of keywords) {
        const existing = this.searchIndex.get(keyword) || [];
        existing.push(`tutorial_${tutorial.id}`);
        this.searchIndex.set(keyword, existing);
      }
    }
  }

  /**
   * Search help content
   */
  public searchHelp(query: string): HelpSearchResult[] {
    const results: HelpSearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);

    // Search articles
    for (const article of this.helpArticles.values()) {
      let relevanceScore = 0;
      const matchedKeywords: string[] = [];

      // Check title match
      if (article.title.toLowerCase().includes(queryLower)) {
        relevanceScore += 10;
        matchedKeywords.push('title');
      }

      // Check keyword matches
      for (const keyword of article.searchKeywords) {
        if (keyword.toLowerCase().includes(queryLower)) {
          relevanceScore += 5;
          matchedKeywords.push(keyword);
        }
      }

      // Check content match
      if (article.content.toLowerCase().includes(queryLower)) {
        relevanceScore += 3;
        matchedKeywords.push('content');
      }

      // Check tag matches
      for (const tag of article.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          relevanceScore += 2;
          matchedKeywords.push(tag);
        }
      }

      if (relevanceScore > 0) {
        const snippet = this.generateSnippet(article.content, queryLower);
        results.push({
          article,
          relevanceScore,
          matchedKeywords,
          snippet,
        });
      }
    }

    // Search tutorials
    for (const tutorial of this.tutorials.values()) {
      let relevanceScore = 0;
      const matchedKeywords: string[] = [];

      // Check title match
      if (tutorial.title.toLowerCase().includes(queryLower)) {
        relevanceScore += 10;
        matchedKeywords.push('title');
      }

      // Check description match
      if (tutorial.description.toLowerCase().includes(queryLower)) {
        relevanceScore += 5;
        matchedKeywords.push('description');
      }

      // Check step matches
      for (const step of tutorial.steps) {
        if (
          step.title.toLowerCase().includes(queryLower) ||
          step.content.toLowerCase().includes(queryLower)
        ) {
          relevanceScore += 3;
          matchedKeywords.push('steps');
          break;
        }
      }

      if (relevanceScore > 0) {
        const snippet = this.generateSnippet(tutorial.description, queryLower);
        results.push({
          tutorial,
          relevanceScore,
          matchedKeywords,
          snippet,
        });
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Record search query for analytics
    this.recordSearchQuery(query, results.length);

    return results.slice(0, 20); // Limit to top 20 results
  }

  /**
   * Generate content snippet for search results
   */
  private generateSnippet(content: string, query: string): string {
    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex === -1) {
      return content.substring(0, 150) + '...';
    }

    const start = Math.max(0, queryIndex - 75);
    const end = Math.min(content.length, queryIndex + query.length + 75);

    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Get help article by ID
   */
  public getHelpArticle(id: string): HelpArticle | null {
    const article = this.helpArticles.get(id);
    if (article) {
      this.recordContentView(id, 'article');
      return article;
    }
    return null;
  }

  /**
   * Get tutorial by ID
   */
  public getTutorial(id: string): Tutorial | null {
    const tutorial = this.tutorials.get(id);
    if (tutorial) {
      this.recordContentView(id, 'tutorial');
      return tutorial;
    }
    return null;
  }

  /**
   * Get help articles by category
   */
  public getHelpArticlesByCategory(category: string): HelpArticle[] {
    return Array.from(this.helpArticles.values())
      .filter(article => article.category === category)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Get tutorials by category
   */
  public getTutorialsByCategory(category: string): Tutorial[] {
    return Array.from(this.tutorials.values())
      .filter(tutorial => tutorial.category === category)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Start tutorial
   */
  public async startTutorial(tutorialId: string): Promise<boolean> {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) return false;

    // Initialize tutorial progress
    const progress = {
      tutorialId,
      startedAt: Date.now(),
      currentStep: 0,
      completedSteps: [],
      completed: false,
    };

    this.userProgress.set(`tutorial_${tutorialId}`, progress);
    await this.saveUserProgress();

    return true;
  }

  /**
   * Complete tutorial step
   */
  public async completeTutorialStep(
    tutorialId: string,
    stepId: string
  ): Promise<boolean> {
    const progressKey = `tutorial_${tutorialId}`;
    const progress = this.userProgress.get(progressKey);

    if (!progress) return false;

    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) return false;

    const stepIndex = tutorial.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return false;

    // Mark step as completed
    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
    }

    // Update current step
    progress.currentStep = Math.max(progress.currentStep, stepIndex + 1);

    // Check if tutorial is completed
    if (progress.completedSteps.length === tutorial.steps.length) {
      progress.completed = true;
      progress.completedAt = Date.now();

      // Update tutorial completion rate
      tutorial.completionRate = (tutorial.completionRate + 1) / 2; // Simplified calculation
    }

    this.userProgress.set(progressKey, progress);
    await this.saveUserProgress();

    return true;
  }

  /**
   * Get tutorial progress
   */
  public getTutorialProgress(tutorialId: string): any {
    return this.userProgress.get(`tutorial_${tutorialId}`) || null;
  }

  /**
   * Get help statistics
   */
  public async getHelpStats(): Promise<OfflineHelpStats> {
    const completedTutorials = Array.from(this.userProgress.values()).filter(
      progress => progress.completed && progress.tutorialId
    ).length;

    return {
      totalArticles: this.helpArticles.size,
      totalTutorials: this.tutorials.size,
      completedTutorials,
      averageReadTime: 5, // Would be calculated from actual usage
      mostViewedContent: [], // Would be loaded from analytics
      searchQueries: [], // Would be loaded from search analytics
      offlineUsage: {
        totalSessions: 0,
        totalTimeSpent: 0,
        averageSessionDuration: 0,
      },
    };
  }

  /**
   * Record content view for analytics
   */
  private async recordContentView(
    contentId: string,
    type: 'article' | 'tutorial'
  ): Promise<void> {
    try {
      const key = `content_views_${type}`;
      const existing = await AsyncStorage.getItem(key);
      const views = existing ? JSON.parse(existing) : {};

      views[contentId] = (views[contentId] || 0) + 1;

      await AsyncStorage.setItem(key, JSON.stringify(views));
    } catch (error) {
      console.error('Failed to record content view:', error);
    }
  }

  /**
   * Record search query for analytics
   */
  private async recordSearchQuery(
    query: string,
    resultCount: number
  ): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('search_queries');
      const queries = existing ? JSON.parse(existing) : [];

      queries.push({
        query,
        resultCount,
        timestamp: Date.now(),
      });

      // Keep only last 100 queries
      if (queries.length > 100) {
        queries.splice(0, queries.length - 100);
      }

      await AsyncStorage.setItem('search_queries', JSON.stringify(queries));
    } catch (error) {
      console.error('Failed to record search query:', error);
    }
  }

  /**
   * Load user progress from storage
   */
  private async loadUserProgress(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('help_user_progress');
      if (stored) {
        const progress = JSON.parse(stored);
        this.userProgress.clear();
        Object.entries(progress).forEach(([key, value]) => {
          this.userProgress.set(key, value);
        });
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  }

  /**
   * Save user progress to storage
   */
  private async saveUserProgress(): Promise<void> {
    try {
      const progress = Object.fromEntries(this.userProgress.entries());
      await AsyncStorage.setItem(
        'help_user_progress',
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('Failed to save user progress:', error);
    }
  }

  /**
   * Save help articles to storage
   */
  private async saveHelpArticles(): Promise<void> {
    try {
      const articles = Array.from(this.helpArticles.values());
      await AsyncStorage.setItem(
        'offline_help_articles',
        JSON.stringify(articles)
      );
    } catch (error) {
      console.error('Failed to save help articles:', error);
    }
  }

  /**
   * Save tutorials to storage
   */
  private async saveTutorials(): Promise<void> {
    try {
      const tutorials = Array.from(this.tutorials.values());
      await AsyncStorage.setItem(
        'offline_help_tutorials',
        JSON.stringify(tutorials)
      );
    } catch (error) {
      console.error('Failed to save tutorials:', error);
    }
  }

  /**
   * Get all help categories
   */
  public getHelpCategories(): string[] {
    const categories = new Set<string>();

    for (const article of this.helpArticles.values()) {
      categories.add(article.category);
    }

    for (const tutorial of this.tutorials.values()) {
      categories.add(tutorial.category);
    }

    return Array.from(categories).sort();
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.helpArticles.clear();
    this.tutorials.clear();
    this.userProgress.clear();
    this.searchIndex.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const offlineHelpService = OfflineHelpService.getInstance();
