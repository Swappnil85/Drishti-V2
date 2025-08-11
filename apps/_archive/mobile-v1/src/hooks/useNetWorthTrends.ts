import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api/ApiService';
import { authService } from '../services/auth/AuthService';

export interface TrendPoint {
  month: string; // e.g., 'Jan'
  value: number; // net worth amount
}

export interface UseNetWorthTrendsResult {
  data: TrendPoint[];
  loading: boolean;
  error: string | null;
  refresh: (months?: number) => Promise<void>;
}

export function useNetWorthTrends(userId?: string, defaultMonths: number = 12): UseNetWorthTrendsResult {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<number>(defaultMonths);

  const fetchRemote = useCallback(async (m: number) => {
    const token = await authService.getAccessToken();
    const res = await apiService.get<{ success: boolean; data: TrendPoint[] }>(
      `/financial/networth/trends?months=${m}`,
      token ? { Authorization: `Bearer ${token}` } : undefined
    );
    if (!res.success) throw new Error(res.error || 'Failed to fetch trends');
    const payload = res.data as any;
    const arr: TrendPoint[] = payload?.data || payload;
    return arr;
  }, []);

  const refresh = useCallback(async (m?: number) => {
    const target = m ?? months;
    setLoading(true);
    setError(null);
    try {
      const arr = await fetchRemote(target);
      setData(arr);
      setMonths(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetchRemote, months]);

  useEffect(() => {
    refresh(defaultMonths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return useMemo(() => ({ data, loading, error, refresh }), [data, loading, error, refresh]);
}

export default useNetWorthTrends;

