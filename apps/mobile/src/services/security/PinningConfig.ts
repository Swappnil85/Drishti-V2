export interface PinConfig {
  enabled: boolean; // feature flag to enable pinning transport
  allowedHosts: string[]; // e.g., ['api.drishti.app']
  enforceHttps: boolean; // require https scheme
  certIds: string[]; // IDs of bundled certs/public keys (without extensions)
  reportUrl?: string; // backend violation report endpoint
}

export const pinningConfig: PinConfig = {
  enabled:
    (process.env.EXPO_PUBLIC_USE_PINNED_CLIENT || '').toLowerCase() === 'true',
  enforceHttps: true,
  certIds: ['drishti', 'drishti-backup'], // placeholders; provide actual IDs per env
  reportUrl:
    (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '') +
    '/security/pinning/violation',
  // Allow local dev hosts in dev builds only; in production restrict to known domains.
  allowedHosts: [
    'api.drishti.app', // Production/domain
    'localhost', // Dev
    '127.0.0.1', // Dev
  ],
};
