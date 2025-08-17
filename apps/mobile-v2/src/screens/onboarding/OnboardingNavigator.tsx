import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './WelcomeScreen';
import Step2Screen from './Step2Screen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Step2: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Step2" component={Step2Screen} />
    </Stack.Navigator>
  );
}
