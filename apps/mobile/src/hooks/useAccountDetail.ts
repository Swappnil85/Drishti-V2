import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api/ApiService';
import { authService } from '../services/auth/AuthService';

export interface AccountDetail {
  id: string;
  name: string;
  account_type: string;
  institution?: string;
  balance: number;
  currency: string;
  interest_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAccountDetail(accountId?: string) {
  const [data, setData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await authService.getAccessToken();
      const res = await apiService.get<{ success: boolean; data: AccountDetail }>(
        `/financial/accounts/${accountId}`,
        token ? { Authorization: `Bearer ${token}` } : undefined
      );
      if (!(res as any).id && !res.success) throw new Error(res.error || 'Failed to load account');
      const payload: any = (res as any).id ? res : (res.data as any).data || res.data;
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return useMemo(() => ({ data, loading, error, refresh: fetchDetail }), [data, loading, error, fetchDetail]);
}

export default useAccountDetail;

