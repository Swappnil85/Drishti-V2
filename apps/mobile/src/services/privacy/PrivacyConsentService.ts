import { ApiService } from '../api/ApiService';

export type Consent = { marketing?: boolean; analytics?: boolean; personalization?: boolean };

export class PrivacyConsentService {
  constructor(private api: ApiService) {}

  async getPolicy() {
    return this.api.request<{ policy: any }>({ endpoint: '/privacy/policy', method: 'GET' });
  }
  async getConsent() {
    return this.api.request<{ consent: Consent }>({ endpoint: '/privacy/consent', method: 'GET', methodOverride: 'GET' } as any);
  }
  async updateConsent(consent: Consent) {
    return this.api.request({ endpoint: '/privacy/consent', method: 'PUT', body: { consent } });
  }
  async scheduleDeletion(days: number) {
    return this.api.request({ endpoint: '/privacy/delete', method: 'POST', body: { scheduleDays: days } });
  }
}

