import { useCallback, useEffect, useMemo, useState } from 'react';
import database, { Q } from '../database';

interface HistoryRow {
  id: string;
  accountId: string;
  previousBalance: number;
  newBalance: number;
  createdAt: string | Date;
}

// Group BalanceHistory rows by month (YYYY-MM) and take the last newBalance of the month
function computeMonthlySeries(rows: HistoryRow[], currentBalance?: number): number[] {
  // Normalize dates and sort ascending
  const parsed = rows
    .map(r => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
    }))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const byMonth = new Map<string, number>();
  for (const r of parsed) {
    const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
    // overwrite so that last in month remains
    byMonth.set(key, r.newBalance);
  }

  // Ensure we have up to 12 months ending at current month
  const now = new Date();
  const series: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const v = byMonth.get(key);
    if (v !== undefined) series.push(v);
    else if (series.length > 0) series.push(series[series.length - 1]);
    else if (currentBalance !== undefined) series.push(currentBalance);
    else series.push(0);
  }
  return series;
}

export function useAccountSparkline(accountId?: string, currentBalance?: number) {
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const collection = database.get('balance_history');
      const rows = (await collection
        .query(Q.where('account_id', accountId))
        .fetch()) as any[];
      const series = computeMonthlySeries(rows as HistoryRow[], currentBalance);
      setData(series);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [accountId, currentBalance]);

  useEffect(() => { refresh(); }, [refresh]);

  return useMemo(() => ({ data, loading, error, refresh }), [data, loading, error, refresh]);
}

export default useAccountSparkline;
export { computeMonthlySeries };

