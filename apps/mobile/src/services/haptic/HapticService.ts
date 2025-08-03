/**
 * Haptic Feedback Service
 * Provides contextual haptic feedback for user interactions
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HapticPattern = 
  | 'light'
  | 'medium' 
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'impact_light'
  | 'impact_medium'
  | 'impact_heavy'
  | 'notification_success'
  | 'notification_warning'
  | 'notification_error'
  | 'custom';

export type HapticContext = 
  | 'button_tap'
  | 'toggle_switch'
  | 'slider_change'
  | 'swipe_action'
  | 'pull_refresh'
  | 'navigation'
  | 'form_validation'
  | 'achievement'
  | 'milestone'
  | 'error_feedback'
  | 'success_feedback'
  | 'loading_complete'
  | 'data_update'
  | 'gesture_recognition'
  | 'modal_open'
  | 'modal_close'
  | 'tab_switch'
  | 'long_press'
  | 'double_tap';

export interface HapticConfig {
  enabled: boolean;
  intensity: number; // 0.0 to 1.0
  contextualFeedback: boolean;
  customPatterns: Record<string, HapticPattern>;
  disabledContexts: HapticContext[];
}

export interface HapticEvent {
  id: string;
  pattern: HapticPattern;
  context: HapticContext;
  timestamp: number;
  intensity?: number;
  duration?: number;
  success: boolean;
}

class HapticService {
  private config: HapticConfig;
  private events: HapticEvent[] = [];
  private isSupported = false;
  private storageKey = 'HAPTIC_CONFIG';

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeService();
  }

  /**
   * Initialize haptic service
   */
  private async initializeService() {
    try {
      // Check platform support
      this.isSupported = Platform.OS === 'ios' || Platform.OS === 'android';
      
      // Load saved configuration
      await this.loadConfig();
      
      console.log('Haptic service initialized:', {
        supported: this.isSupported,
        enabled: this.config.enabled,
      });
    } catch (error) {
      console.error('Failed to initialize haptic service:', error);
    }
  }

  /**
   * Get default haptic configuration
   */
  private getDefaultConfig(): HapticConfig {
    return {
      enabled: true,
      intensity: 0.8,
      contextualFeedback: true,
      customPatterns: {},
      disabledContexts: [],
    };
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const savedConfig = JSON.parse(stored);
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load haptic config:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  private async saveConfig() {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save haptic config:', error);
    }
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(pattern: HapticPattern, context?: HapticContext, options?: {
    intensity?: number;
    force?: boolean;
  }): Promise<boolean> {
    // Check if haptics are enabled and supported
    if (!this.isSupported || (!this.config.enabled && !options?.force)) {
      return false;
    }

    // Check if context is disabled
    if (context && this.config.disabledContexts.includes(context)) {
      return false;
    }

    const eventId = this.generateId();
    const startTime = Date.now();
    let success = false;

    try {
      // Apply intensity scaling
      const intensity = options?.intensity ?? this.config.intensity;
      
      // Execute haptic feedback based on pattern
      await this.executeHapticPattern(pattern, intensity);
      success = true;

      // Log successful haptic event
      this.logHapticEvent({
        id: eventId,
        pattern,
        context: context || 'unknown',
        timestamp: startTime,
        intensity,
        duration: Date.now() - startTime,
        success: true,
      });

      return true;
    } catch (error) {
      console.error('Haptic feedback failed:', error);
      
      // Log failed haptic event
      this.logHapticEvent({
        id: eventId,
        pattern,
        context: context || 'unknown',
        timestamp: startTime,
        intensity: options?.intensity ?? this.config.intensity,
        duration: Date.now() - startTime,
        success: false,
      });

      return false;
    }
  }

  /**
   * Execute specific haptic pattern
   */
  private async executeHapticPattern(pattern: HapticPattern, intensity: number) {
    switch (pattern) {
      case 'light':
      case 'impact_light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;

      case 'medium':
      case 'impact_medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;

      case 'heavy':
      case 'impact_heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;

      case 'success':
      case 'notification_success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;

      case 'warning':
      case 'notification_warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;

      case 'error':
      case 'notification_error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;

      case 'selection':
        await Haptics.selectionAsync();
        break;

      case 'custom':
        // Custom pattern implementation
        await this.executeCustomPattern(intensity);
        break;

      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  }

  /**
   * Execute custom haptic pattern
   */
  private async executeCustomPattern(intensity: number) {
    // Create custom pattern with multiple impacts
    const delays = [0, 100, 200];
    const impacts = [
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Medium,
      Haptics.ImpactFeedbackStyle.Light,
    ];

    for (let i = 0; i < delays.length; i++) {
      setTimeout(async () => {
        await Haptics.impactAsync(impacts[i]);
      }, delays[i]);
    }
  }

  /**
   * Contextual haptic feedback methods
   */
  async buttonTap() {
    return this.trigger('light', 'button_tap');
  }

  async toggleSwitch(isOn: boolean) {
    return this.trigger(isOn ? 'medium' : 'light', 'toggle_switch');
  }

  async sliderChange() {
    return this.trigger('selection', 'slider_change');
  }

  async swipeAction() {
    return this.trigger('medium', 'swipe_action');
  }

  async pullRefresh() {
    return this.trigger('light', 'pull_refresh');
  }

  async navigation() {
    return this.trigger('light', 'navigation');
  }

  async formValidationError() {
    return this.trigger('error', 'form_validation');
  }

  async formValidationSuccess() {
    return this.trigger('success', 'form_validation');
  }

  async achievement() {
    return this.trigger('custom', 'achievement');
  }

  async milestone() {
    return this.trigger('success', 'milestone');
  }

  async errorFeedback() {
    return this.trigger('error', 'error_feedback');
  }

  async successFeedback() {
    return this.trigger('success', 'success_feedback');
  }

  async loadingComplete() {
    return this.trigger('light', 'loading_complete');
  }

  async dataUpdate() {
    return this.trigger('selection', 'data_update');
  }

  async gestureRecognition() {
    return this.trigger('light', 'gesture_recognition');
  }

  async modalOpen() {
    return this.trigger('light', 'modal_open');
  }

  async modalClose() {
    return this.trigger('light', 'modal_close');
  }

  async tabSwitch() {
    return this.trigger('selection', 'tab_switch');
  }

  async longPress() {
    return this.trigger('medium', 'long_press');
  }

  async doubleTap() {
    return this.trigger('light', 'double_tap');
  }

  /**
   * Configuration methods
   */
  isEnabled(): boolean {
    return this.config.enabled && this.isSupported;
  }

  async setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    await this.saveConfig();
  }

  async setIntensity(intensity: number) {
    this.config.intensity = Math.max(0, Math.min(1, intensity));
    await this.saveConfig();
  }

  async setContextualFeedback(enabled: boolean) {
    this.config.contextualFeedback = enabled;
    await this.saveConfig();
  }

  async disableContext(context: HapticContext) {
    if (!this.config.disabledContexts.includes(context)) {
      this.config.disabledContexts.push(context);
      await this.saveConfig();
    }
  }

  async enableContext(context: HapticContext) {
    this.config.disabledContexts = this.config.disabledContexts.filter(c => c !== context);
    await this.saveConfig();
  }

  getConfig(): HapticConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<HapticConfig>) {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
  }

  /**
   * Analytics and monitoring
   */
  private logHapticEvent(event: HapticEvent) {
    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  getHapticStats(): {
    totalEvents: number;
    successRate: number;
    mostUsedPatterns: Array<{ pattern: HapticPattern; count: number }>;
    mostUsedContexts: Array<{ context: HapticContext; count: number }>;
    averageIntensity: number;
  } {
    const total = this.events.length;
    const successful = this.events.filter(e => e.success).length;
    const successRate = total > 0 ? successful / total : 0;

    // Count patterns
    const patternCounts: Record<HapticPattern, number> = {} as any;
    const contextCounts: Record<HapticContext, number> = {} as any;
    let totalIntensity = 0;

    this.events.forEach(event => {
      patternCounts[event.pattern] = (patternCounts[event.pattern] || 0) + 1;
      contextCounts[event.context] = (contextCounts[event.context] || 0) + 1;
      totalIntensity += event.intensity || 0;
    });

    const mostUsedPatterns = Object.entries(patternCounts)
      .map(([pattern, count]) => ({ pattern: pattern as HapticPattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const mostUsedContexts = Object.entries(contextCounts)
      .map(([context, count]) => ({ context: context as HapticContext, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const averageIntensity = total > 0 ? totalIntensity / total : 0;

    return {
      totalEvents: total,
      successRate,
      mostUsedPatterns,
      mostUsedContexts,
      averageIntensity,
    };
  }

  clearStats() {
    this.events = [];
  }

  /**
   * Utility methods
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Test haptic patterns
   */
  async testPattern(pattern: HapticPattern) {
    return this.trigger(pattern, 'unknown', { force: true });
  }

  async testAllPatterns() {
    const patterns: HapticPattern[] = [
      'light', 'medium', 'heavy', 
      'success', 'warning', 'error', 
      'selection', 'custom'
    ];

    for (let i = 0; i < patterns.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.testPattern(patterns[i]);
    }
  }
}

export default new HapticService();
