import { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import Step2Screen from './Step2Screen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Step2: undefined;
};

export default function OnboardingNavigator() {
  const [currentStep, setCurrentStep] = useState<'Welcome' | 'Step2'>(
    'Welcome'
  );

  const navigateToStep2 = () => setCurrentStep('Step2');

  if (currentStep === 'Welcome') {
    return <WelcomeScreen onNext={navigateToStep2} />;
  }

  return <Step2Screen />;
}
