import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import Step2Screen from '../screens/onboarding/Step2Screen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { logEvent } from '../telemetry';
import { setOnboardingCompleted } from '../utils/storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

jest.mock('../utils/storage', () => ({
  setOnboardingCompleted: jest.fn(),
}));

const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;
const mockSetOnboardingCompleted = setOnboardingCompleted as jest.MockedFunction<typeof setOnboardingCompleted>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <NavigationContainer>
      {children}
    </NavigationContainer>
  </ThemeProvider>
);

describe('Onboarding CTA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('welcome screen CTA logs telemetry', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <WelcomeScreen />
      </TestWrapper>
    );

    const getStartedButton = getByTestId('onboarding-get-started');
    fireEvent.press(getStartedButton);

    expect(mockLogEvent).toHaveBeenCalledWith('onboarding_step', { step: 'welcome_cta' });
  });

  it('step2 screen completion sets onboarding completed', async () => {
    const { getByText } = render(
      <TestWrapper>
        <Step2Screen />
      </TestWrapper>
    );

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockLogEvent).toHaveBeenCalledWith('onboarding_complete');
      expect(mockSetOnboardingCompleted).toHaveBeenCalledWith(true);
    });
  });

  it('get started button has proper accessibility props', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <WelcomeScreen />
      </TestWrapper>
    );

    const getStartedButton = getByTestId('onboarding-get-started');
    expect(getStartedButton.props.accessibilityLabel).toBe('Get Started with Drishti');
    expect(getStartedButton.props.accessibilityHint).toBe('Begins the onboarding process');
  });
});
