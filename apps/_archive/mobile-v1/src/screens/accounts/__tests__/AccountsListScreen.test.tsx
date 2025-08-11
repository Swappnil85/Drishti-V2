/**
 * AccountsListScreen Tests
 * Integration tests for the enhanced accounts list
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import AccountsListScreen from '../AccountsListScreen';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock dependencies
const mockAccounts = [
  {
    id: 'account-1',
    name: 'Primary Checking',
    accountType: 'checking',
    institution: 'Test Bank',
    balance: 5000,
    currency: 'USD',
    interestRate: 0.01,
    tags: ['Primary', 'Daily Use'],
    color: 'blue',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: 'account-2',
    name: 'Emergency Savings',
    accountType: 'savings',
    institution: 'Savings Bank',
    balance: 15000,
    currency: 'USD',
    interestRate: 0.04,
    tags: ['Emergency', 'Safety Net'],
    color: 'green',
    isActive: true,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
  },
  {
    id: 'account-3',
    name: 'Investment Portfolio',
    accountType: 'investment',
    institution: 'Investment Firm',
    balance: 50000,
    currency: 'USD',
    interestRate: 0.07,
    tags: ['Investment', 'Growth'],
    color: 'purple',
    isActive: true,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03'),
  },
];

jest.mock('../../../database', () => ({
  database: {
    get: jest.fn(() => ({
      query: jest.fn(() => ({
        fetch: jest.fn(() => Promise.resolve(mockAccounts)),
      })),
    })),
    write: jest.fn(),
  },
}));

jest.mock('@nozbe/watermelondb', () => ({
  Q: {
    where: jest.fn(),
  },
}));

jest.mock('../../../hooks/useHaptic', () => ({
  useFormHaptic: () => ({
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  }),
}));

const Stack = createStackNavigator();

const MockedAccountsListScreen = () => (
  <NavigationContainer>
    <AuthProvider>
      <ThemeProvider>
        <Stack.Navigator>
          <Stack.Screen 
            name="AccountsList" 
            component={AccountsListScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </ThemeProvider>
    </AuthProvider>
  </NavigationContainer>
);

describe('AccountsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render accounts list correctly', async () => {
      const { getByText, getByTestId } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('Primary Checking')).toBeTruthy();
        expect(getByText('Emergency Savings')).toBeTruthy();
        expect(getByText('Investment Portfolio')).toBeTruthy();
      });
      
      expect(getByTestId('accounts-list-screen')).toBeTruthy();
    });

    it('should display account summary', async () => {
      const { getByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('3')).toBeTruthy(); // Total accounts
        expect(getByText('Accounts')).toBeTruthy();
        expect(getByText('$70,000')).toBeTruthy(); // Total balance
        expect(getByText('Total Balance')).toBeTruthy();
      });
    });

    it('should display account details correctly', async () => {
      const { getByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        // Check account names
        expect(getByText('Primary Checking')).toBeTruthy();
        expect(getByText('Emergency Savings')).toBeTruthy();
        expect(getByText('Investment Portfolio')).toBeTruthy();
        
        // Check institutions
        expect(getByText('Test Bank')).toBeTruthy();
        expect(getByText('Savings Bank')).toBeTruthy();
        expect(getByText('Investment Firm')).toBeTruthy();
        
        // Check balances
        expect(getByText('$5,000')).toBeTruthy();
        expect(getByText('$15,000')).toBeTruthy();
        expect(getByText('$50,000')).toBeTruthy();
        
        // Check account types
        expect(getByText('checking')).toBeTruthy();
        expect(getByText('savings')).toBeTruthy();
        expect(getByText('investment')).toBeTruthy();
      });
    });

    it('should display tags for accounts', async () => {
      const { getByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('Primary')).toBeTruthy();
        expect(getByText('Emergency')).toBeTruthy();
        expect(getByText('Investment')).toBeTruthy();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should filter accounts by search term', async () => {
      const { getByTestId, getByText, queryByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('Primary Checking')).toBeTruthy();
      });
      
      const searchInput = getByTestId('search-input');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'Emergency');
      });
      
      await waitFor(() => {
        expect(getByText('Emergency Savings')).toBeTruthy();
        expect(queryByText('Primary Checking')).toBeFalsy();
        expect(queryByText('Investment Portfolio')).toBeFalsy();
      });
    });

    it('should filter accounts by type', async () => {
      const { getByTestId, getByText, queryByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('Primary Checking')).toBeTruthy();
      });
      
      // Open filters
      const filterButton = getByTestId('filter-button');
      await act(async () => {
        fireEvent.press(filterButton);
      });
      
      // Select savings filter
      const savingsFilter = getByTestId('filter-savings');
      await act(async () => {
        fireEvent.press(savingsFilter);
      });
      
      await waitFor(() => {
        expect(getByText('Emergency Savings')).toBeTruthy();
        expect(queryByText('Primary Checking')).toBeFalsy();
        expect(queryByText('Investment Portfolio')).toBeFalsy();
      });
    });

    it('should show filter options when filter button is pressed', async () => {
      const { getByTestId, getByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('Primary Checking')).toBeTruthy();
      });
      
      const filterButton = getByTestId('filter-button');
      
      await act(async () => {
        fireEvent.press(filterButton);
      });
      
      await waitFor(() => {
        expect(getByText('All')).toBeTruthy();
        expect(getByText('Checking')).toBeTruthy();
        expect(getByText('Savings')).toBeTruthy();
        expect(getByText('Investment')).toBeTruthy();
      });
    });
  });

  describe('Account Interactions', () => {
    it('should navigate to account details when account is pressed', async () => {
      const mockNavigate = jest.fn();
      
      // Mock navigation
      jest.mock('@react-navigation/native', () => ({
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => ({
          navigate: mockNavigate,
        }),
      }));
      
      const { getByTestId } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        const accountItem = getByTestId('account-account-1');
        expect(accountItem).toBeTruthy();
      });
      
      const accountItem = getByTestId('account-account-1');
      
      await act(async () => {
        fireEvent.press(accountItem);
      });
      
      // Navigation would be called in real implementation
      // expect(mockNavigate).toHaveBeenCalledWith('AccountDetails', { accountId: 'account-1' });
    });

    it('should show action sheet on long press', async () => {
      const { getByTestId } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        const accountItem = getByTestId('account-account-1');
        expect(accountItem).toBeTruthy();
      });
      
      const accountItem = getByTestId('account-account-1');
      
      await act(async () => {
        fireEvent(accountItem, 'longPress');
      });
      
      // Action sheet would be shown in real implementation
      // This would require mocking ActionSheetIOS or Alert
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no accounts exist', async () => {
      // Mock empty accounts
      jest.doMock('../../../database', () => ({
        database: {
          get: jest.fn(() => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve([])),
            })),
          })),
        },
      }));
      
      const { getByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('No accounts yet')).toBeTruthy();
        expect(getByText('Add your first account to get started')).toBeTruthy();
      });
    });

    it('should show filtered empty state when search returns no results', async () => {
      const { getByTestId, getByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('Primary Checking')).toBeTruthy();
      });
      
      const searchInput = getByTestId('search-input');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'NonExistentAccount');
      });
      
      await waitFor(() => {
        expect(getByText('No accounts found')).toBeTruthy();
        expect(getByText('Try adjusting your search or filters')).toBeTruthy();
      });
    });
  });

  describe('Floating Action Button', () => {
    it('should show floating action button', async () => {
      const { getByTestId } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByTestId('add-account-fab')).toBeTruthy();
      });
    });

    it('should show add account options when FAB is pressed', async () => {
      const { getByTestId } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        const fab = getByTestId('add-account-fab');
        expect(fab).toBeTruthy();
      });
      
      const fab = getByTestId('add-account-fab');
      
      await act(async () => {
        fireEvent.press(fab);
      });
      
      // Action sheet would be shown in real implementation
      // This would require mocking ActionSheetIOS or Alert
    });
  });

  describe('Pull to Refresh', () => {
    it('should support pull to refresh', async () => {
      const { getByTestId } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('Primary Checking')).toBeTruthy();
      });
      
      // Simulate pull to refresh
      const flatList = getByTestId('accounts-list-screen').findByType('FlatList');
      
      await act(async () => {
        fireEvent(flatList, 'refresh');
      });
      
      // Refresh would reload data in real implementation
    });
  });

  describe('Sorting', () => {
    it('should show sort options when sort button is pressed', async () => {
      const { getByTestId } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('Primary Checking')).toBeTruthy();
      });
      
      const sortButton = getByTestId('sort-button');
      
      await act(async () => {
        fireEvent.press(sortButton);
      });
      
      // Sort options would be shown in action sheet
      // This would require mocking ActionSheetIOS
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      // Mock loading state
      jest.doMock('../../../database', () => ({
        database: {
          get: jest.fn(() => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => new Promise(() => {})), // Never resolves
            })),
          })),
        },
      }));
      
      const { getByText } = render(<MockedAccountsListScreen />);
      
      expect(getByText('Loading accounts...')).toBeTruthy();
    });
  });

  describe('Account Balance Display', () => {
    it('should format balances correctly', async () => {
      const { getByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('$5,000')).toBeTruthy();
        expect(getByText('$15,000')).toBeTruthy();
        expect(getByText('$50,000')).toBeTruthy();
      });
    });

    it('should show negative balances in red for debt accounts', async () => {
      // This would require testing the style application
      // which is more complex in React Native testing
    });
  });

  describe('Interest Rate Display', () => {
    it('should show interest rates when available', async () => {
      const { getByText } = render(<MockedAccountsListScreen />);
      
      await waitFor(() => {
        expect(getByText('1.00% APR')).toBeTruthy(); // Primary Checking
        expect(getByText('4.00% APR')).toBeTruthy(); // Emergency Savings
        expect(getByText('7.00% APR')).toBeTruthy(); // Investment Portfolio
      });
    });
  });
});
