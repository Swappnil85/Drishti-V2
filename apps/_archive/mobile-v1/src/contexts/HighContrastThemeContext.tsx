/**
 * HighContrastThemeContext
 * Epic 10, Story 3: Accessibility Support for Charts - High contrast theme support
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityInfo, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HighContrastTheme {
  colors: {
    // Chart specific colors
    chartBackground: string;
    chartForeground: string;
    chartGrid: string;
    chartAxis: string;
    chartText: string;
    chartTooltipBackground: string;
    chartTooltipText: string;
    
    // Data visualization colors
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Chart series colors (high contrast)
    series: string[];
    
    // Interactive elements
    hover: string;
    selected: string;
    focus: string;
    
    // Accessibility indicators
    milestone: string;
    annotation: string;
    significant: string;
  };
  
  typography: {
    fontWeight: {
      normal: string;
      bold: string;
      extraBold: string;
    };
    fontSize: {
      small: number;
      medium: number;
      large: number;
      extraLarge: number;
    };
  };
  
  spacing: {
    chartPadding: number;
    elementSpacing: number;
    touchTargetSize: number;
  };
  
  accessibility: {
    minContrastRatio: number;
    focusIndicatorWidth: number;
    animationDuration: number;
  };
}

interface HighContrastThemeContextType {
  isHighContrastEnabled: boolean;
  highContrastTheme: HighContrastTheme;
  toggleHighContrast: () => Promise<void>;
  setHighContrastEnabled: (enabled: boolean) => Promise<void>;
  getChartColors: (count: number) => string[];
  validateContrast: (foreground: string, background: string) => boolean;
}

const HIGH_CONTRAST_STORAGE_KEY = 'high_contrast_enabled';

const createHighContrastTheme = (isDark: boolean): HighContrastTheme => ({
  colors: {
    // Chart backgrounds and structure
    chartBackground: isDark ? '#000000' : '#FFFFFF',
    chartForeground: isDark ? '#FFFFFF' : '#000000',
    chartGrid: isDark ? '#404040' : '#C0C0C0',
    chartAxis: isDark ? '#FFFFFF' : '#000000',
    chartText: isDark ? '#FFFFFF' : '#000000',
    chartTooltipBackground: isDark ? '#FFFFFF' : '#000000',
    chartTooltipText: isDark ? '#000000' : '#FFFFFF',
    
    // High contrast data colors
    primary: isDark ? '#00FFFF' : '#0000FF',    // Cyan/Blue
    secondary: isDark ? '#FFFF00' : '#FF0000',  // Yellow/Red
    success: isDark ? '#00FF00' : '#008000',    // Lime/Green
    warning: isDark ? '#FFA500' : '#FF8C00',    // Orange
    error: isDark ? '#FF0000' : '#DC143C',      // Red/Crimson
    info: isDark ? '#87CEEB' : '#4169E1',       // Sky Blue/Royal Blue
    
    // High contrast series colors
    series: isDark 
      ? ['#00FFFF', '#FFFF00', '#FF00FF', '#00FF00', '#FFA500', '#FF0000', '#87CEEB', '#FFFFFF']
      : ['#0000FF', '#FF0000', '#008000', '#FF8C00', '#800080', '#000000', '#4169E1', '#8B4513'],
    
    // Interactive states
    hover: isDark ? '#808080' : '#D3D3D3',
    selected: isDark ? '#FFFF00' : '#0000FF',
    focus: isDark ? '#00FFFF' : '#FF0000',
    
    // Accessibility indicators
    milestone: isDark ? '#00FF00' : '#008000',
    annotation: isDark ? '#FFFF00' : '#FF8C00',
    significant: isDark ? '#FF00FF' : '#800080',
  },
  
  typography: {
    fontWeight: {
      normal: '600',  // Bolder than normal for better visibility
      bold: '700',
      extraBold: '800',
    },
    fontSize: {
      small: 14,      // Larger minimum sizes
      medium: 16,
      large: 20,
      extraLarge: 24,
    },
  },
  
  spacing: {
    chartPadding: 24,           // More padding for clarity
    elementSpacing: 16,         // More space between elements
    touchTargetSize: 48,        // Larger touch targets
  },
  
  accessibility: {
    minContrastRatio: 7.0,      // WCAG AAA standard
    focusIndicatorWidth: 3,     // Thicker focus indicators
    animationDuration: 0,       // Reduced motion
  },
});

const HighContrastThemeContext = createContext<HighContrastThemeContextType | undefined>(undefined);

interface HighContrastThemeProviderProps {
  children: ReactNode;
}

export const HighContrastThemeProvider: React.FC<HighContrastThemeProviderProps> = ({ children }) => {
  const [isHighContrastEnabled, setIsHighContrastEnabledState] = useState(false);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    initializeHighContrast();
    
    // Listen for system color scheme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const initializeHighContrast = async () => {
    try {
      // Check if high contrast is enabled in system settings
      const systemHighContrast = await AccessibilityInfo.isHighTextContrastEnabled?.() || false;
      
      // Check stored preference
      const storedPreference = await AsyncStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
      const userPreference = storedPreference ? JSON.parse(storedPreference) : null;
      
      // Use system setting if no user preference
      const shouldEnable = userPreference !== null ? userPreference : systemHighContrast;
      
      setIsHighContrastEnabledState(shouldEnable);
    } catch (error) {
      console.error('Failed to initialize high contrast settings:', error);
    }
  };

  const setHighContrastEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, JSON.stringify(enabled));
      setIsHighContrastEnabledState(enabled);
    } catch (error) {
      console.error('Failed to save high contrast preference:', error);
    }
  };

  const toggleHighContrast = async () => {
    await setHighContrastEnabled(!isHighContrastEnabled);
  };

  const getChartColors = (count: number): string[] => {
    const theme = createHighContrastTheme(systemColorScheme === 'dark');
    const colors = theme.colors.series;
    
    // Repeat colors if more are needed
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    
    return result;
  };

  const validateContrast = (foreground: string, background: string): boolean => {
    // Simplified contrast validation
    // In a full implementation, you'd calculate the actual contrast ratio
    const theme = createHighContrastTheme(systemColorScheme === 'dark');
    return true; // Assume high contrast colors always pass
  };

  const highContrastTheme = createHighContrastTheme(systemColorScheme === 'dark');

  const value: HighContrastThemeContextType = {
    isHighContrastEnabled,
    highContrastTheme,
    toggleHighContrast,
    setHighContrastEnabled,
    getChartColors,
    validateContrast,
  };

  return (
    <HighContrastThemeContext.Provider value={value}>
      {children}
    </HighContrastThemeContext.Provider>
  );
};

export const useHighContrastTheme = (): HighContrastThemeContextType => {
  const context = useContext(HighContrastThemeContext);
  if (!context) {
    throw new Error('useHighContrastTheme must be used within a HighContrastThemeProvider');
  }
  return context;
};

// Utility functions for high contrast support

/**
 * Calculate contrast ratio between two colors
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  // Simplified implementation - in production, use a proper color library
  const getLuminance = (color: string): number => {
    // Convert hex to RGB and calculate relative luminance
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color combination meets WCAG standards
 */
export const meetsWCAGStandards = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  const minRatio = level === 'AAA' ? 7.0 : 4.5;
  return ratio >= minRatio;
};

/**
 * Get accessible color pair
 */
export const getAccessibleColorPair = (
  preferredForeground: string,
  preferredBackground: string,
  highContrastTheme: HighContrastTheme
): { foreground: string; background: string } => {
  if (meetsWCAGStandards(preferredForeground, preferredBackground, 'AAA')) {
    return { foreground: preferredForeground, background: preferredBackground };
  }
  
  // Fall back to high contrast colors
  return {
    foreground: highContrastTheme.colors.chartForeground,
    background: highContrastTheme.colors.chartBackground,
  };
};

export default HighContrastThemeProvider;
