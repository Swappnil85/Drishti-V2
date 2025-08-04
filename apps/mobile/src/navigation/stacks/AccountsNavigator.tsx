/**
 * Accounts Stack Navigator
 * Navigation for account-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountsStackParamList } from '../../types/navigation';
import { SCREEN_OPTIONS } from '../../constants/navigation';

// Account Screens
import AccountsListScreen from '../../screens/accounts/AccountsListScreen';
import AccountDetailsScreen from '../../screens/accounts/AccountDetailsScreen';
import AddAccountScreen from '../../screens/accounts/AddAccountScreen';
import AddAccountFromTemplateScreen from '../../screens/accounts/AddAccountFromTemplateScreen';
import EditAccountScreen from '../../screens/accounts/EditAccountScreen';
import AccountHistoryScreen from '../../screens/accounts/AccountHistoryScreen';
import ImportAccountsScreen from '../../screens/accounts/ImportAccountsScreen';

const Stack = createNativeStackNavigator<AccountsStackParamList>();

const AccountsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName='AccountsList'
      screenOptions={{
        ...SCREEN_OPTIONS,
        headerStyle: {
          ...SCREEN_OPTIONS.headerStyle,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name='AccountsList'
        component={AccountsListScreen}
        options={{
          title: 'Accounts',
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: 'Search accounts...',
            hideWhenScrolling: true,
          },
        }}
      />

      <Stack.Screen
        name='AccountDetails'
        component={AccountDetailsScreen}
        options={{
          title: 'Account Details',
          headerBackTitle: 'Accounts',
        }}
      />

      <Stack.Screen
        name='AddAccount'
        component={AddAccountScreen}
        options={{
          title: 'Add Account',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name='AddAccountFromTemplate'
        component={AddAccountFromTemplateScreen}
        options={{
          title: 'Add from Template',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name='EditAccount'
        component={EditAccountScreen}
        options={{
          title: 'Edit Account',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name='AccountHistory'
        component={AccountHistoryScreen}
        options={{
          title: 'Account History',
          headerBackTitle: 'Back',
        }}
      />

      <Stack.Screen
        name='ImportAccounts'
        component={ImportAccountsScreen}
        options={{
          title: 'Import Accounts',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default AccountsNavigator;
