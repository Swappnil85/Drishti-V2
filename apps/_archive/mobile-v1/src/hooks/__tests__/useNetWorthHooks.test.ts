import { renderHook, act } from '@testing-library/react-hooks';
import { useNetWorthSummary } from '../../hooks/useNetWorthSummary';
import { useNetWorthTrends } from '../../hooks/useNetWorthTrends';

jest.mock('../../services/api/ApiService', () => {
  const real = jest.requireActual('../../services/api/ApiService');
  return {
    ...real,
    apiService: {
      get: jest.fn(async (endpoint: string) => {
        if (endpoint.startsWith('/financial/networth/summary')) {
          return { success: true, data: { total_assets: 1000, total_liabilities: 200, net_worth: 800, accounts_by_type: { checking: { count: 1, balance: 1000 } } } };
        }
        if (endpoint.startsWith('/financial/networth/trends')) {
          return { success: true, data: [{ month: 'Jan', value: 1000 }, { month: 'Feb', value: 1200 }] };
        }
        throw new Error('Unknown endpoint');
      })
    }
  };
});

jest.mock('../../services/auth/AuthService', () => ({
  authService: { getAccessToken: jest.fn(async () => 'TEST_TOKEN') }
}));

describe('useNetWorth hooks', () => {
  it('fetches summary and maps values', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetWorthSummary('user-1'));
    await waitForNextUpdate();
    expect(result.current.data?.totalNetWorth).toBe(800);
    expect(result.current.data?.totalAssets).toBe(1000);
    expect(result.current.data?.totalLiabilities).toBe(200);
    expect(result.current.error).toBeNull();
  });

  it('fetches trends points', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetWorthTrends('user-1', 12));
    await waitForNextUpdate();
    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.data[0]).toHaveProperty('value');
  });
});

