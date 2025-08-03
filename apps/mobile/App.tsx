import React from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NavigationProvider } from './src/contexts/NavigationContext';
import { EnhancedNavigationProvider } from './src/contexts/EnhancedNavigationContext';
import { HapticProvider } from './src/contexts/HapticContext';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation';
import EnhancedRootNavigator from './src/navigation/EnhancedRootNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <HapticProvider>
        <AuthProvider>
          <NavigationProvider>
            <EnhancedNavigationProvider>
              <EnhancedRootNavigator />
            </EnhancedNavigationProvider>
          </NavigationProvider>
        </AuthProvider>
      </HapticProvider>
    </ThemeProvider>
  );
}
