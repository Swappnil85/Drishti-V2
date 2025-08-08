import { privacyService } from '../services/privacy/PrivacyService';

jest.mock('../db/connection', () => ({
  query: jest.fn(async (_q: string, _p: any[]) => ({ rows: [{ preferences: { consent: { marketing: true, analytics: false } } }] })),
  transaction: jest.fn(async (fn: any) => await fn({ query: jest.fn() })),
}));

describe('PrivacyService consent', () => {
  it('gets user consent with defaults', async () => {
    const c = await privacyService.getUserConsent('user-1');
    expect(c).toHaveProperty('marketing');
  });

  it('updates user consent', async () => {
    const res = await privacyService.updateUserConsent('user-1', { marketing: false, analytics: true });
    expect(res).toEqual({ success: true });
  });
});

