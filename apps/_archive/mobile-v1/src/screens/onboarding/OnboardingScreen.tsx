/**
 * Onboarding Screen
 * Main onboarding flow container with progress tracking
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useHaptic } from '../../hooks/useHaptic';
import { LoadingState } from '../../components/ui';

// Onboarding step components
import WelcomeStep from './steps/WelcomeStep';
import FIREEducationStep from './steps/FIREEducationStep';
import ProfileSetupStep from './steps/ProfileSetupStep';
import FirstAccountStep from './steps/FirstAccountStep';
import FirstGoalStep from './steps/FirstGoalStep';
import FinancialBasicsStep from './steps/FinancialBasicsStep';
import FIREStrategiesStep from './steps/FIREStrategiesStep';
import AdvancedProfileStep from './steps/AdvancedProfileStep';
import PortfolioSetupStep from './steps/PortfolioSetupStep';
import ScenarioPlanningStep from './steps/ScenarioPlanningStep';
import SimpleProfileStep from './steps/SimpleProfileStep';
import FirstStepsStep from './steps/FirstStepsStep';

// Progress indicator
import OnboardingProgress from './components/OnboardingProgress';

const OnboardingScreen: React.FC = () => {
  const {
    currentStep,
    progress,
    loading,
    canGoBack,
    goToPreviousStep,
    completeOnboarding,
    isComplete,
  } = useOnboarding();
  
  const { navigation: navigationHaptic } = useHaptic();

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        goToPreviousStep();
        navigationHaptic();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [canGoBack, goToPreviousStep, navigationHaptic]);

  // Auto-complete onboarding when all required steps are done
  useEffect(() => {
    if (isComplete) {
      completeOnboarding();
    }
  }, [isComplete, completeOnboarding]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading onboarding..." size="lg" />
      </SafeAreaView>
    );
  }

  if (!currentStep || !progress) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Preparing your experience..." size="lg" />
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'fire_education':
        return <FIREEducationStep />;
      case 'profile_setup':
        return <ProfileSetupStep />;
      case 'first_account':
        return <FirstAccountStep />;
      case 'first_goal':
        return <FirstGoalStep />;
      case 'financial_basics':
        return <FinancialBasicsStep />;
      case 'fire_introduction':
        return <FIREEducationStep />;
      case 'fire_strategies':
        return <FIREStrategiesStep />;
      case 'advanced_profile':
        return <AdvancedProfileStep />;
      case 'simple_profile':
        return <SimpleProfileStep />;
      case 'portfolio_setup':
        return <PortfolioSetupStep />;
      case 'scenario_planning':
        return <ScenarioPlanningStep />;
      case 'first_steps':
        return <FirstStepsStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <OnboardingProgress />
      
      {/* Current Step Content */}
      <View style={styles.stepContainer}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stepContainer: {
    flex: 1,
  },
});

export default OnboardingScreen;
