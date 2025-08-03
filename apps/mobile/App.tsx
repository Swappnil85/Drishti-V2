import React from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NavigationProvider } from './src/contexts/NavigationContext';
import { EnhancedNavigationProvider } from './src/contexts/EnhancedNavigationContext';
import { HapticProvider } from './src/contexts/HapticContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { AuthProvider } from './src/contexts/AuthContext';
import EnhancedRootNavigator from './src/navigation/EnhancedRootNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <HapticProvider>
        <OnboardingProvider>
          <AuthProvider>
            <NavigationProvider>
              <EnhancedNavigationProvider>
                <EnhancedRootNavigator />
              </EnhancedNavigationProvider>
            </NavigationProvider>
          </AuthProvider>
        </OnboardingProvider>
      </HapticProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007AFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#00AA00',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
