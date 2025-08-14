import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeProvider';
import { ToastProvider, useToast } from '../ui/overlays/ToastProvider';
import { SheetProvider } from '../ui/overlays/SheetProvider';
import { Text, Pressable, View } from 'react-native';

// Mock AsyncStorage to avoid act warnings
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
}));

// Mock expo-haptics so tests run in node
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light' },
  NotificationFeedbackType: { Success: 'Success' },
}));

const DemoPrimary = ({ label = 'primary' }) => (
  <Pressable accessibilityRole='button' accessibilityLabel={label} onPress={() => {}}>
    <Text>{label}</Text>
  </Pressable>
);

const DemoToast = () => {
  const { showToast } = useToast();
  return (
    <View>
      <Pressable accessibilityRole='button' onPress={() => showToast('ok')}>
        <Text>toast</Text>
      </Pressable>
    </View>
  );
};

describe('E4-S5: Haptics & Feedback', () => {
  it('renders without crashing with mocked haptics', () => {
    const { getByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <SheetProvider>
            <DemoToast />
          </SheetProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    fireEvent.press(getByText('toast'));
    // toast visible
    expect(getByText('ok')).toBeTruthy();
  });
});

