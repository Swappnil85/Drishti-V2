/**
 * API Service
 * Centralized API communication service
 *
 * Security: Pre-pinning guards ensure HTTPS and host allowlist before making requests.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  usePinnedClient?: boolean; // Stage 2: use native SSL pinning axios adapter
}

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private defaultTimeout: number = 10000;

  private constructor() {
    this.baseUrl =
      process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  }

  private assertPinnedTarget(url: string) {
    try {
      const u = new URL(url);
      const host = u.hostname;
      const scheme = u.protocol.replace(':', '');

      // Enforce HTTPS (allow http for localhost/127.0.0.1 during dev preview)
      const { pinningConfig } = require('../security/PinningConfig');
      const isLocalDevHost = host === 'localhost' || host === '127.0.0.1';
      if (pinningConfig.enforceHttps && scheme !== 'https' && !isLocalDevHost) {
        throw new Error(`Insecure scheme: ${scheme}. HTTPS is required.`);
      }

      // Allow host list
      if (!pinningConfig.allowedHosts.includes(host)) {
        throw new Error(`Disallowed API host: ${host}`);
      }
    } catch (e) {
      throw e instanceof Error
        ? e
        : new Error('Invalid URL or pinning guard failed');
    }
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Make an API request
   */
  public async request<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const {
        method = 'GET',
        headers = {},
        body,
        timeout = this.defaultTimeout,
      } = config;

      const url = `${this.baseUrl}${endpoint}`;
      // Pre-pinning guard
      this.assertPinnedTarget(url);

      // Stage 2: optionally use pinned axios transport
      if (config.usePinnedClient) {
        const { createPinnedAxios } = require('./PinnedAxios');
        const client = createPinnedAxios(this.baseUrl);
        const axRes = await client.request({
          url: endpoint,
          method,
          data: body,
          headers,
          timeout,
        });
        return { success: true, data: axRes.data as T };
      }

      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: AbortSignal.timeout(timeout),
      };

      if (body && method !== 'GET') {
        requestConfig.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API Request failed:', error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * GET request
   */
  public async get<T = any>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  /**
   * POST request
   */
  public async post<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  /**
   * PUT request
   */
  public async put<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }

  /**
   * Set base URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set default timeout
   */
  public setTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }
}

export const apiService = ApiService.getInstance();
export default ApiService;
