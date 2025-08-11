/**
 * Navigation Constants and Configuration
 * Centralized navigation settings and theme configuration
 */

import {
  NavigationTheme,
  TabBarConfig,
  DeepLinkConfig,
} from '../types/navigation';

// Navigation Theme Configuration
export const NAVIGATION_THEME: NavigationTheme = {
  dark: false,
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E5E5E7',
    notification: '#FF3B30',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#007AFF',
    tabBackground: '#FFFFFF',
  },
};

export const DARK_NAVIGATION_THEME: NavigationTheme = {
  dark: true,
  colors: {
    primary: '#0A84FF',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#38383A',
    notification: '#FF453A',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#0A84FF',
    tabBackground: '#1C1C1E',
  },
};

// Tab Bar Configuration
export const TAB_BAR_CONFIG: TabBarConfig = {
  activeTintColor: '#007AFF',
  inactiveTintColor: '#8E8E93',
  backgroundColor: '#FFFFFF',
  borderTopColor: '#E5E5E7',
  showLabel: true,
  labelStyle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  iconStyle: {
    marginBottom: 4,
  },
  tabStyle: {
    paddingVertical: 8,
  },
  style: {
    height: 84,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
  },
};

// Screen Options Configuration
export const SCREEN_OPTIONS = {
  headerShown: true,
  headerBackTitleVisible: false,
  headerTitleAlign: 'center' as const,
  headerStyle: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitleStyle: {
    fontSize: 17,
    fontWeight: '600' as any,
    color: '#000000',
  },
  headerTintColor: '#007AFF',
  gestureEnabled: true,
  animation: 'slide_from_right' as const,
};

// Tab Screen Options
export const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarActiveTintColor: TAB_BAR_CONFIG.activeTintColor,
  tabBarInactiveTintColor: TAB_BAR_CONFIG.inactiveTintColor,
  tabBarStyle: TAB_BAR_CONFIG.style,
  tabBarLabelStyle: TAB_BAR_CONFIG.labelStyle,
  tabBarIconStyle: TAB_BAR_CONFIG.iconStyle,
};

// Deep Link Configuration
export const DEEP_LINK_CONFIG = {
  screens: {
    Auth: {
      screens: {
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot-password',
        ResetPassword: 'reset-password/:token',
      },
    },
    Main: {
      screens: {
        Dashboard: {
          screens: {
            DashboardHome: 'dashboard',
            NetWorth: 'net-worth',
          },
        },
        Goals: {
          screens: {
            GoalsList: 'goals',
            GoalDetails: 'goals/:goalId',
            CreateGoal: 'goals/create',
          },
        },
        Scenarios: {
          screens: {
            ScenariosList: 'scenarios',
            ScenarioDetails: 'scenarios/:scenarioId',
            CreateScenario: 'scenarios/create',
          },
        },
      },
    },
  },
};

// Navigation Timing Constants
export const NAVIGATION_TIMING = {
  TRANSITION_DURATION: 300,
  TAB_PRESS_DELAY: 150,
  GESTURE_RESPONSE_DISTANCE: 50,
  SWIPE_VELOCITY_THRESHOLD: 500,
};

// Screen Names Constants
export const SCREEN_NAMES = {
  // Auth Screens
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  BIOMETRIC_SETUP: 'BiometricSetup',

  // Main Tab Screens
  DASHBOARD: 'Dashboard',
  ACCOUNTS: 'Accounts',
  GOALS: 'Goals',
  SCENARIOS: 'Scenarios',
  SETTINGS: 'Settings',

  // Dashboard Stack
  DASHBOARD_HOME: 'DashboardHome',
  NET_WORTH: 'NetWorth',
  PROGRESS_OVERVIEW: 'ProgressOverview',
  QUICK_ACTIONS: 'QuickActions',

  // Accounts Stack
  ACCOUNTS_LIST: 'AccountsList',
  ACCOUNT_DETAILS: 'AccountDetails',
  ADD_ACCOUNT: 'AddAccount',
  EDIT_ACCOUNT: 'EditAccount',
  ACCOUNT_HISTORY: 'AccountHistory',
  IMPORT_ACCOUNTS: 'ImportAccounts',

  // Goals Stack
  GOALS_LIST: 'GoalsList',
  GOAL_DETAILS: 'GoalDetails',
  CREATE_GOAL: 'CreateGoal',
  EDIT_GOAL: 'EditGoal',
  GOAL_PROGRESS: 'GoalProgress',
  GOAL_CALCULATOR: 'GoalCalculator',
  GOAL_TEMPLATES: 'GoalTemplates',

  // Scenarios Stack
  SCENARIOS_LIST: 'ScenariosList',
  SCENARIO_DETAILS: 'ScenarioDetails',
  CREATE_SCENARIO: 'CreateScenario',
  EDIT_SCENARIO: 'EditScenario',
  SCENARIO_COMPARISON: 'ScenarioComparison',
  STRESS_TEST: 'StressTest',
  SCENARIO_TEMPLATES: 'ScenarioTemplates',

  // Settings Stack
  SETTINGS_HOME: 'SettingsHome',
  PROFILE: 'Profile',
  SECURITY: 'Security',
  NOTIFICATIONS: 'Notifications',
  PRIVACY: 'Privacy',
  DATA_EXPORT: 'DataExport',
  ABOUT: 'About',
  HELP: 'Help',
  FEEDBACK: 'Feedback',

  // Modal Screens
  QUICK_ADD: 'QuickAdd',
  CALCULATOR: 'Calculator',
  SHARE_GOAL: 'ShareGoal',
  SHARE_SCENARIO: 'ShareScenario',
  ONBOARDING: 'Onboarding',
  TUTORIAL: 'Tutorial',
} as const;

// Tab Icons Configuration
export const TAB_ICONS = {
  [SCREEN_NAMES.DASHBOARD]: {
    focused: 'home',
    unfocused: 'home-outline',
    library: 'Ionicons',
  },
  [SCREEN_NAMES.ACCOUNTS]: {
    focused: 'wallet',
    unfocused: 'wallet-outline',
    library: 'Ionicons',
  },
  [SCREEN_NAMES.GOALS]: {
    focused: 'target',
    unfocused: 'target-outline',
    library: 'Ionicons',
  },
  [SCREEN_NAMES.SCENARIOS]: {
    focused: 'analytics',
    unfocused: 'analytics-outline',
    library: 'Ionicons',
  },
  [SCREEN_NAMES.SETTINGS]: {
    focused: 'settings',
    unfocused: 'settings-outline',
    library: 'Ionicons',
  },
} as const;

// Navigation State Persistence
export const NAVIGATION_PERSISTENCE_KEY = 'DRISHTI_NAVIGATION_STATE';

// Navigation Analytics Events
export const NAVIGATION_EVENTS = {
  SCREEN_VIEW: 'screen_view',
  TAB_PRESS: 'tab_press',
  NAVIGATION_ACTION: 'navigation_action',
  DEEP_LINK_OPEN: 'deep_link_open',
  BACK_BUTTON_PRESS: 'back_button_press',
} as const;

// Accessibility Labels
export const ACCESSIBILITY_LABELS = {
  TAB_DASHBOARD: 'Dashboard tab',
  TAB_ACCOUNTS: 'Accounts tab',
  TAB_GOALS: 'Goals tab',
  TAB_SCENARIOS: 'Scenarios tab',
  TAB_SETTINGS: 'Settings tab',
  BACK_BUTTON: 'Go back',
  CLOSE_BUTTON: 'Close',
  MENU_BUTTON: 'Open menu',
} as const;

// Navigation Gestures Configuration
export const GESTURE_CONFIG = {
  SWIPE_THRESHOLD: 50,
  SWIPE_VELOCITY_THRESHOLD: 500,
  EDGE_WIDTH: 20,
  RESPONSE_DISTANCE: 50,
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  LAZY_LOADING: true,
  PRELOAD_ADJACENT_SCREENS: true,
  ANIMATION_ENABLED: true,
  GESTURE_HANDLER_ENABLED: true,
} as const;
