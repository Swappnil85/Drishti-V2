/**
 * Scenarios Stack Navigator
 * Navigation for scenario-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ScenariosStackParamList } from '../../types/navigation';
import { SCREEN_OPTIONS } from '../../constants/navigation';

// Scenario Screens - temporarily using test screen for debugging
import TestScenariosScreen from '../../screens/scenarios/TestScenariosScreen';
// import ScenariosListScreen from '../../screens/scenarios/ScenariosListScreen';
// import ScenarioDetailsScreen from '../../screens/scenarios/ScenarioDetailsScreen';
// import CreateScenarioScreen from '../../screens/scenarios/CreateScenarioScreen';
// import EditScenarioScreen from '../../screens/scenarios/EditScenarioScreen';
// import ScenarioComparisonScreen from '../../screens/scenarios/ScenarioComparisonScreen';
// import StressTestScreen from '../../screens/scenarios/StressTestScreen';
// import ScenarioTemplatesScreen from '../../screens/scenarios/ScenarioTemplatesScreen';

const Stack = createNativeStackNavigator<ScenariosStackParamList>();

const ScenariosNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName='ScenariosList'
      screenOptions={{
        ...SCREEN_OPTIONS,
        headerStyle: {
          ...SCREEN_OPTIONS.headerStyle,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name='ScenariosList'
        component={TestScenariosScreen}
        options={{
          title: 'Scenarios',
          headerLargeTitle: true,
        }}
      />

      {/* Temporarily commented out for debugging
      <Stack.Screen
        name='ScenarioDetails'
        component={ScenarioDetailsScreen}
        options={{
          title: 'Scenario Details',
          headerBackTitle: 'Scenarios',
        }}
      />

      <Stack.Screen
        name='CreateScenario'
        component={CreateScenarioScreen}
        options={{
          title: 'Create Scenario',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name='EditScenario'
        component={EditScenarioScreen}
        options={{
          title: 'Edit Scenario',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name='ScenarioComparison'
        component={ScenarioComparisonScreen}
        options={{
          title: 'Compare Scenarios',
          headerBackTitle: 'Back',
        }}
      />

      <Stack.Screen
        name='StressTest'
        component={StressTestScreen}
        options={{
          title: 'Stress Test',
          headerBackTitle: 'Back',
        }}
      />

      <Stack.Screen
        name='ScenarioTemplates'
        component={ScenarioTemplatesScreen}
        options={{
          title: 'Scenario Templates',
          headerBackTitle: 'Back',
        }}
      />
      */}
    </Stack.Navigator>
  );
};

export default ScenariosNavigator;
