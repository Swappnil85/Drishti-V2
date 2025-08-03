/**
 * Gesture Navigation Service
 * Advanced gesture-based navigation with customizable gestures
 */

import { Dimensions, PanResponder, PanResponderInstance } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

export interface GestureConfig {
  enabled: boolean;
  swipeBackEnabled: boolean;
  swipeBackThreshold: number;
  swipeBackVelocityThreshold: number;
  edgeSwipeEnabled: boolean;
  edgeSwipeWidth: number;
  customGestures: CustomGesture[];
}

export interface CustomGesture {
  id: string;
  name: string;
  pattern: GesturePattern;
  action: GestureAction;
  enabled: boolean;
  screens?: string[];
}

export interface GesturePattern {
  type: 'swipe' | 'pinch' | 'tap' | 'long_press' | 'double_tap';
  direction?: 'up' | 'down' | 'left' | 'right';
  fingers?: number;
  distance?: number;
  velocity?: number;
  duration?: number;
}

export interface GestureAction {
  type: 'navigate' | 'goBack' | 'openModal' | 'closeModal' | 'custom';
  target?: string;
  params?: Record<string, any>;
  callback?: () => void;
}

export interface GestureEvent {
  id: string;
  gestureId: string;
  timestamp: number;
  screenName: string;
  success: boolean;
  duration: number;
  metadata?: Record<string, any>;
}

class GestureNavigationService {
  private navigationRef: NavigationContainerRef<RootStackParamList> | null = null;
  private config: GestureConfig;
  private panResponder: PanResponderInstance | null = null;
  private gestureEvents: GestureEvent[] = [];
  private isEnabled = true;
  private currentScreen = '';

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializePanResponder();
  }

  /**
   * Set navigation reference
   */
  setNavigationRef(ref: NavigationContainerRef<RootStackParamList>) {
    this.navigationRef = ref;
  }

  /**
   * Set current screen for gesture context
   */
  setCurrentScreen(screenName: string) {
    this.currentScreen = screenName;
  }

  /**
   * Enable or disable gesture navigation
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Update gesture configuration
   */
  updateConfig(config: Partial<GestureConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): GestureConfig {
    return { ...this.config };
  }

  /**
   * Add custom gesture
   */
  addCustomGesture(gesture: CustomGesture) {
    const existingIndex = this.config.customGestures.findIndex(g => g.id === gesture.id);
    
    if (existingIndex >= 0) {
      this.config.customGestures[existingIndex] = gesture;
    } else {
      this.config.customGestures.push(gesture);
    }
  }

  /**
   * Remove custom gesture
   */
  removeCustomGesture(gestureId: string) {
    this.config.customGestures = this.config.customGestures.filter(g => g.id !== gestureId);
  }

  /**
   * Get pan responder for gesture handling
   */
  getPanResponder(): PanResponderInstance | null {
    return this.panResponder;
  }

  /**
   * Get gesture statistics
   */
  getGestureStats(): {
    totalGestures: number;
    successRate: number;
    mostUsedGestures: Array<{ gestureId: string; count: number }>;
    averageGestureDuration: number;
  } {
    const total = this.gestureEvents.length;
    const successful = this.gestureEvents.filter(e => e.success).length;
    const successRate = total > 0 ? successful / total : 0;

    // Count gesture usage
    const gestureCounts: Record<string, number> = {};
    this.gestureEvents.forEach(e => {
      gestureCounts[e.gestureId] = (gestureCounts[e.gestureId] || 0) + 1;
    });

    const mostUsed = Object.entries(gestureCounts)
      .map(([gestureId, count]) => ({ gestureId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const averageDuration = total > 0 
      ? this.gestureEvents.reduce((sum, e) => sum + e.duration, 0) / total
      : 0;

    return {
      totalGestures: total,
      successRate,
      mostUsedGestures: mostUsed,
      averageGestureDuration: averageDuration,
    };
  }

  /**
   * Clear gesture statistics
   */
  clearStats() {
    this.gestureEvents = [];
  }

  /**
   * Get default gesture configuration
   */
  private getDefaultConfig(): GestureConfig {
    const { width } = Dimensions.get('window');

    return {
      enabled: true,
      swipeBackEnabled: true,
      swipeBackThreshold: width * 0.3,
      swipeBackVelocityThreshold: 0.5,
      edgeSwipeEnabled: true,
      edgeSwipeWidth: 20,
      customGestures: [
        {
          id: 'double-tap-dashboard',
          name: 'Double Tap to Dashboard',
          pattern: {
            type: 'double_tap',
            fingers: 1,
          },
          action: {
            type: 'navigate',
            target: 'Main',
            params: { screen: 'Dashboard' },
          },
          enabled: true,
        },
        {
          id: 'swipe-up-quick-add',
          name: 'Swipe Up for Quick Add',
          pattern: {
            type: 'swipe',
            direction: 'up',
            fingers: 1,
            distance: 100,
            velocity: 0.8,
          },
          action: {
            type: 'openModal',
            target: 'QuickAdd',
          },
          enabled: true,
          screens: ['DashboardHome', 'AccountsList', 'GoalsList'],
        },
        {
          id: 'pinch-calculator',
          name: 'Pinch to Open Calculator',
          pattern: {
            type: 'pinch',
            fingers: 2,
          },
          action: {
            type: 'openModal',
            target: 'Calculator',
          },
          enabled: true,
        },
        {
          id: 'three-finger-settings',
          name: 'Three Finger Tap for Settings',
          pattern: {
            type: 'tap',
            fingers: 3,
          },
          action: {
            type: 'navigate',
            target: 'Main',
            params: { screen: 'Settings' },
          },
          enabled: false, // Disabled by default
        },
      ],
    };
  }

  /**
   * Initialize pan responder for gesture detection
   */
  private initializePanResponder() {
    let gestureStartTime = 0;
    let initialTouch = { x: 0, y: 0 };
    let lastTap = 0;
    let tapCount = 0;

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        if (!this.isEnabled || !this.config.enabled) return false;

        gestureStartTime = Date.now();
        initialTouch = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };

        // Handle edge swipe detection
        if (this.config.edgeSwipeEnabled) {
          const { width } = Dimensions.get('window');
          const isLeftEdge = evt.nativeEvent.pageX < this.config.edgeSwipeWidth;
          const isRightEdge = evt.nativeEvent.pageX > width - this.config.edgeSwipeWidth;
          
          if (isLeftEdge || isRightEdge) {
            return true;
          }
        }

        return false;
      },

      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!this.isEnabled || !this.config.enabled) return false;

        // Detect swipe gestures
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance > 10; // Minimum distance to start tracking
      },

      onPanResponderGrant: (evt, gestureState) => {
        // Gesture started
      },

      onPanResponderMove: (evt, gestureState) => {
        // Track gesture movement
      },

      onPanResponderRelease: (evt, gestureState) => {
        const duration = Date.now() - gestureStartTime;
        const { dx, dy, vx, vy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = Math.sqrt(vx * vx + vy * vy);

        // Detect gesture type and execute action
        this.processGesture({
          dx,
          dy,
          distance,
          velocity,
          duration,
          touches: evt.nativeEvent.touches?.length || 1,
          pageX: evt.nativeEvent.pageX,
          pageY: evt.nativeEvent.pageY,
        });
      },

      onPanResponderTerminate: () => {
        // Gesture was terminated
      },
    });
  }

  /**
   * Process detected gesture
   */
  private processGesture(gestureData: {
    dx: number;
    dy: number;
    distance: number;
    velocity: number;
    duration: number;
    touches: number;
    pageX: number;
    pageY: number;
  }) {
    const { dx, dy, distance, velocity, duration, touches } = gestureData;

    // Check for swipe back gesture
    if (this.config.swipeBackEnabled && this.checkSwipeBack(dx, velocity)) {
      this.executeSwipeBack();
      return;
    }

    // Check custom gestures
    for (const gesture of this.config.customGestures) {
      if (!gesture.enabled) continue;
      
      // Check if gesture is allowed on current screen
      if (gesture.screens && !gesture.screens.includes(this.currentScreen)) {
        continue;
      }

      if (this.matchesGesturePattern(gesture.pattern, gestureData)) {
        this.executeGestureAction(gesture, duration);
        return;
      }
    }
  }

  /**
   * Check if gesture matches swipe back pattern
   */
  private checkSwipeBack(dx: number, velocity: number): boolean {
    return (
      dx > this.config.swipeBackThreshold &&
      velocity > this.config.swipeBackVelocityThreshold
    );
  }

  /**
   * Execute swipe back navigation
   */
  private executeSwipeBack() {
    if (!this.navigationRef) return;

    const success = this.navigationRef.canGoBack();
    if (success) {
      this.navigationRef.goBack();
    }

    this.recordGestureEvent('swipe-back', success, 0);
  }

  /**
   * Check if gesture data matches pattern
   */
  private matchesGesturePattern(
    pattern: GesturePattern,
    gestureData: {
      dx: number;
      dy: number;
      distance: number;
      velocity: number;
      duration: number;
      touches: number;
    }
  ): boolean {
    const { dx, dy, distance, velocity, duration, touches } = gestureData;

    // Check finger count
    if (pattern.fingers && pattern.fingers !== touches) {
      return false;
    }

    switch (pattern.type) {
      case 'swipe':
        if (pattern.distance && distance < pattern.distance) return false;
        if (pattern.velocity && velocity < pattern.velocity) return false;
        
        if (pattern.direction) {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const direction = this.getSwipeDirection(angle);
          if (direction !== pattern.direction) return false;
        }
        
        return true;

      case 'tap':
        return distance < 10 && duration < 200;

      case 'double_tap':
        // Simplified double tap detection
        return distance < 10 && duration < 300;

      case 'long_press':
        const minDuration = pattern.duration || 500;
        return distance < 10 && duration >= minDuration;

      case 'pinch':
        // Pinch detection would require more complex gesture tracking
        return touches >= 2;

      default:
        return false;
    }
  }

  /**
   * Get swipe direction from angle
   */
  private getSwipeDirection(angle: number): 'up' | 'down' | 'left' | 'right' {
    const absAngle = Math.abs(angle);
    
    if (absAngle < 45) return 'right';
    if (absAngle > 135) return 'left';
    if (angle > 0) return 'down';
    return 'up';
  }

  /**
   * Execute gesture action
   */
  private executeGestureAction(gesture: CustomGesture, duration: number) {
    if (!this.navigationRef) return;

    let success = false;

    try {
      switch (gesture.action.type) {
        case 'navigate':
          if (gesture.action.target) {
            this.navigationRef.navigate(gesture.action.target as any, gesture.action.params);
            success = true;
          }
          break;

        case 'goBack':
          success = this.navigationRef.canGoBack();
          if (success) {
            this.navigationRef.goBack();
          }
          break;

        case 'openModal':
          if (gesture.action.target) {
            this.navigationRef.navigate('Modal', {
              screen: gesture.action.target,
              params: gesture.action.params,
            });
            success = true;
          }
          break;

        case 'closeModal':
          // Check if we're in a modal and can go back
          success = this.navigationRef.canGoBack();
          if (success) {
            this.navigationRef.goBack();
          }
          break;

        case 'custom':
          if (gesture.action.callback) {
            gesture.action.callback();
            success = true;
          }
          break;
      }
    } catch (error) {
      console.error('Failed to execute gesture action:', error);
      success = false;
    }

    this.recordGestureEvent(gesture.id, success, duration);
  }

  /**
   * Record gesture event for analytics
   */
  private recordGestureEvent(gestureId: string, success: boolean, duration: number) {
    const event: GestureEvent = {
      id: this.generateId(),
      gestureId,
      timestamp: Date.now(),
      screenName: this.currentScreen,
      success,
      duration,
    };

    this.gestureEvents.push(event);

    // Limit events array size
    if (this.gestureEvents.length > 1000) {
      this.gestureEvents = this.gestureEvents.slice(-1000);
    }

    console.log('Gesture executed:', gestureId, success ? 'success' : 'failed');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new GestureNavigationService();
