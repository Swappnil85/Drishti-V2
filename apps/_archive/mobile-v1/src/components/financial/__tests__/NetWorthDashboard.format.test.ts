import {
  formatCurrency as __formatCurrency,
  formatPercentage as __formatPercentage,
} from '../NetWorthDashboard.utils';

describe('NetWorthDashboard formatting helpers', () => {
  test('currency formats without decimals', () => {
    expect(__formatCurrency(0)).toBe('$0');
    expect(__formatCurrency(1234)).toBe('$1,234');
    expect(__formatCurrency(1234567)).toBe('$1,234,567');
  });

  test('percentage includes sign and one decimal', () => {
    expect(__formatPercentage(0)).toBe('+0.0%');
    expect(__formatPercentage(1.234)).toBe('+1.2%');
    expect(__formatPercentage(-3.21)).toBe('-3.2%');
  });
});
