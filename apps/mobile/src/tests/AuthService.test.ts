import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authService, AuthService } from '../services/auth/AuthService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', Version: '15.0' }
}));

// Mock fetch
global.fetch = jest.fn();

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance for testing
    (AuthService as any).instance = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          email_verified: true,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      mockSecureStore.setItemAsync.mockResolvedValue();
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.data?.tokens.accessToken).toBe('mock-access-token');

      // Verify tokens were stored securely
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'access_token',
        'mock-access-token'
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'refresh_token',
        'mock-refresh-token'
      );
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Registration', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 'user-123',
          email: 'newuser@example.com',
          name: 'New User',
          email_verified: false,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        requiresEmailVerification: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await authService.register({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'SecurePassword123!'
      });

      expect(result.success).toBe(true);
      expect(result.requiresEmailVerification).toBe(true);
    });

    it('should handle registration validation errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Password validation failed: Password must be at least 8 characters long',
        code: 'VALIDATION_ERROR'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await authService.register({
        name: 'New User',
        email: 'newuser@example.com',
        password: '123' // Weak password
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password validation failed');
    });
  });

  describe('Token Management', () => {
    it('should store tokens securely on mobile platforms', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600
      };

      mockSecureStore.setItemAsync.mockResolvedValue();
      mockAsyncStorage.setItem.mockResolvedValue();

      // Access private method for testing
      const authServiceInstance = authService as any;
      await authServiceInstance.storeTokens(tokens);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'access_token',
        'access-token'
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token'
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'token_expires_in',
        '3600'
      );
    });

    it('should retrieve stored tokens', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('stored-access-token')
        .mockResolvedValueOnce('stored-refresh-token');
      mockAsyncStorage.getItem.mockResolvedValueOnce('3600');

      const authServiceInstance = authService as any;
      const tokens = await authServiceInstance.getStoredTokens();

      expect(tokens).toEqual({
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
        expiresIn: 3600
      });
    });

    it('should handle missing tokens gracefully', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const authServiceInstance = authService as any;
      const tokens = await authServiceInstance.getStoredTokens();

      expect(tokens).toBeNull();
    });

    it('should refresh access token', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      mockAsyncStorage.getItem.mockResolvedValueOnce('stored-refresh-token');
      mockAsyncStorage.setItem.mockResolvedValue();

      const newToken = await authService.refreshAccessToken();

      expect(newToken).toBe('new-access-token');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'access_token',
        'new-access-token'
      );
    });
  });

  describe('Authentication State', () => {
    it('should initialize authentication state from stored data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        email_verified: true,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      const mockTokens = {
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
        expiresIn: 3600
      };

      // Mock stored data
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('stored-access-token')
        .mockResolvedValueOnce('stored-refresh-token');
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('3600')
        .mockResolvedValueOnce(JSON.stringify(mockUser));

      // Mock token verification
      mockFetch.mockResolvedValueOnce({
        ok: true
      } as Response);

      // Create new instance to trigger initialization
      const newAuthService = new (AuthService as any)();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const authState = newAuthService.getAuthState();

      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toEqual(mockUser);
      expect(authState.isLoading).toBe(false);
    });

    it('should handle authentication state listeners', () => {
      const listener = jest.fn();
      const unsubscribe = authService.addAuthListener(listener);

      // Trigger state change (would normally happen during login)
      const authServiceInstance = authService as any;
      authServiceInstance.notifyListeners();

      expect(listener).toHaveBeenCalled();

      // Test unsubscribe
      unsubscribe();
      authServiceInstance.notifyListeners();

      // Should not be called again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Logout', () => {
    it('should clear all authentication data on logout', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValueOnce('stored-access-token');

      mockFetch.mockResolvedValueOnce({
        ok: true
      } as Response);

      await authService.logout();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'access_token',
        'refresh_token'
      ]);
    });
  });

  describe('Security', () => {
    it('should include device info in requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Test' })
      } as Response);

      await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Device-Info': expect.any(String)
          })
        })
      );
    });

    it('should sanitize email input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Test' })
      } as Response);

      await authService.login({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123'
      });

      const requestBody = JSON.parse(
        (mockFetch.mock.calls[0][1] as any).body
      );

      expect(requestBody.email).toBe('test@example.com');
    });
  });
});
