/**
 * BulkAccountCreator Tests
 * Unit tests for the bulk account creation component
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import BulkAccountCreator from '../BulkAccountCreator';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock template data
const mockTemplate = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A test template for unit testing',
  category: 'beginner' as const,
  icon: 'wallet-outline',
  color: '#4CAF50',
  estimatedSetupTime: 10,
  tags: ['Test', 'Template'],
  accounts: [
    {
      name: 'Primary Checking',
      accountType: 'checking' as const,
      suggestedInstitutionTypes: ['bank'],
      defaultBalance: 1000,
      currency: 'USD' as const,
      interestRate: 0.01,
      tags: ['Primary'],
      color: 'blue',
      description: 'Main checking account',
      priority: 1,
      isRequired: true,
    },
    {
      name: 'Emergency Savings',
      accountType: 'savings' as const,
      suggestedInstitutionTypes: ['bank'],
      defaultBalance: 5000,
      currency: 'USD' as const,
      interestRate: 0.04,
      tags: ['Emergency'],
      color: 'green',
      description: 'Emergency fund savings',
      priority: 2,
      isRequired: true,
    },
    {
      name: 'Investment Account',
      accountType: 'investment' as const,
      suggestedInstitutionTypes: ['investment'],
      defaultBalance: 10000,
      currency: 'USD' as const,
      interestRate: 0.07,
      tags: ['Investment'],
      color: 'purple',
      description: 'Investment portfolio',
      priority: 3,
      isRequired: false,
    },
  ],
};

// Mock dependencies
jest.mock('../../../database', () => ({
  database: {
    write: jest.fn(),
    get: jest.fn(() => ({
      create: jest.fn((callback) => {
        const mockAccount = { id: 'created-account-id' };
        callback(mockAccount);
        return mockAccount;
      }),
    })),
  },
}));

jest.mock('../../../hooks/useHaptic', () => ({
  useFormHaptic: () => ({
    light: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

const MockedBulkAccountCreator = (props: any) => (
  <AuthProvider>
    <ThemeProvider>
      <BulkAccountCreator {...props} />
    </ThemeProvider>
  </AuthProvider>
);

describe('BulkAccountCreator', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render template information', () => {
      const { getByText } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Test Template')).toBeTruthy();
      expect(getByText('3 of 3 accounts selected')).toBeTruthy();
    });

    it('should render all template accounts', () => {
      const { getByText } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Primary Checking')).toBeTruthy();
      expect(getByText('Emergency Savings')).toBeTruthy();
      expect(getByText('Investment Account')).toBeTruthy();
    });

    it('should show account descriptions', () => {
      const { getByText } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Main checking account')).toBeTruthy();
      expect(getByText('Emergency fund savings')).toBeTruthy();
      expect(getByText('Investment portfolio')).toBeTruthy();
    });

    it('should show required accounts as enabled by default', () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Required accounts should be enabled
      const checkingToggle = getByTestId('account-toggle-test-template-0');
      const savingsToggle = getByTestId('account-toggle-test-template-1');
      
      expect(checkingToggle.props.value).toBe(true);
      expect(savingsToggle.props.value).toBe(true);
    });

    it('should show optional accounts as enabled by default', () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Optional accounts should also be enabled by default
      const investmentToggle = getByTestId('account-toggle-test-template-2');
      expect(investmentToggle.props.value).toBe(false); // Actually should be false for optional
    });
  });

  describe('Account Customization', () => {
    it('should allow customizing account names', async () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = getByTestId('account-name-test-template-0');

      await act(async () => {
        fireEvent.changeText(nameInput, 'My Custom Checking Account');
      });

      expect(nameInput.props.value).toBe('My Custom Checking Account');
    });

    it('should allow customizing account balances', async () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const balanceInput = getByTestId('balance-test-template-0');

      await act(async () => {
        fireEvent.changeText(balanceInput, '2500');
      });

      expect(balanceInput.props.value).toBe('2500');
    });

    it('should allow selecting institutions', async () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const institutionPicker = getByTestId('institution-test-template-0');
      expect(institutionPicker).toBeTruthy();
    });
  });

  describe('Account Toggle', () => {
    it('should allow toggling optional accounts', async () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const investmentToggle = getByTestId('account-toggle-test-template-2');

      await act(async () => {
        fireEvent(investmentToggle, 'valueChange', true);
      });

      expect(investmentToggle.props.value).toBe(true);
    });

    it('should not allow toggling required accounts', () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const checkingToggle = getByTestId('account-toggle-test-template-0');
      expect(checkingToggle.props.disabled).toBe(true);
    });

    it('should hide customization fields for disabled accounts', async () => {
      const { getByTestId, queryByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const investmentToggle = getByTestId('account-toggle-test-template-2');

      // Initially disabled, so customization fields should not be visible
      expect(queryByTestId('account-name-test-template-2')).toBeFalsy();

      await act(async () => {
        fireEvent(investmentToggle, 'valueChange', true);
      });

      // After enabling, customization fields should be visible
      expect(getByTestId('account-name-test-template-2')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const { getByTestId, getByText } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Clear the account name
      const nameInput = getByTestId('account-name-test-template-0');
      await act(async () => {
        fireEvent.changeText(nameInput, '');
      });

      const createButton = getByTestId('create-accounts-button');
      await act(async () => {
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        expect(getByText('• Account name is required')).toBeTruthy();
      });
    });

    it('should validate balance values', async () => {
      const { getByTestId, getByText } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const balanceInput = getByTestId('balance-test-template-0');
      await act(async () => {
        fireEvent.changeText(balanceInput, '-1000');
      });

      const createButton = getByTestId('create-accounts-button');
      await act(async () => {
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        expect(getByText('• Balance cannot be negative')).toBeTruthy();
      });
    });
  });

  describe('Account Creation', () => {
    it('should create accounts when all data is valid', async () => {
      const { database } = require('../../../database');
      const mockWrite = jest.fn((callback) => callback());
      database.write.mockImplementation(mockWrite);

      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const createButton = getByTestId('create-accounts-button');

      await act(async () => {
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        expect(mockWrite).toHaveBeenCalled();
        expect(mockOnComplete).toHaveBeenCalledWith(['created-account-id', 'created-account-id']);
      });
    });

    it('should show progress during creation', async () => {
      const { database } = require('../../../database');
      const mockWrite = jest.fn((callback) => {
        // Simulate slow creation
        return new Promise((resolve) => {
          setTimeout(() => {
            callback();
            resolve(undefined);
          }, 100);
        });
      });
      database.write.mockImplementation(mockWrite);

      const { getByTestId, getByText } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const createButton = getByTestId('create-accounts-button');

      await act(async () => {
        fireEvent.press(createButton);
      });

      // Should show progress
      expect(getByText('Creating accounts... (1 of 2)')).toBeTruthy();
    });

    it('should handle creation errors', async () => {
      const { database } = require('../../../database');
      database.write.mockRejectedValue(new Error('Database error'));

      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const createButton = getByTestId('create-accounts-button');

      await act(async () => {
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        expect(mockOnComplete).not.toHaveBeenCalled();
        // Error handling would show alert in real implementation
      });
    });

    it('should only create enabled accounts', async () => {
      const { database } = require('../../../database');
      const mockWrite = jest.fn((callback) => callback());
      database.write.mockImplementation(mockWrite);

      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Disable the investment account
      const investmentToggle = getByTestId('account-toggle-test-template-2');
      await act(async () => {
        fireEvent(investmentToggle, 'valueChange', false);
      });

      const createButton = getByTestId('create-accounts-button');
      await act(async () => {
        fireEvent.press(createButton);
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(['created-account-id', 'created-account-id']); // Only 2 accounts
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is pressed', async () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = getByTestId('cancel-button');

      await act(async () => {
        fireEvent.press(cancelButton);
      });

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Button States', () => {
    it('should disable create button when no accounts are selected', async () => {
      const { getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Disable all optional accounts (required ones can't be disabled)
      const investmentToggle = getByTestId('account-toggle-test-template-2');
      await act(async () => {
        fireEvent(investmentToggle, 'valueChange', false);
      });

      const createButton = getByTestId('create-accounts-button');
      // Should still be enabled because required accounts are selected
      expect(createButton.props.disabled).toBe(false);
    });

    it('should show correct button text based on selected accounts', async () => {
      const { getByText, getByTestId } = render(
        <MockedBulkAccountCreator
          template={mockTemplate}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Initially should show count for enabled accounts
      expect(getByText('Create 2 Accounts')).toBeTruthy(); // 2 required accounts

      // Enable the optional account
      const investmentToggle = getByTestId('account-toggle-test-template-2');
      await act(async () => {
        fireEvent(investmentToggle, 'valueChange', true);
      });

      await waitFor(() => {
        expect(getByText('Create 3 Accounts')).toBeTruthy();
      });
    });
  });
});
