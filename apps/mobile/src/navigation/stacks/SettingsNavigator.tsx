/**
 * Settings Stack Navigator
 * Navigation for settings-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SettingsStackParamList } from '../../types/navigation';
import { SCREEN_OPTIONS } from '../../constants/navigation';

// Settings Screens
import SettingsHomeScreen from '../../screens/settings/SettingsHomeScreen';
import ProfileScreen from '../../screens/settings/ProfileScreen';
import SecurityScreen from '../../screens/settings/SecurityScreen';
import NotificationsScreen from '../../screens/settings/NotificationsScreen';
import PrivacyScreen from '../../screens/settings/PrivacyScreen';
import DataExportScreen from '../../screens/settings/DataExportScreen';
import AboutScreen from '../../screens/settings/AboutScreen';
import HelpScreen from '../../screens/settings/HelpScreen';
import FeedbackScreen from '../../screens/settings/FeedbackScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={{
        ...SCREEN_OPTIONS,
        headerStyle: {
          ...SCREEN_OPTIONS.headerStyle,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{
          title: 'Settings',
          headerLargeTitle: true,
        }}
      />
      
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerBackTitle: 'Settings',
        }}
      />
      
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{
          title: 'Security',
          headerBackTitle: 'Settings',
        }}
      />
      
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          headerBackTitle: 'Settings',
        }}
      />
      
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          title: 'Privacy',
          headerBackTitle: 'Settings',
        }}
      />
      
      <Stack.Screen
        name="DataExport"
        component={DataExportScreen}
        options={{
          title: 'Data Export',
          headerBackTitle: 'Settings',
        }}
      />
      
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
          headerBackTitle: 'Settings',
        }}
      />
      
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{
          title: 'Help & Support',
          headerBackTitle: 'Settings',
        }}
      />
      
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{
          title: 'Feedback',
          headerBackTitle: 'Settings',
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
