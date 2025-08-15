import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { ThemeProvider } from './theme/ThemeProvider';
import RootNavigator from './navigation/RootNavigator';
import { SheetProvider } from './ui/overlays/SheetProvider';
import { ToastProvider } from './ui/overlays/ToastProvider';

export default function App() {
  useEffect(() => {
    if (__DEV__) {
      // Dev-only log to verify root render path for native & web
      // Helps diagnose blank web screens without changing business logic
      // eslint-disable-next-line no-console
      console.log('[App] mounted', { platform: Platform.OS });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <SheetProvider>
            <StatusBar style='auto' />
            <RootNavigator />
          </SheetProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
