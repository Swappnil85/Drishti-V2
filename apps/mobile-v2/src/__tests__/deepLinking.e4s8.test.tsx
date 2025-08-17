import { parseDeepLink, handleDeepLink } from '../utils/deepLinking';
import { logEvent } from '../telemetry';

// Mock telemetry
jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;

describe('E4-S8: Deep Link Routing (Basic)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseDeepLink', () => {
    it('should parse drishti://paywall correctly', () => {
      const result = parseDeepLink('drishti://paywall');
      
      expect(result).toEqual({
        screen: 'Paywall',
      });
      expect(mockLogEvent).toHaveBeenCalledWith('deeplink_open', { path: 'paywall' });
    });

    it('should parse drishti://accounts correctly', () => {
      const result = parseDeepLink('drishti://accounts');
      
      expect(result).toEqual({
        screen: 'Accounts',
      });
      expect(mockLogEvent).toHaveBeenCalledWith('deeplink_open', { path: 'accounts' });
    });

    it('should return null for unsupported schemes', () => {
      const result = parseDeepLink('https://example.com');
      
      expect(result).toBeNull();
      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('should return null for unsupported paths', () => {
      const result = parseDeepLink('drishti://unknown');
      
      expect(result).toBeNull();
      expect(mockLogEvent).toHaveBeenCalledWith('deeplink_open', { path: 'unknown' });
    });

    it('should handle invalid URLs gracefully', () => {
      const result = parseDeepLink('invalid-url');
      
      expect(result).toBeNull();
      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('should handle URLs with hostname format', () => {
      const result = parseDeepLink('drishti://paywall/');
      
      expect(result).toEqual({
        screen: 'Paywall',
      });
      expect(mockLogEvent).toHaveBeenCalledWith('deeplink_open', { path: 'paywall' });
    });
  });

  describe('handleDeepLink', () => {
    it('should navigate to paywall for valid paywall link', () => {
      const mockNavigate = jest.fn();
      const result = handleDeepLink('drishti://paywall', mockNavigate);
      
      expect(result).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('Paywall', undefined);
    });

    it('should navigate to accounts for valid accounts link', () => {
      const mockNavigate = jest.fn();
      const result = handleDeepLink('drishti://accounts', mockNavigate);
      
      expect(result).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('Accounts', undefined);
    });

    it('should return false for invalid links', () => {
      const mockNavigate = jest.fn();
      const result = handleDeepLink('https://example.com', mockNavigate);
      
      expect(result).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should return false for unsupported deep links', () => {
      const mockNavigate = jest.fn();
      const result = handleDeepLink('drishti://unknown', mockNavigate);
      
      expect(result).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('telemetry integration', () => {
    it('should log telemetry for all valid deep links', () => {
      parseDeepLink('drishti://paywall');
      parseDeepLink('drishti://accounts');
      
      expect(mockLogEvent).toHaveBeenCalledTimes(2);
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, 'deeplink_open', { path: 'paywall' });
      expect(mockLogEvent).toHaveBeenNthCalledWith(2, 'deeplink_open', { path: 'accounts' });
    });

    it('should log telemetry even for unsupported paths', () => {
      parseDeepLink('drishti://unsupported');
      
      expect(mockLogEvent).toHaveBeenCalledWith('deeplink_open', { path: 'unsupported' });
    });
  });
});
