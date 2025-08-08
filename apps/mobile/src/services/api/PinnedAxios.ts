import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { pinningConfig } from '../security/PinningConfig';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetch: rnFetch } = require('react-native-ssl-pinning');

async function reportViolation(payload: any) {
  try {
    if (!pinningConfig.reportUrl) return;
    await fetch(pinningConfig.reportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {}
}

export function createPinnedAxios(baseURL: string): AxiosInstance {
  const instance = axios.create({ baseURL, timeout: 10000 });

  instance.defaults.adapter = async (config: AxiosRequestConfig) => {
    const url = (config.baseURL || '') + (config.url || '');

    // Ensure HTTPS and host allowlist
    const u = new URL(url);
    if (pinningConfig.enforceHttps && u.protocol !== 'https:') {
      throw new Error('HTTPS is required for pinned requests');
    }
    if (!pinningConfig.allowedHosts.includes(u.hostname)) {
      throw new Error(`Disallowed host for pinned requests: ${u.hostname}`);
    }

    const method = (config.method || 'get').toUpperCase();
    const headers = config.headers || {};
    const body = config.data ? JSON.stringify(config.data) : undefined;

    // react-native-ssl-pinning fetch requires sslPinning config
    const sslPinning = Platform.select({
      ios: { certs: pinningConfig.certIds },
      android: { certs: pinningConfig.certIds },
      default: { certs: pinningConfig.certIds },
    });

    let res: any;
    try {
      res = await rnFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(headers as any),
        },
        body,
        timeoutInterval: config.timeout || 10000,
        sslPinning,
      });
    } catch (e: any) {
      await reportViolation({ url, reason: e?.message || 'pinning_failed', expectedHosts: pinningConfig.allowedHosts });
      throw e;
    }

    const status = res.status;
    const statusText = res.statusText || '';
    const responseHeaders = res.headers || {};
    let responseData: any = null;
    try {
      responseData = res.data ? JSON.parse(res.data) : null;
    } catch {
      responseData = res.data;
    }

    return {
      data: responseData,
      status,
      statusText,
      headers: responseHeaders,
      config,
      request: null as any,
    };
  } as any;

  return instance;
}

