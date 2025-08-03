# Epic 4: Navigation & Core UI Framework - Technical Implementation Guide

## 🏗️ Architecture Overview

Epic 4 implements a comprehensive navigation system and UI framework that serves as the foundation for all user interactions in the Drishti mobile application. The architecture follows React Native best practices with TypeScript integration.

## 🔧 Technology Implementation

### Core Stack
**Technology Stack**: See [Drishti Technology Stack](../../architecture/TECH_STACK.md) for complete specifications.

### Epic 4 Specific Technologies
*Epic 4 introduces navigation and UI framework technologies*

- **React Navigation v6**: Type-safe navigation system
- **Custom Theme System**: Comprehensive theming with dark/light modes
- **Expo Haptics**: Tactile feedback integration
- **Custom Component Library**: Reusable UI components
- **Accessibility Support**: WCAG 2.1 compliance
- **Responsive Design**: Multi-screen size support

### Implementation Notes
- **Navigation**: Stack, tab, and drawer navigation patterns
- **Theming**: Consistent design system across app
- **Accessibility**: Screen reader and keyboard navigation support
- **Performance**: Optimized component rendering and navigation
- **Type Safety**: Complete TypeScript integration for navigation

## 🧭 Navigation System Implementation

### Navigation Structure

```typescript
// Main Navigation Entry Point
// src/navigation/index.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ModalNavigator from './ModalNavigator';

const RootStack = createStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={MainTabNavigator} />
        <RootStack.Screen 
          name="Modal" 
          component={ModalNavigator}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
```

### Tab Navigation Implementation

```typescript
// Bottom Tab Navigator
// src/navigation/MainTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from './stacks/DashboardNavigator';
import AccountsNavigator from './stacks/AccountsNavigator';
import GoalsNavigator from './stacks/GoalsNavigator';
import ScenariosNavigator from './stacks/ScenariosNavigator';
import SettingsNavigator from './stacks/SettingsNavigator';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardNavigator} />
      <Tab.Screen name="Accounts" component={AccountsNavigator} />
      <Tab.Screen name="Goals" component={GoalsNavigator} />
      <Tab.Screen name="Scenarios" component={ScenariosNavigator} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}
```

### Stack Navigator Pattern

```typescript
// Individual Stack Navigator
// src/navigation/stacks/AccountsNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import AccountsListScreen from '../../screens/accounts/AccountsListScreen';
import AccountDetailsScreen from '../../screens/accounts/AccountDetailsScreen';
import AddAccountScreen from '../../screens/accounts/AddAccountScreen';

const Stack = createStackNavigator();

export default function AccountsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AccountsList" component={AccountsListScreen} />
      <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
      <Stack.Screen name="AddAccount" component={AddAccountScreen} />
    </Stack.Navigator>
  );
}
```

### Navigation Context

```typescript
// Navigation Context for State Management
// src/contexts/NavigationContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface NavigationContextType {
  currentRoute: string;
  navigationHistory: string[];
  canGoBack: boolean;
  goBack: () => void;
  navigate: (route: string, params?: any) => void;
  reset: (route: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState('');
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const navigate = (route: string, params?: any) => {
    setNavigationHistory(prev => [...prev, currentRoute]);
    setCurrentRoute(route);
  };

  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previousRoute = navigationHistory[navigationHistory.length - 1];
      setCurrentRoute(previousRoute);
      setNavigationHistory(prev => prev.slice(0, -1));
    }
  };

  return (
    <NavigationContext.Provider value={{
      currentRoute,
      navigationHistory,
      canGoBack: navigationHistory.length > 0,
      goBack,
      navigate,
      reset: (route: string) => {
        setCurrentRoute(route);
        setNavigationHistory([]);
      }
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
```

## 🎨 UI Component System

### Core Component Implementation

```typescript
// Button Component with Variants
// src/components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onPress,
  children
}: ButtonProps) {
  const { theme } = useTheme();
  
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    { backgroundColor: theme.colors.primary }
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.text, { color: theme.colors.onPrimary }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#6C757D',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
});
```

### Input Component with Validation

```typescript
// Input Component with States
// src/components/ui/Input.tsx
import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  multiline = false
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles = [
    styles.input,
    {
      borderColor: error ? theme.colors.error : 
                   isFocused ? theme.colors.primary : 
                   theme.colors.border,
      backgroundColor: theme.colors.surface,
      color: theme.colors.onSurface,
    },
    disabled && styles.disabled,
  ];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={inputStyles}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        accessibilityLabel={label}
        accessibilityHint={error}
      />
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 40,
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
```

## 🌓 Theme System Implementation

### Theme Context

```typescript
// Theme Context with Dynamic Switching
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ColorPalette {
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  surface: string;
  onSurface: string;
  background: string;
  onBackground: string;
  error: string;
  onError: string;
  border: string;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ColorPalette;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const lightColors: ColorPalette = {
  primary: '#007AFF',
  onPrimary: '#FFFFFF',
  secondary: '#6C757D',
  onSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  onSurface: '#000000',
  background: '#F8F9FA',
  onBackground: '#000000',
  error: '#DC3545',
  onError: '#FFFFFF',
  border: '#E9ECEF',
};

const darkColors: ColorPalette = {
  primary: '#0A84FF',
  onPrimary: '#FFFFFF',
  secondary: '#8E8E93',
  onSecondary: '#FFFFFF',
  surface: '#1C1C1E',
  onSurface: '#FFFFFF',
  background: '#000000',
  onBackground: '#FFFFFF',
  error: '#FF453A',
  onError: '#FFFFFF',
  border: '#38383A',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    loadTheme();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setThemeState(colorScheme);
      }
    });
    return () => subscription?.remove();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setThemeState(savedTheme as 'light' | 'dark');
      } else {
        const systemTheme = Appearance.getColorScheme() || 'light';
        setThemeState(systemTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: 'light' | 'dark') => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Design System Constants

```typescript
// Design System Constants
// src/constants/design.ts
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
```

## 📱 Screen Template System

### Base Screen Template

```typescript
// Base Screen Template
// src/components/templates/ScreenTemplate.tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import Header from './Header';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

interface ScreenTemplateProps {
  title?: string;
  showHeader?: boolean;
  scrollable?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export default function ScreenTemplate({
  title,
  showHeader = true,
  scrollable = true,
  loading = false,
  error,
  onRetry,
  children
}: ScreenTemplateProps) {
  const { colors } = useTheme();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  const content = scrollable ? (
    <ScrollView style={styles.scrollView}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {showHeader && title && <Header title={title} />}
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
```

## 🔧 TypeScript Integration

### Navigation Types

```typescript
// Navigation Type Definitions
// src/types/navigation.ts
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Modal: {
    screen: string;
    params?: any;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Accounts: undefined;
  Goals: undefined;
  Scenarios: undefined;
  Settings: undefined;
};

export type AccountsStackParamList = {
  AccountsList: undefined;
  AccountDetails: {
    accountId: string;
  };
  AddAccount: undefined;
  EditAccount: {
    accountId: string;
  };
};
```

### Component Types

```typescript
// Component Type Definitions
// src/types/components.ts
export interface BaseComponentProps {
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export interface ThemeAwareProps {
  theme?: 'light' | 'dark';
}

export interface VariantProps<T extends string> {
  variant?: T;
}

export interface SizeProps<T extends string> {
  size?: T;
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';
export type InputState = 'default' | 'focused' | 'error' | 'disabled';
```

## 🚀 Performance Optimizations

### Component Memoization

```typescript
// Optimized Component with React.memo
import React, { memo } from 'react';

const OptimizedButton = memo(Button, (prevProps, nextProps) => {
  return (
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.children === nextProps.children
  );
});
```

### Navigation Performance

```typescript
// Lazy Loading for Screens
const LazyAccountsScreen = React.lazy(() => import('../screens/accounts/AccountsListScreen'));

// Screen with Suspense
function AccountsScreenWithSuspense() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LazyAccountsScreen />
    </Suspense>
  );
}
```

## 📋 Implementation Checklist

### ✅ Navigation System
- [x] Main navigation structure
- [x] Tab navigation with 5 sections
- [x] Stack navigators for each section
- [x] Modal navigation for overlays
- [x] Navigation context for state management
- [x] Deep linking support
- [x] Navigation state persistence

### ✅ UI Component Library
- [x] 10 core components implemented
- [x] Component variants and sizes
- [x] Theme integration
- [x] Accessibility support
- [x] TypeScript definitions
- [x] Performance optimizations

### ✅ Design System
- [x] Design constants defined
- [x] Theme system implemented
- [x] Color palettes for light/dark modes
- [x] Typography scale
- [x] Spacing system (8px grid)
- [x] Shadow definitions

### ✅ Template System
- [x] Screen templates
- [x] Form templates
- [x] List templates
- [x] Modal templates
- [x] Loading states
- [x] Error states
- [x] Empty states

This technical guide provides the complete implementation details for Epic 4's navigation system and UI framework, serving as a reference for developers working with the Drishti mobile application.
