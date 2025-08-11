/**
 * Dashboard Stack Navigator
 * Navigation for dashboard-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DashboardStackParamList } from '../../types/navigation';
import { SCREEN_OPTIONS } from '../../constants/navigation';

// Dashboard Screens
import DashboardHomeScreen from '../../screens/dashboard/DashboardHomeScreen';
import NetWorthScreen from '../../screens/dashboard/NetWorthScreen';
import ProgressOverviewScreen from '../../screens/dashboard/ProgressOverviewScreen';
import QuickActionsScreen from '../../screens/dashboard/QuickActionsScreen';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

const DashboardNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="DashboardHome"
      screenOptions={{
        ...SCREEN_OPTIONS,
        headerStyle: {
          ...SCREEN_OPTIONS.headerStyle,
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          ...SCREEN_OPTIONS.headerTitleStyle,
          fontSize: 18,
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="DashboardHome"
        component={DashboardHomeScreen}
        options={{
          title: 'Dashboard',
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: 'Search...',
            hideWhenScrolling: true,
          },
        }}
      />
      
      <Stack.Screen
        name="NetWorth"
        component={NetWorthScreen}
        options={{
          title: 'Net Worth',
          headerBackTitle: 'Dashboard',
        }}
      />
      
      <Stack.Screen
        name="ProgressOverview"
        component={ProgressOverviewScreen}
        options={{
          title: 'Progress Overview',
          headerBackTitle: 'Dashboard',
        }}
      />
      
      <Stack.Screen
        name="QuickActions"
        component={QuickActionsScreen}
        options={{
          title: 'Quick Actions',
          headerBackTitle: 'Dashboard',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default DashboardNavigator;
