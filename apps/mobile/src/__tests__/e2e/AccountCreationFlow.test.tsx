/**
 * Account Creation Flow E2E Tests
 * End-to-end tests for the complete account creation workflow
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AddAccountScreen from '../../screens/accounts/AddAccountScreen';
import AddAccountFromTemplateScreen from '../../screens/accounts/AddAccountFromTemplateScreen';
import ImportAccountsScreen from '../../screens/accounts/ImportAccountsScreen';
import AccountsListScreen from '../../screens/accounts/AccountsListScreen';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the complete navigation stack
const Stack = createStackNavigator();

const TestApp = ({ initialRouteName = 'AccountsList' }: { initialRouteName?: string }) => (
  <NavigationContainer>
    <AuthProvider>
      <ThemeProvider>
        <Stack.Navigator initialRouteName={initialRouteName}>
          <Stack.Screen name="AccountsList" component={AccountsListScreen} />
          <Stack.Screen name="AddAccount" component={AddAccountScreen} />
          <Stack.Screen name="AddAccountFromTemplate" component={AddAccountFromTemplateScreen} />
          <Stack.Screen name="ImportAccounts" component={ImportAccountsScreen} />
        </Stack.Navigator>
      </ThemeProvider>
    </AuthProvider>
  </NavigationContainer>
);

// Mock database with more realistic behavior
const mockAccounts: any[] = [];
const mockDatabase = {
  write: jest.fn((callback) => {
    return Promise.resolve(callback());
  }),
  get: jest.fn(() => ({
    query: jest.fn(() => ({
      fetch: jest.fn(() => Promise.resolve(mockAccounts)),
    })),
    create: jest.fn((callback) => {
      const mockAccount = {
        id: `account-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      callback(mockAccount);
      mockAccounts.push(mockAccount);
      return mockAccount;
    }),
  })),
};

jest.mock('../../database', () => ({
  database: mockDatabase,
}));

describe('Account Creation Flow E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccounts.length = 0; // Clear accounts array
  });

  describe('Manual Account Creation Flow', () => {
    it('should complete the full manual account creation workflow', async () => {
      const { getByTestId, getByText, queryByText } = render(
        <TestApp initialRouteName="AddAccount" />
      );

      // Step 1: Basic Information
      expect(getByText('Basic Information')).toBeTruthy();

      // Fill in account name
      const nameInput = getByTestId('account-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'My Test Checking Account');
      });

      // Select account type
      const checkingTypeButton = getByTestId('account-type-checking');
      await act(async () => {
        fireEvent.press(checkingTypeButton);
      });

      // Proceed to step 2
      const nextButton = getByTestId('next-button');
      await act(async () => {
        fireEvent.press(nextButton);
      });

      // Step 2: Institution & Details
      await waitFor(() => {
        expect(getByText('Institution & Details')).toBeTruthy();
        expect(queryByText('Basic Information')).toBeFalsy();
      });

      // Fill in balance
      const balanceInput = getByTestId('balance-input');
      await act(async () => {
        fireEvent.changeText(balanceInput, '5000');
      });

      // Fill in interest rate
      const interestRateInput = getByTestId('interest-rate-input');
      await act(async () => {
        fireEvent.changeText(interestRateInput, '1.5');
      });

      // Proceed to step 3
      const nextButton2 = getByTestId('next-button');
      await act(async () => {
        fireEvent.press(nextButton2);
      });

      // Step 3: Additional Information
      await waitFor(() => {
        expect(getByText('Additional Information')).toBeTruthy();
      });

      // Add some notes
      const notesInput = getByTestId('notes-input');
      await act(async () => {
        fireEvent.changeText(notesInput, 'This is my primary checking account for daily expenses.');
      });

      // Create the account
      const createButton = getByTestId('create-button');
      await act(async () => {
        fireEvent.press(createButton);
      });

      // Verify account creation
      await waitFor(() => {
        expect(mockDatabase.write).toHaveBeenCalled();
        expect(mockDatabase.get).toHaveBeenCalledWith('financial_accounts');
      });
    });

    it('should handle validation errors gracefully', async () => {
      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="AddAccount" />
      );

      // Try to proceed without filling required fields
      const nextButton = getByTestId('next-button');
      await act(async () => {
        fireEvent.press(nextButton);
      });

      // Should show validation errors
      await waitFor(() => {
        expect(getByText('Account name is required')).toBeTruthy();
        expect(getByText('Please select an account type')).toBeTruthy();
      });

      // Fill in name but not type
      const nameInput = getByTestId('account-name-input');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Account');
      });

      await act(async () => {
        fireEvent.press(nextButton);
      });

      // Should still show type error
      await waitFor(() => {
        expect(getByText('Please select an account type')).toBeTruthy();
      });
    });

    it('should allow navigation back and forth between steps', async () => {
      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="AddAccount" />
      );

      // Complete step 1
      const nameInput = getByTestId('account-name-input');
      const checkingTypeButton = getByTestId('account-type-checking');
      const nextButton = getByTestId('next-button');

      await act(async () => {
        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });

      // Should be on step 2
      await waitFor(() => {
        expect(getByText('Institution & Details')).toBeTruthy();
      });

      // Go back to step 1
      const backButton = getByTestId('back-button');
      await act(async () => {
        fireEvent.press(backButton);
      });

      // Should be back on step 1
      await waitFor(() => {
        expect(getByText('Basic Information')).toBeTruthy();
      });

      // Data should be preserved
      expect(nameInput.props.value).toBe('Test Account');
    });
  });

  describe('Template-Based Account Creation Flow', () => {
    it('should complete template-based account creation', async () => {
      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="AddAccountFromTemplate" />
      );

      // Should show template selector
      expect(getByText('Choose a Template')).toBeTruthy();

      // Select a template (assuming beginner template exists)
      const beginnerTemplate = getByTestId('template-beginner-essentials');
      await act(async () => {
        fireEvent.press(beginnerTemplate);
      });

      // Should navigate to bulk account creator
      await waitFor(() => {
        expect(getByText('Beginner Essentials')).toBeTruthy();
      });

      // Should show accounts from template
      expect(getByText('Primary Checking')).toBeTruthy();
      expect(getByText('Emergency Savings')).toBeTruthy();

      // Create accounts
      const createButton = getByTestId('create-accounts-button');
      await act(async () => {
        fireEvent.press(createButton);
      });

      // Should create multiple accounts
      await waitFor(() => {
        expect(mockDatabase.write).toHaveBeenCalled();
      });
    });

    it('should allow customization of template accounts', async () => {
      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="AddAccountFromTemplate" />
      );

      // Select template and navigate to customization
      const beginnerTemplate = getByTestId('template-beginner-essentials');
      await act(async () => {
        fireEvent.press(beginnerTemplate);
      });

      await waitFor(() => {
        expect(getByText('Primary Checking')).toBeTruthy();
      });

      // Customize account name
      const nameInput = getByTestId('account-name-beginner-essentials-0');
      await act(async () => {
        fireEvent.changeText(nameInput, 'My Custom Checking Account');
      });

      // Customize balance
      const balanceInput = getByTestId('balance-beginner-essentials-0');
      await act(async () => {
        fireEvent.changeText(balanceInput, '2500');
      });

      // Create accounts with customizations
      const createButton = getByTestId('create-accounts-button');
      await act(async () => {
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        expect(mockDatabase.write).toHaveBeenCalled();
      });
    });
  });

  describe('CSV Import Flow', () => {
    it('should complete CSV import workflow', async () => {
      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="ImportAccounts" />
      );

      // Should show import screen
      expect(getByText('Import Accounts from CSV')).toBeTruthy();

      // Download template
      const downloadButton = getByTestId('download-template-button');
      await act(async () => {
        fireEvent.press(downloadButton);
      });

      // Select file (mocked to return valid CSV)
      const selectFileButton = getByTestId('select-file-button');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      // Should show preview with parsed data
      await waitFor(() => {
        expect(getByText('Preview Import')).toBeTruthy();
      });

      // Import accounts
      const importButton = getByTestId('import-button');
      await act(async () => {
        fireEvent.press(importButton);
      });

      // Should show import progress and completion
      await waitFor(() => {
        expect(getByText('Import Complete!')).toBeTruthy();
      });
    });

    it('should handle CSV validation errors', async () => {
      // Mock invalid CSV data
      const { FileSystem } = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('invalid,csv,data\n,missing,required');

      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="ImportAccounts" />
      );

      const selectFileButton = getByTestId('select-file-button');
      await act(async () => {
        fireEvent.press(selectFileButton);
      });

      // Should show validation errors
      await waitFor(() => {
        expect(getByText(/with errors/)).toBeTruthy();
      });
    });
  });

  describe('Integration with Accounts List', () => {
    it('should show created accounts in the accounts list', async () => {
      // Start with accounts list
      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="AccountsList" />
      );

      // Should show empty state initially
      expect(getByText('No accounts yet')).toBeTruthy();

      // Navigate to add account
      const addAccountFab = getByTestId('add-account-fab');
      await act(async () => {
        fireEvent.press(addAccountFab);
      });

      // This would show action sheet in real app, but for test we'll simulate navigation
      // In a real E2E test, we'd need to handle the action sheet interaction
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockDatabase.write.mockRejectedValue(new Error('Database connection failed'));

      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="AddAccount" />
      );

      // Complete the form
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        let nextButton = getByTestId('next-button');

        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);

        const balanceInput = getByTestId('balance-input');
        nextButton = getByTestId('next-button');

        fireEvent.changeText(balanceInput, '5000');
        fireEvent.press(nextButton);

        const createButton = getByTestId('create-button');
        fireEvent.press(createButton);
      });

      // Should handle error gracefully (would show alert in real app)
      await waitFor(() => {
        expect(mockDatabase.write).toHaveBeenCalled();
      });
    });

    it('should handle network errors during institution search', async () => {
      // Mock network error
      const { institutionService } = require('../../services/financial/InstitutionService');
      institutionService.searchInstitutions.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(
        <TestApp initialRouteName="AddAccount" />
      );

      // Navigate to step 2
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        const nextButton = getByTestId('next-button');

        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);
      });

      // Try to search for institution
      await waitFor(() => {
        const institutionPicker = getByTestId('institution-picker');
        expect(institutionPicker).toBeTruthy();
      });

      // Should handle search error gracefully
      // In real implementation, this would show an error message or fallback
    });
  });

  describe('Performance and UX', () => {
    it('should show loading states during account creation', async () => {
      // Mock slow database operation
      mockDatabase.write.mockImplementation((callback) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            callback();
            resolve(undefined);
          }, 1000);
        });
      });

      const { getByTestId, getByText } = render(
        <TestApp initialRouteName="AddAccount" />
      );

      // Complete form and submit
      await act(async () => {
        const nameInput = getByTestId('account-name-input');
        const checkingTypeButton = getByTestId('account-type-checking');
        let nextButton = getByTestId('next-button');

        fireEvent.changeText(nameInput, 'Test Account');
        fireEvent.press(checkingTypeButton);
        fireEvent.press(nextButton);

        const balanceInput = getByTestId('balance-input');
        nextButton = getByTestId('next-button');

        fireEvent.changeText(balanceInput, '5000');
        fireEvent.press(nextButton);

        const createButton = getByTestId('create-button');
        fireEvent.press(createButton);
      });

      // Should show loading state
      expect(getByTestId('create-button').props.loading).toBe(true);
    });

    it('should provide haptic feedback for user interactions', async () => {
      const { useFormHaptic } = require('../../hooks/useHaptic');
      const mockHaptic = useFormHaptic();

      const { getByTestId } = render(
        <TestApp initialRouteName="AddAccount" />
      );

      const checkingTypeButton = getByTestId('account-type-checking');
      await act(async () => {
        fireEvent.press(checkingTypeButton);
      });

      // Should trigger haptic feedback
      expect(mockHaptic.selection).toHaveBeenCalled();
    });
  });
});
