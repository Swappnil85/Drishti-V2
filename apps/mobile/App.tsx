import React from 'react';
import { NavigationProvider } from './src/contexts/NavigationContext';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <RootNavigator />
      </NavigationProvider>
    </AuthProvider>
  );
}
