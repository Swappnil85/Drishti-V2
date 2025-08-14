import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './theme/ThemeProvider';
import RootNavigator from './navigation/RootNavigator';
import { SheetProvider } from './ui/overlays/SheetProvider';
import { ToastProvider } from './ui/overlays/ToastProvider';

export default function App() {
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
