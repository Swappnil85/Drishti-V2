/**
 * Navigation Analytics Service
 * Tracks navigation events and user journey analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationState } from '@react-navigation/native';

export interface NavigationEvent {
  id: string;
  type: 'screen_view' | 'navigation' | 'deep_link' | 'back_press' | 'tab_press';
  timestamp: number;
  screenName: string;
  previousScreen?: string;
  params?: Record<string, any>;
  duration?: number;
  source?: 'tab' | 'stack' | 'modal' | 'deep_link' | 'back_button';
  metadata?: Record<string, any>;
}

export interface NavigationSession {
  id: string;
  startTime: number;
  endTime?: number;
  events: NavigationEvent[];
  totalScreens: number;
  uniqueScreens: Set<string>;
  deepLinks: number;
  backPresses: number;
}

export interface NavigationMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  mostVisitedScreens: Array<{ screen: string; count: number }>;
  averageScreenTime: Record<string, number>;
  navigationPaths: Array<{ path: string[]; count: number }>;
  dropOffPoints: Array<{ screen: string; dropOffRate: number }>;
  deepLinkUsage: Record<string, number>;
}

class NavigationAnalyticsService {
  private currentSession: NavigationSession | null = null;
  private currentScreen: string | null = null;
  private screenStartTime: number | null = null;
  private events: NavigationEvent[] = [];
  private isEnabled = true;
  private maxEvents = 1000;
  private storageKey = 'NAVIGATION_ANALYTICS';

  constructor() {
    this.loadStoredEvents();
  }

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.endSession();
    }
  }

  /**
   * Start a new navigation session
   */
  startSession(): void {
    if (!this.isEnabled) return;

    this.endSession(); // End any existing session

    this.currentSession = {
      id: this.generateId(),
      startTime: Date.now(),
      events: [],
      totalScreens: 0,
      uniqueScreens: new Set(),
      deepLinks: 0,
      backPresses: 0,
    };

    console.log('Navigation session started:', this.currentSession.id);
  }

  /**
   * End the current navigation session
   */
  endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    
    // Save session data
    this.saveSession(this.currentSession);
    
    console.log('Navigation session ended:', this.currentSession.id);
    this.currentSession = null;
    this.currentScreen = null;
    this.screenStartTime = null;
  }

  /**
   * Track screen view event
   */
  trackScreenView(screenName: string, params?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const now = Date.now();
    const previousScreen = this.currentScreen;
    let duration: number | undefined;

    // Calculate duration on previous screen
    if (this.screenStartTime && previousScreen) {
      duration = now - this.screenStartTime;
    }

    // Create navigation event
    const event: NavigationEvent = {
      id: this.generateId(),
      type: 'screen_view',
      timestamp: now,
      screenName,
      previousScreen: previousScreen || undefined,
      params: this.sanitizeParams(params),
      duration,
      source: this.determineNavigationSource(),
    };

    this.addEvent(event);

    // Update current screen tracking
    this.currentScreen = screenName;
    this.screenStartTime = now;

    // Update session data
    if (this.currentSession) {
      this.currentSession.totalScreens++;
      this.currentSession.uniqueScreens.add(screenName);
    }

    console.log('Screen view tracked:', screenName);
  }

  /**
   * Track navigation event
   */
  trackNavigation(
    from: string,
    to: string,
    source: NavigationEvent['source'],
    params?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const event: NavigationEvent = {
      id: this.generateId(),
      type: 'navigation',
      timestamp: Date.now(),
      screenName: to,
      previousScreen: from,
      params: this.sanitizeParams(params),
      source,
    };

    this.addEvent(event);
    console.log('Navigation tracked:', from, '->', to);
  }

  /**
   * Track deep link usage
   */
  trackDeepLink(url: string, screenName: string, params?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: NavigationEvent = {
      id: this.generateId(),
      type: 'deep_link',
      timestamp: Date.now(),
      screenName,
      params: this.sanitizeParams(params),
      source: 'deep_link',
      metadata: { url },
    };

    this.addEvent(event);

    // Update session data
    if (this.currentSession) {
      this.currentSession.deepLinks++;
    }

    console.log('Deep link tracked:', url, '->', screenName);
  }

  /**
   * Track back button press
   */
  trackBackPress(screenName: string): void {
    if (!this.isEnabled) return;

    const event: NavigationEvent = {
      id: this.generateId(),
      type: 'back_press',
      timestamp: Date.now(),
      screenName,
      source: 'back_button',
    };

    this.addEvent(event);

    // Update session data
    if (this.currentSession) {
      this.currentSession.backPresses++;
    }

    console.log('Back press tracked:', screenName);
  }

  /**
   * Track tab press
   */
  trackTabPress(tabName: string, previousTab?: string): void {
    if (!this.isEnabled) return;

    const event: NavigationEvent = {
      id: this.generateId(),
      type: 'tab_press',
      timestamp: Date.now(),
      screenName: tabName,
      previousScreen: previousTab,
      source: 'tab',
    };

    this.addEvent(event);
    console.log('Tab press tracked:', tabName);
  }

  /**
   * Get navigation metrics
   */
  async getMetrics(): Promise<NavigationMetrics> {
    const allEvents = await this.getAllEvents();
    
    return {
      totalSessions: await this.getTotalSessions(),
      averageSessionDuration: await this.getAverageSessionDuration(),
      mostVisitedScreens: this.getMostVisitedScreens(allEvents),
      averageScreenTime: this.getAverageScreenTime(allEvents),
      navigationPaths: this.getNavigationPaths(allEvents),
      dropOffPoints: this.getDropOffPoints(allEvents),
      deepLinkUsage: this.getDeepLinkUsage(allEvents),
    };
  }

  /**
   * Get current session info
   */
  getCurrentSession(): NavigationSession | null {
    return this.currentSession;
  }

  /**
   * Clear all analytics data
   */
  async clearData(): Promise<void> {
    this.events = [];
    this.currentSession = null;
    this.currentScreen = null;
    this.screenStartTime = null;
    
    await AsyncStorage.removeItem(this.storageKey);
    await AsyncStorage.removeItem(`${this.storageKey}_SESSIONS`);
    
    console.log('Navigation analytics data cleared');
  }

  /**
   * Add event to current session and storage
   */
  private addEvent(event: NavigationEvent): void {
    // Add to current session
    if (this.currentSession) {
      this.currentSession.events.push(event);
    }

    // Add to events array
    this.events.push(event);

    // Limit events array size
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Save to storage
    this.saveEvents();
  }

  /**
   * Determine navigation source
   */
  private determineNavigationSource(): NavigationEvent['source'] {
    // This is a simplified implementation
    // In a real app, you'd track the actual navigation source
    return 'stack';
  }

  /**
   * Sanitize parameters to remove sensitive data
   */
  private sanitizeParams(params?: Record<string, any>): Record<string, any> | undefined {
    if (!params) return undefined;

    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'email'];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save events to storage
   */
  private async saveEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save navigation events:', error);
    }
  }

  /**
   * Load events from storage
   */
  private async loadStoredEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load navigation events:', error);
    }
  }

  /**
   * Save session data
   */
  private async saveSession(session: NavigationSession): Promise<void> {
    try {
      const sessionsKey = `${this.storageKey}_SESSIONS`;
      const stored = await AsyncStorage.getItem(sessionsKey);
      const sessions = stored ? JSON.parse(stored) : [];
      
      // Convert Set to Array for serialization
      const sessionToSave = {
        ...session,
        uniqueScreens: Array.from(session.uniqueScreens),
      };
      
      sessions.push(sessionToSave);
      
      // Keep only last 100 sessions
      if (sessions.length > 100) {
        sessions.splice(0, sessions.length - 100);
      }
      
      await AsyncStorage.setItem(sessionsKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save navigation session:', error);
    }
  }

  /**
   * Get all stored events
   */
  private async getAllEvents(): Promise<NavigationEvent[]> {
    return this.events;
  }

  /**
   * Get total number of sessions
   */
  private async getTotalSessions(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(`${this.storageKey}_SESSIONS`);
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get average session duration
   */
  private async getAverageSessionDuration(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(`${this.storageKey}_SESSIONS`);
      if (!stored) return 0;
      
      const sessions = JSON.parse(stored);
      const completedSessions = sessions.filter((s: any) => s.endTime);
      
      if (completedSessions.length === 0) return 0;
      
      const totalDuration = completedSessions.reduce(
        (sum: number, session: any) => sum + (session.endTime - session.startTime),
        0
      );
      
      return totalDuration / completedSessions.length;
    } catch {
      return 0;
    }
  }

  /**
   * Get most visited screens
   */
  private getMostVisitedScreens(events: NavigationEvent[]): Array<{ screen: string; count: number }> {
    const screenCounts: Record<string, number> = {};
    
    events
      .filter(e => e.type === 'screen_view')
      .forEach(e => {
        screenCounts[e.screenName] = (screenCounts[e.screenName] || 0) + 1;
      });
    
    return Object.entries(screenCounts)
      .map(([screen, count]) => ({ screen, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get average screen time
   */
  private getAverageScreenTime(events: NavigationEvent[]): Record<string, number> {
    const screenTimes: Record<string, number[]> = {};
    
    events
      .filter(e => e.type === 'screen_view' && e.duration)
      .forEach(e => {
        if (!screenTimes[e.screenName]) {
          screenTimes[e.screenName] = [];
        }
        screenTimes[e.screenName].push(e.duration!);
      });
    
    const averages: Record<string, number> = {};
    Object.entries(screenTimes).forEach(([screen, times]) => {
      averages[screen] = times.reduce((sum, time) => sum + time, 0) / times.length;
    });
    
    return averages;
  }

  /**
   * Get common navigation paths
   */
  private getNavigationPaths(events: NavigationEvent[]): Array<{ path: string[]; count: number }> {
    const paths: Record<string, number> = {};
    const screenViews = events.filter(e => e.type === 'screen_view');
    
    // Create 3-screen paths
    for (let i = 0; i < screenViews.length - 2; i++) {
      const path = [
        screenViews[i].screenName,
        screenViews[i + 1].screenName,
        screenViews[i + 2].screenName,
      ];
      const pathKey = path.join(' -> ');
      paths[pathKey] = (paths[pathKey] || 0) + 1;
    }
    
    return Object.entries(paths)
      .map(([pathStr, count]) => ({ path: pathStr.split(' -> '), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get drop-off points
   */
  private getDropOffPoints(events: NavigationEvent[]): Array<{ screen: string; dropOffRate: number }> {
    // Simplified implementation - in reality, you'd need session end data
    const screenCounts: Record<string, number> = {};
    const lastScreens: Record<string, number> = {};
    
    events
      .filter(e => e.type === 'screen_view')
      .forEach((e, index, arr) => {
        screenCounts[e.screenName] = (screenCounts[e.screenName] || 0) + 1;
        
        // Check if this is the last screen in a sequence
        if (index === arr.length - 1 || arr[index + 1].timestamp - e.timestamp > 300000) { // 5 minutes
          lastScreens[e.screenName] = (lastScreens[e.screenName] || 0) + 1;
        }
      });
    
    return Object.entries(screenCounts)
      .map(([screen, count]) => ({
        screen,
        dropOffRate: (lastScreens[screen] || 0) / count,
      }))
      .sort((a, b) => b.dropOffRate - a.dropOffRate)
      .slice(0, 10);
  }

  /**
   * Get deep link usage statistics
   */
  private getDeepLinkUsage(events: NavigationEvent[]): Record<string, number> {
    const usage: Record<string, number> = {};
    
    events
      .filter(e => e.type === 'deep_link')
      .forEach(e => {
        const url = e.metadata?.url || 'unknown';
        usage[url] = (usage[url] || 0) + 1;
      });
    
    return usage;
  }
}

export default new NavigationAnalyticsService();
