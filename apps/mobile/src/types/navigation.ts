/**
 * Navigation Types for Drishti Mobile App
 * Defines all navigation parameters and screen types
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Root Stack Navigator Parameters
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Modal: NavigatorScreenParams<ModalStackParamList>;
};

// Authentication Stack Parameters
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  BiometricSetup: undefined;
};

// Main Tab Navigator Parameters
export type MainTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Accounts: NavigatorScreenParams<AccountsStackParamList>;
  Goals: NavigatorScreenParams<GoalsStackParamList>;
  Scenarios: NavigatorScreenParams<ScenariosStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

// Dashboard Stack Parameters
export type DashboardStackParamList = {
  DashboardHome: undefined;
  NetWorth: undefined;
  ProgressOverview: undefined;
  QuickActions: undefined;
};

// Accounts Stack Parameters
export type AccountsStackParamList = {
  AccountsList: undefined;
  AccountDetails: { accountId: string };
  AddAccount: undefined;
  EditAccount: { accountId: string };
  AccountHistory: { accountId: string };
  ImportAccounts: undefined;
};

// Goals Stack Parameters
export type GoalsStackParamList = {
  GoalsList: undefined;
  GoalDetails: { goalId: string };
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalProgress: { goalId: string };
  GoalCalculator: undefined;
  GoalTemplates: undefined;
};

// Scenarios Stack Parameters
export type ScenariosStackParamList = {
  ScenariosList: undefined;
  ScenarioDetails: { scenarioId: string };
  CreateScenario: undefined;
  EditScenario: { scenarioId: string };
  ScenarioComparison: { scenarioIds: string[] };
  StressTest: { scenarioId: string };
  ScenarioTemplates: undefined;
};

// Settings Stack Parameters
export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  Security: undefined;
  Notifications: undefined;
  Privacy: undefined;
  DataExport: undefined;
  About: undefined;
  Help: undefined;
  Feedback: undefined;
};

// Modal Stack Parameters
export type ModalStackParamList = {
  QuickAdd: { type: 'account' | 'goal' | 'transaction' };
  Calculator: { type: 'fire' | 'savings' | 'compound' };
  ShareGoal: { goalId: string };
  ShareScenario: { scenarioId: string };
  Onboarding: undefined;
  Tutorial: { screen: string };
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type DashboardStackScreenProps<T extends keyof DashboardStackParamList> =
  NativeStackScreenProps<DashboardStackParamList, T>;

export type AccountsStackScreenProps<T extends keyof AccountsStackParamList> =
  NativeStackScreenProps<AccountsStackParamList, T>;

export type GoalsStackScreenProps<T extends keyof GoalsStackParamList> =
  NativeStackScreenProps<GoalsStackParamList, T>;

export type ScenariosStackScreenProps<T extends keyof ScenariosStackParamList> =
  NativeStackScreenProps<ScenariosStackParamList, T>;

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> =
  NativeStackScreenProps<SettingsStackParamList, T>;

export type ModalStackScreenProps<T extends keyof ModalStackParamList> =
  NativeStackScreenProps<ModalStackParamList, T>;

// Navigation State Types
export interface NavigationState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  currentTab: keyof MainTabParamList;
  navigationHistory: string[];
}

// Deep Link Types
export interface DeepLinkParams {
  screen: string;
  params?: Record<string, any>;
  initial?: boolean;
}

export interface DeepLinkConfig {
  screens: {
    Auth: {
      screens: {
        Login: 'login';
        Register: 'register';
        ForgotPassword: 'forgot-password';
        ResetPassword: 'reset-password/:token';
      };
    };
    Main: {
      screens: {
        Dashboard: {
          screens: {
            DashboardHome: 'dashboard';
            NetWorth: 'net-worth';
          };
        };
        Goals: {
          screens: {
            GoalsList: 'goals';
            GoalDetails: 'goals/:goalId';
            CreateGoal: 'goals/create';
          };
        };
        Scenarios: {
          screens: {
            ScenariosList: 'scenarios';
            ScenarioDetails: 'scenarios/:scenarioId';
            CreateScenario: 'scenarios/create';
          };
        };
      };
    };
  };
}

// Navigation Theme Types
export interface NavigationTheme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    tabIconDefault: string;
    tabIconSelected: string;
    tabBackground: string;
  };
}

// Tab Bar Configuration
export interface TabBarConfig {
  activeTintColor: string;
  inactiveTintColor: string;
  backgroundColor: string;
  borderTopColor: string;
  showLabel: boolean;
  labelStyle: object;
  iconStyle: object;
  tabStyle: object;
  style: object;
}

// Navigation Analytics
export interface NavigationAnalytics {
  screenName: string;
  previousScreen?: string;
  timestamp: number;
  duration?: number;
  params?: Record<string, any>;
}

// Export navigation utilities
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
