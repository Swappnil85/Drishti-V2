import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Mock security service for App rendering
jest.mock('../services/SecurityService', () => ({
  securityService: {
    isAppLockEnabled: jest.fn().mockResolvedValue(false),
    getCurrentLockState: jest.fn().mockResolvedValue('UNLOCKED'),
    addLockStateListener: jest.fn(),
    removeLockStateListener: jest.fn(),
  },
  AppLockState: {
    LOCKED: 'LOCKED',
    UNLOCKED: 'UNLOCKED',
  },
}));

const Tab = createBottomTabNavigator();

function TestScreen() {
  return (
    <View testID='test-screen'>
      <Text>Test Screen</Text>
    </View>
  );
}

describe('E4-S1: Bottom Tab Navigation Shell', () => {
  it('renders navigation container and does not crash', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name='Test' component={TestScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    );
    expect(getByTestId('test-screen')).toBeTruthy();
  });
});
