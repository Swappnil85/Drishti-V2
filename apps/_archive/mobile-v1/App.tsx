import React from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NavigationProvider } from './src/contexts/NavigationContext';
import { EnhancedNavigationProvider } from './src/contexts/EnhancedNavigationContext';
import { HapticProvider } from './src/contexts/HapticContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import { AuthProvider } from './src/contexts/AuthContext';
import EnhancedRootNavigator from './src/navigation/EnhancedRootNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <HapticProvider>
        <ProfileProvider>
          <OnboardingProvider>
            <AuthProvider>
              <NavigationProvider>
                <EnhancedNavigationProvider>
                  <EnhancedRootNavigator />
                </EnhancedNavigationProvider>
              </NavigationProvider>
            </AuthProvider>
          </OnboardingProvider>
        </ProfileProvider>
      </HapticProvider>
    </ThemeProvider>
  );
}
