import { verifyPin, getLockoutRemainingTime } from './secureLock';

describe('secureLock utils', () => {
  it('should verify PIN correctly', async () => {
    expect(await verifyPin('1234', '1234')).toBe(true);
    expect(await verifyPin('5678', '1234')).toBe(false);
    expect(await verifyPin('1234', null)).toBe(false);
  });

  it('should return 0 for lockout time when not locked out', () => {
    expect(getLockoutRemainingTime(null)).toBe(0);
  });

  it('should return remaining lockout time', () => {
    const futureTime = Date.now() + 15000;
    const remaining = getLockoutRemainingTime(futureTime);
    expect(remaining).toBeGreaterThan(14);
    expect(remaining).toBeLessThanOrEqual(15);
  });

  it('should return 0 for past lockout time', () => {
    const pastTime = Date.now() - 5000;
    expect(getLockoutRemainingTime(pastTime)).toBe(0);
  });
});
