import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api/ApiService';
import { authService } from '../services/auth/AuthService';
import { netWorthService, NetWorthData } from '../services/financial/NetWorthService';

interface ApiSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  accounts_by_type: Record<string, { count: number; balance: number }>;
}

export interface UseNetWorthSummaryResult {
  data: NetWorthData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNetWorthSummary(userId?: string): UseNetWorthSummaryResult {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mapApiToNetWorthData = useCallback((api: ApiSummary): NetWorthData => {
    const totalAssets = api.total_assets || 0;
    const totalLiabilities = api.total_liabilities || 0;
    const totalNetWorth = api.net_worth ?? totalAssets - totalLiabilities;

    const accountBreakdown = Object.entries(api.accounts_by_type || {})
      .map(([accountType, v]) => ({
        accountType,
        totalBalance: v.balance,
        accountCount: v.count,
        percentage: totalNetWorth !== 0 ? (v.balance / totalNetWorth) * 100 : 0,
        accounts: [],
      }))
      .sort((a, b) => Math.abs(b.totalBalance) - Math.abs(a.totalBalance));

    return {
      totalNetWorth,
      totalAssets,
      totalLiabilities,
      accountBreakdown,
      lastUpdated: new Date(),
    };
  }, []);

  const fetchRemote = useCallback(async () => {
    if (!userId) return;
    const token = await authService.getAccessToken();
    const res = await apiService.get<{ success: boolean; data: ApiSummary }>(
      '/financial/networth/summary',
      token ? { Authorization: `Bearer ${token}` } : undefined
    );
    if (!res.success) {
      throw new Error(res.error || 'Failed to fetch summary');
    }
    const payload = res.data as any;
    const apiSummary: ApiSummary = payload?.data || payload; // unwrap if service wrapped
    return mapApiToNetWorthData(apiSummary);
  }, [mapApiToNetWorthData, userId]);

  const fetchFallback = useCallback(async () => {
    if (!userId) return null;
    return await netWorthService.calculateNetWorth(userId);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const remote = await fetchRemote();
      if (remote) setData(remote);
      else throw new Error('Empty response');
    } catch (e) {
      try {
        const local = await fetchFallback();
        if (local) {
          setData(local);
        } else {
          throw new Error('No data available');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchRemote, fetchFallback, userId]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return useMemo(
    () => ({ data, loading, error, refresh }),
    [data, loading, error, refresh]
  );
}

export default useNetWorthSummary;

