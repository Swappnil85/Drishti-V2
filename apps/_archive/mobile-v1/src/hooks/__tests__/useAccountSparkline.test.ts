import { computeMonthlySeries } from '../useAccountSparkline';

describe('computeMonthlySeries', () => {
  it('builds a 12-point series filling missing months', () => {
    const now = new Date();
    const rows = [
      { id: '1', accountId: 'a', previousBalance: 800, newBalance: 900, createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 15) },
      { id: '2', accountId: 'a', previousBalance: 900, newBalance: 1000, createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 15) },
    ];
    const series = computeMonthlySeries(rows as any, 1100);
    expect(series).toHaveLength(12);
    // last point corresponds to current month, should equal currentBalance if no row
    expect(series[11]).toBe(1100);
  });
});

