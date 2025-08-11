/**
 * Modal Navigator
 * Handles modal screens and overlays
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ModalStackParamList } from '../types/navigation';
import { SCREEN_OPTIONS } from '../constants/navigation';

// Modal Screens
import QuickAddScreen from '../screens/modals/QuickAddScreen';
import CalculatorScreen from '../screens/modals/CalculatorScreen';
import ShareGoalScreen from '../screens/modals/ShareGoalScreen';
import ShareScenarioScreen from '../screens/modals/ShareScenarioScreen';
import OnboardingScreen from '../screens/modals/OnboardingScreen';
import TutorialScreen from '../screens/modals/TutorialScreen';

const Stack = createNativeStackNavigator<ModalStackParamList>();

const ModalNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        ...SCREEN_OPTIONS,
        presentation: 'modal',
        gestureEnabled: true,
        headerStyle: {
          ...SCREEN_OPTIONS.headerStyle,
          backgroundColor: '#F8F9FA',
        },
        headerLeft: () => null, // Remove back button for modals
      }}
    >
      <Stack.Screen
        name="QuickAdd"
        component={QuickAddScreen}
        options={{
          title: 'Quick Add',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={{
          title: 'Calculator',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="ShareGoal"
        component={ShareGoalScreen}
        options={{
          title: 'Share Goal',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="ShareScenario"
        component={ShareScenarioScreen}
        options={{
          title: 'Share Scenario',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      
      <Stack.Screen
        name="Tutorial"
        component={TutorialScreen}
        options={{
          title: 'Tutorial',
          headerShown: true,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default ModalNavigator;
