/**
 * Goals Stack Navigator
 * Navigation for goal-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GoalsStackParamList } from '../../types/navigation';
import { SCREEN_OPTIONS } from '../../constants/navigation';

// Goal Screens
import GoalsListScreen from '../../screens/goals/GoalsListScreen';
import GoalDetailsScreen from '../../screens/goals/GoalDetailsScreen';
import CreateGoalScreen from '../../screens/goals/CreateGoalScreen';
import EditGoalScreen from '../../screens/goals/EditGoalScreen';
import GoalProgressScreen from '../../screens/goals/GoalProgressScreen';
import GoalCalculatorScreen from '../../screens/goals/GoalCalculatorScreen';
import GoalTemplatesScreen from '../../screens/goals/GoalTemplatesScreen';

const Stack = createNativeStackNavigator<GoalsStackParamList>();

const GoalsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="GoalsList"
      screenOptions={{
        ...SCREEN_OPTIONS,
        headerStyle: {
          ...SCREEN_OPTIONS.headerStyle,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="GoalsList"
        component={GoalsListScreen}
        options={{
          title: 'Goals',
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: 'Search goals...',
            hideWhenScrolling: true,
          },
        }}
      />
      
      <Stack.Screen
        name="GoalDetails"
        component={GoalDetailsScreen}
        options={{
          title: 'Goal Details',
          headerBackTitle: 'Goals',
        }}
      />
      
      <Stack.Screen
        name="CreateGoal"
        component={CreateGoalScreen}
        options={{
          title: 'Create Goal',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen
        name="EditGoal"
        component={EditGoalScreen}
        options={{
          title: 'Edit Goal',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen
        name="GoalProgress"
        component={GoalProgressScreen}
        options={{
          title: 'Goal Progress',
          headerBackTitle: 'Back',
        }}
      />
      
      <Stack.Screen
        name="GoalCalculator"
        component={GoalCalculatorScreen}
        options={{
          title: 'Goal Calculator',
          headerBackTitle: 'Back',
        }}
      />
      
      <Stack.Screen
        name="GoalTemplates"
        component={GoalTemplatesScreen}
        options={{
          title: 'Goal Templates',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

export default GoalsNavigator;
