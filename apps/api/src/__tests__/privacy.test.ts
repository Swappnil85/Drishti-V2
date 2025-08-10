import { privacyService } from '../services/privacy/PrivacyService';

describe('PrivacyService', () => {
  it('should generate JSON export structure', async () => {
    // This test uses a fake user id and expects no throw; DB calls may fail without DB
    // So we mock privacyService.getUserData
    const spy = jest
      .spyOn(privacyService as any, 'getUserData')
      .mockResolvedValue({
        user: { id: 'u', email: 'e' },
        accounts: [],
        goals: [],
        scenarios: [],
      });

    const res = await privacyService.exportData('user-1', { format: 'json' });
    expect(res.format).toBe('json');
    expect((res as any).data).toBeDefined();

    spy.mockRestore();
  });

  it('should produce CSV for single type', async () => {
    const spy = jest
      .spyOn(privacyService as any, 'getUserData')
      .mockResolvedValue({
        accounts: [
          { id: 'a1', name: 'Checking', balance: 100 },
          { id: 'a2', name: 'Savings', balance: 200 },
        ],
      });

    const res = await privacyService.exportData('user-1', {
      format: 'csv',
      types: ['accounts'],
    });
    expect(res.format).toBe('csv');
    // @ts-ignore
    expect(res.csv).toContain('id,name,balance');

    spy.mockRestore();
  });
});
