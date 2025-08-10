import { apiService } from '../api/ApiService';

export class AttestationService {
  async verifyAndroid(token: string) {
    return apiService.request('/security/attestation/android', {
      method: 'POST',
      body: { token },
    });
  }
  async verifyIOS(token: string) {
    return apiService.request('/security/attestation/ios', {
      method: 'POST',
      body: { token },
    });
  }
}

export const attestationService = new AttestationService();
