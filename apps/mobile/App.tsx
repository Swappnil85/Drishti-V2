import React from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NavigationProvider } from './src/contexts/NavigationContext';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationProvider>
          <RootNavigator />
        </NavigationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
