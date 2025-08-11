import { SecurityIntegrityService } from '../SecurityIntegrityService';

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-file-system', () => ({ getInfoAsync: jest.fn(async () => ({ exists: false })) }));

describe('SecurityIntegrityService', () => {
  it('should report low risk on normal device conditions', async () => {
    const svc = new SecurityIntegrityService();
    const report = await svc.checkIntegrity();
    expect(report.riskScore).toBeGreaterThanOrEqual(0);
    expect(report.riskScore).toBeLessThan(50);
    expect(report.isCompromised).toBe(false);
    expect(report.indicators.length).toBeGreaterThan(0);
  });
});

