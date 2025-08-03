/**
 * Main Tab Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { MainTabParamList } from '../types/navigation';
import { TAB_SCREEN_OPTIONS, TAB_ICONS, ACCESSIBILITY_LABELS } from '../constants/navigation';
import { useNavigation as useNavigationContext } from '../contexts/NavigationContext';

// Stack Navigators
import DashboardNavigator from './stacks/DashboardNavigator';
import AccountsNavigator from './stacks/AccountsNavigator';
import GoalsNavigator from './stacks/GoalsNavigator';
import ScenariosNavigator from './stacks/ScenariosNavigator';
import SettingsNavigator from './stacks/SettingsNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const { setCurrentTab } = useNavigationContext();

  // Handle tab press
  const handleTabPress = (tabName: keyof MainTabParamList) => {
    setCurrentTab(tabName);
  };

  // Get tab bar icon
  const getTabBarIcon = (
    routeName: keyof MainTabParamList,
    focused: boolean,
    color: string,
    size: number
  ) => {
    const iconConfig = TAB_ICONS[routeName];
    const iconName = focused ? iconConfig.focused : iconConfig.unfocused;
    
    return (
      <Ionicons
        name={iconName as any}
        size={size}
        color={color}
      />
    );
  };

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        ...TAB_SCREEN_OPTIONS,
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarStyle: {
          ...TAB_SCREEN_OPTIONS.tabBarStyle,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {
          ...TAB_SCREEN_OPTIONS.tabBarLabelStyle,
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{
          title: 'Dashboard',
          tabBarAccessibilityLabel: ACCESSIBILITY_LABELS.TAB_DASHBOARD,
        }}
        listeners={{
          tabPress: () => handleTabPress('Dashboard'),
        }}
      />
      
      <Tab.Screen
        name="Accounts"
        component={AccountsNavigator}
        options={{
          title: 'Accounts',
          tabBarAccessibilityLabel: ACCESSIBILITY_LABELS.TAB_ACCOUNTS,
        }}
        listeners={{
          tabPress: () => handleTabPress('Accounts'),
        }}
      />
      
      <Tab.Screen
        name="Goals"
        component={GoalsNavigator}
        options={{
          title: 'Goals',
          tabBarAccessibilityLabel: ACCESSIBILITY_LABELS.TAB_GOALS,
        }}
        listeners={{
          tabPress: () => handleTabPress('Goals'),
        }}
      />
      
      <Tab.Screen
        name="Scenarios"
        component={ScenariosNavigator}
        options={{
          title: 'Scenarios',
          tabBarAccessibilityLabel: ACCESSIBILITY_LABELS.TAB_SCENARIOS,
        }}
        listeners={{
          tabPress: () => handleTabPress('Scenarios'),
        }}
      />
      
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: ACCESSIBILITY_LABELS.TAB_SETTINGS,
        }}
        listeners={{
          tabPress: () => handleTabPress('Settings'),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
