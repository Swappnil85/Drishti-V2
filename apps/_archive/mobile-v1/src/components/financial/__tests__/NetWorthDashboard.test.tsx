import React from 'react';
import { render } from '@testing-library/react-native';

// Mock problematic native/Expo deps early
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../../services/haptic/HapticService', () => ({
  HapticService: { impact: jest.fn() },
}));
// Mock NetWorthService to avoid WatermelonDB native import in tests
jest.mock('../../../services/financial/NetWorthService', () => ({
  netWorthService: {
    getNetWorthComparisons: jest.fn().mockResolvedValue([]),
    getNetWorthMilestones: jest.fn().mockResolvedValue([]),
  },
}));

// Mock hooks to control data
jest.mock('../../../hooks/useNetWorthSummary', () => ({
  useNetWorthSummary: () => ({
    data: {
      totalNetWorth: 123456,
      totalAssets: 200000,
      totalLiabilities: 76544,
      accountBreakdown: [],
      lastUpdated: new Date(),
    },
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useNetWorthTrends', () => ({
  useNetWorthTrends: () => ({
    data: [
      { month: 'Jan', value: 100000 },
      { month: 'Feb', value: 105000 },
      { month: 'Mar', value: 110000 },
      { month: 'Apr', value: 115000 },
    ],
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../../hooks/useHaptic', () => ({
  useFormHaptic: () => ({ light: jest.fn() }),
}));

// Import after mocks
import NetWorthDashboard from '../NetWorthDashboard';
describe('NetWorthDashboard', () => {
  it('renders big number and assets/liabilities chips', () => {
    const { getByText } = render(<NetWorthDashboard compact />);
    expect(getByText(/Total Net Worth/i)).toBeTruthy();
    expect(getByText(/\$123,456/)).toBeTruthy();
    expect(getByText(/Assets/i)).toBeTruthy();
    expect(getByText(/Liabilities/i)).toBeTruthy();
  });
});
