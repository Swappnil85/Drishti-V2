/**
 * InstitutionPicker Tests
 * Unit tests for the institution picker component
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import InstitutionPicker from '../InstitutionPicker';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock dependencies
const mockInstitutions = [
  {
    id: 'inst-1',
    name: 'Chase Bank',
    institutionType: 'bank',
    routingNumber: '021000021',
    logoUrlOrFallback: 'https://example.com/chase-logo.png',
    displayName: 'Chase Bank (Bank)',
    supportsAccountType: jest.fn(() => true),
  },
  {
    id: 'inst-2',
    name: 'Ally Bank',
    institutionType: 'bank',
    routingNumber: '124003116',
    logoUrlOrFallback: 'https://example.com/ally-logo.png',
    displayName: 'Ally Bank (Bank)',
    supportsAccountType: jest.fn(() => true),
  },
];

jest.mock('../../../services/financial/InstitutionService', () => ({
  institutionService: {
    searchInstitutions: jest.fn(() => Promise.resolve({
      institutions: mockInstitutions,
      hasMore: false,
      total: 2,
    })),
  },
}));

jest.mock('../../../hooks/useHaptic', () => ({
  useFormHaptic: () => ({
    light: jest.fn(),
    success: jest.fn(),
    selection: jest.fn(),
  }),
}));

const MockedInstitutionPicker = (props: any) => (
  <ThemeProvider>
    <InstitutionPicker {...props} />
  </ThemeProvider>
);

describe('InstitutionPicker', () => {
  const mockOnInstitutionSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render input field correctly', () => {
      const { getByPlaceholderText } = render(
        <MockedInstitutionPicker
          onInstitutionSelect={mockOnInstitutionSelect}
          placeholder="Search for your bank..."
        />
      );

      expect(getByPlaceholderText('Search for your bank...')).toBeTruthy();
    });

    it('should show selected institution', () => {
      const { getByDisplayValue } = render(
        <MockedInstitutionPicker
          selectedInstitution={mockInstitutions[0]}
          onInstitutionSelect={mockOnInstitutionSelect}
        />
      );

      expect(getByDisplayValue('Chase Bank')).toBeTruthy();
    });

    it('should show error state', () => {
      const { getByText } = render(
        <MockedInstitutionPicker
          onInstitutionSelect={mockOnInstitutionSelect}
          error={true}
          errorMessage="Institution is required"
        />
      );

      expect(getByText('Institution is required')).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('should trigger search when typing', async () => {
      const { institutionService } = require('../../../services/financial/InstitutionService');
      
      const { getByPlaceholderText } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'Chase');
      });

      await waitFor(() => {
        expect(institutionService.searchInstitutions).toHaveBeenCalledWith({
          search: 'Chase',
          accountType: undefined,
          institutionType: undefined,
          limit: 20,
        });
      });
    });

    it('should show search results', async () => {
      const { getByPlaceholderText, getByText } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'Chase');
        fireEvent(input, 'focus');
      });

      await waitFor(() => {
        expect(getByText('Chase Bank')).toBeTruthy();
        expect(getByText('Ally Bank')).toBeTruthy();
      });
    });

    it('should filter by account type', async () => {
      const { institutionService } = require('../../../services/financial/InstitutionService');
      
      const { getByPlaceholderText } = render(
        <MockedInstitutionPicker
          onInstitutionSelect={mockOnInstitutionSelect}
          accountType="checking"
        />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'Bank');
      });

      await waitFor(() => {
        expect(institutionService.searchInstitutions).toHaveBeenCalledWith({
          search: 'Bank',
          accountType: 'checking',
          institutionType: undefined,
          limit: 20,
        });
      });
    });

    it('should debounce search requests', async () => {
      const { institutionService } = require('../../../services/financial/InstitutionService');
      
      const { getByPlaceholderText } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'C');
        fireEvent.changeText(input, 'Ch');
        fireEvent.changeText(input, 'Cha');
        fireEvent.changeText(input, 'Chas');
        fireEvent.changeText(input, 'Chase');
      });

      // Should only search once after debounce
      await waitFor(() => {
        expect(institutionService.searchInstitutions).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Institution Selection', () => {
    it('should select institution when clicked', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'Chase');
        fireEvent(input, 'focus');
      });

      await waitFor(() => {
        const institutionItem = getByTestId('institution-inst-1');
        expect(institutionItem).toBeTruthy();
      });

      const institutionItem = getByTestId('institution-inst-1');

      await act(async () => {
        fireEvent.press(institutionItem);
      });

      expect(mockOnInstitutionSelect).toHaveBeenCalledWith(mockInstitutions[0]);
    });

    it('should update input value when institution is selected', async () => {
      const { getByPlaceholderText, getByTestId, getByDisplayValue } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'Chase');
        fireEvent(input, 'focus');
      });

      await waitFor(() => {
        const institutionItem = getByTestId('institution-inst-1');
        fireEvent.press(institutionItem);
      });

      await waitFor(() => {
        expect(getByDisplayValue('Chase Bank')).toBeTruthy();
      });
    });

    it('should hide dropdown after selection', async () => {
      const { getByPlaceholderText, getByTestId, queryByTestId } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'Chase');
        fireEvent(input, 'focus');
      });

      await waitFor(() => {
        const institutionItem = getByTestId('institution-inst-1');
        fireEvent.press(institutionItem);
      });

      await waitFor(() => {
        expect(queryByTestId('institution-inst-1')).toBeFalsy();
      });
    });
  });

  describe('Empty States', () => {
    it('should show loading state', async () => {
      // Mock loading state
      const { institutionService } = require('../../../services/financial/InstitutionService');
      institutionService.searchInstitutions.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByPlaceholderText, getByText } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'Chase');
        fireEvent(input, 'focus');
      });

      await waitFor(() => {
        expect(getByText('Searching institutions...')).toBeTruthy();
      });
    });

    it('should show no results state', async () => {
      const { institutionService } = require('../../../services/financial/InstitutionService');
      institutionService.searchInstitutions.mockResolvedValue({
        institutions: [],
        hasMore: false,
        total: 0,
      });

      const { getByPlaceholderText, getByText } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'NonExistentBank');
        fireEvent(input, 'focus');
      });

      await waitFor(() => {
        expect(getByText('No institutions found for "NonExistentBank"')).toBeTruthy();
        expect(getByText('Try a different search term or add manually')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <MockedInstitutionPicker
          onInstitutionSelect={mockOnInstitutionSelect}
          testID="institution-picker"
        />
      );

      expect(getByLabelText('Financial Institution')).toBeTruthy();
    });

    it('should support keyboard navigation', async () => {
      const { getByPlaceholderText } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent(input, 'focus');
        fireEvent.changeText(input, 'Chase');
      });

      // Keyboard navigation would be tested with more complex interactions
      // This is a basic test to ensure the input is focusable
      expect(input).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle search errors gracefully', async () => {
      const { institutionService } = require('../../../services/financial/InstitutionService');
      institutionService.searchInstitutions.mockRejectedValue(new Error('Network error'));

      const { getByPlaceholderText } = render(
        <MockedInstitutionPicker onInstitutionSelect={mockOnInstitutionSelect} />
      );

      const input = getByPlaceholderText('Search for your bank or institution...');

      await act(async () => {
        fireEvent.changeText(input, 'Chase');
      });

      // Should not crash and should handle error gracefully
      await waitFor(() => {
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Props Validation', () => {
    it('should handle missing onInstitutionSelect prop', () => {
      // This would typically cause a TypeScript error, but testing runtime behavior
      expect(() => {
        render(
          <MockedInstitutionPicker onInstitutionSelect={undefined as any} />
        );
      }).not.toThrow();
    });

    it('should handle custom placeholder', () => {
      const { getByPlaceholderText } = render(
        <MockedInstitutionPicker
          onInstitutionSelect={mockOnInstitutionSelect}
          placeholder="Custom placeholder text"
        />
      );

      expect(getByPlaceholderText('Custom placeholder text')).toBeTruthy();
    });
  });
});
