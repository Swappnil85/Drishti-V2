/**
 * Theme Context and Provider
 * Manages app theme and design system
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  SIZES,
} from '../constants/design';
import { ThemeContextType } from '../types/components';

// Theme storage key
const THEME_STORAGE_KEY = 'DRISHTI_THEME_PREFERENCE';

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Props
interface ThemeProviderProps {
  children: ReactNode;
}

// Dark theme colors (override light theme colors)
const DARK_COLORS = {
  ...COLORS,
  background: {
    primary: '#121212',
    secondary: '#1E1E1E',
    tertiary: '#2D2D2D',
    inverse: '#FFFFFF',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#8A8A8A',
    inverse: '#000000',
    disabled: '#666666',
  },
  border: {
    light: '#333333',
    medium: '#555555',
    dark: '#777777',
  },
};

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system theme changes (if no manual preference)
  useEffect(() => {
    if (!isLoading) {
      checkSystemThemeChange();
    }
  }, [systemColorScheme, isLoading]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      } else {
        // Use system preference if no saved preference
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      setIsDark(systemColorScheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSystemThemeChange = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      // Only update if no manual preference is saved
      if (savedTheme === null) {
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to check system theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        newTheme ? 'dark' : 'light'
      );
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Get current colors based on theme
  const colors = isDark ? DARK_COLORS : COLORS;

  const value: ThemeContextType = {
    colors,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadows: SHADOWS,
    sizes: SIZES,
    isDark,
    toggleTheme,
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Theme Hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Theme utilities
export const createStyles = (stylesFn: (theme: ThemeContextType) => any) => {
  return (theme: ThemeContextType) => stylesFn(theme);
};

// Color utilities
export const getColorValue = (
  colors: typeof COLORS,
  color: string,
  shade?: number
): string => {
  if (color.startsWith('#')) {
    return color;
  }

  const colorParts = color.split('.');
  const colorName = colorParts[0];
  const colorShade = shade || (colorParts[1] ? parseInt(colorParts[1]) : 500);

  // @ts-ignore - Dynamic color access
  const colorGroup = colors[colorName];
  if (colorGroup && typeof colorGroup === 'object') {
    // @ts-ignore - Dynamic shade access
    return colorGroup[colorShade] || colorGroup[500] || color;
  }

  return color;
};

// Responsive utilities
export const getResponsiveValue = (value: any, screenWidth: number): any => {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const breakpoints = [
    { key: 'xl', min: 1200 },
    { key: 'lg', min: 992 },
    { key: 'md', min: 768 },
    { key: 'sm', min: 576 },
    { key: 'xs', min: 0 },
  ];

  for (const breakpoint of breakpoints) {
    if (screenWidth >= breakpoint.min) {
      const breakpointValue = (value as any)[breakpoint.key];
      if (breakpointValue !== undefined) {
        return breakpointValue;
      }
    }
  }

  // Fallback to the first available value
  const responsiveValue = value as any;
  return (
    responsiveValue.xl ||
    responsiveValue.lg ||
    responsiveValue.md ||
    responsiveValue.sm ||
    responsiveValue.xs
  );
};

// Animation utilities
export const createAnimation = (
  property: string,
  duration: number = 300,
  easing: string = 'ease-in-out'
) => {
  return {
    property,
    duration,
    easing,
  };
};

// Shadow utilities
export const createShadow = (
  elevation: number,
  color: string = '#000000',
  opacity: number = 0.1
) => {
  if (elevation === 0) {
    return SHADOWS.none;
  }

  const offset = Math.ceil(elevation / 2);
  const radius = elevation * 2;

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offset },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
};

// Typography utilities
export const createTextStyle = (
  variant: string,
  theme: ThemeContextType,
  overrides?: any
) => {
  const baseStyles = {
    h1: {
      fontSize: theme.typography.fontSize['4xl'],
      lineHeight: theme.typography.lineHeight['4xl'],
      fontWeight: theme.typography.fontWeight.bold,
    },
    h2: {
      fontSize: theme.typography.fontSize['3xl'],
      lineHeight: theme.typography.lineHeight['3xl'],
      fontWeight: theme.typography.fontWeight.bold,
    },
    h3: {
      fontSize: theme.typography.fontSize['2xl'],
      lineHeight: theme.typography.lineHeight['2xl'],
      fontWeight: theme.typography.fontWeight.semiBold,
    },
    h4: {
      fontSize: theme.typography.fontSize.xl,
      lineHeight: theme.typography.lineHeight.xl,
      fontWeight: theme.typography.fontWeight.semiBold,
    },
    h5: {
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.lineHeight.lg,
      fontWeight: theme.typography.fontWeight.medium,
    },
    h6: {
      fontSize: theme.typography.fontSize.base,
      lineHeight: theme.typography.lineHeight.base,
      fontWeight: theme.typography.fontWeight.medium,
    },
    body1: {
      fontSize: theme.typography.fontSize.base,
      lineHeight: theme.typography.lineHeight.base,
      fontWeight: theme.typography.fontWeight.normal,
    },
    body2: {
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.sm,
      fontWeight: theme.typography.fontWeight.normal,
    },
    caption: {
      fontSize: theme.typography.fontSize.xs,
      lineHeight: theme.typography.lineHeight.xs,
      fontWeight: theme.typography.fontWeight.normal,
    },
    overline: {
      fontSize: theme.typography.fontSize.xs,
      lineHeight: theme.typography.lineHeight.xs,
      fontWeight: theme.typography.fontWeight.medium,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
  };

  // @ts-ignore - Dynamic variant access
  const baseStyle = baseStyles[variant] || baseStyles.body1;

  return {
    ...baseStyle,
    color: theme.colors.text.primary,
    ...overrides,
  };
};
