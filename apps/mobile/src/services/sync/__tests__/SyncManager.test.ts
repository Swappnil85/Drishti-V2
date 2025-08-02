import { SyncManager } from '../SyncManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { authService } from '../../auth/AuthService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../auth/AuthService');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('SyncManager', () => {
  let syncManager: SyncManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton
    (SyncManager as any).instance = undefined;
    syncManager = SyncManager.getInstance();

    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    mockAsyncStorage.multiRemove.mockResolvedValue();

    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      type: 'wifi',
    } as any);

    mockNetInfo.addEventListener.mockReturnValue(() => {});

    mockAuthService.getAccessToken.mockResolvedValue('test-token');
  });

  describe('initialization', () => {
    it('should initialize device ID', async () => {
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('device_id');
    });

    it('should generate new device ID if none exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const newSyncManager = SyncManager.getInstance();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'device_id',
        expect.stringMatching(/^device_\d+_[a-z0-9]+$/)
      );
    });

    it('should use existing device ID', async () => {
      const existingDeviceId = 'existing-device-123';
      mockAsyncStorage.getItem.mockResolvedValueOnce(existingDeviceId);
      
      const newSyncManager = SyncManager.getInstance();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalledWith('device_id', expect.anything());
    });
  });

  describe('getSyncStatus', () => {
    it('should return correct sync status when online', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: true } as any);
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('1234567890') // last_sync_timestamp
        .mockResolvedValueOnce(null) // last_sync_error
        .mockResolvedValueOnce('[]'); // sync_conflicts

      const status = await syncManager.getSyncStatus();

      expect(status.isOnline).toBe(true);
      expect(status.lastSync).toBe(1234567890);
      expect(status.lastError).toBeNull();
      expect(status.conflictsCount).toBe(0);
    });

    it('should return correct sync status when offline', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false } as any);

      const status = await syncManager.getSyncStatus();

      expect(status.isOnline).toBe(false);
    });
  });

  describe('queueChange', () => {
    it('should queue a change for sync', async () => {
      const testData = {
        id: 'test-123',
        name: 'Test Account',
        user_id: 'user-456',
      };

      await syncManager.queueChange('financial_accounts', 'create', testData);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_queue',
        expect.stringContaining('financial_accounts')
      );
    });

    it('should trigger auto-sync when online', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: true } as any);
      
      // Mock successful sync response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            server_timestamp: Date.now(),
            conflicts: [],
            server_changes: [],
            applied_operations: [],
            failed_operations: [],
          },
        }),
      } as any);

      const testData = { id: 'test-123', name: 'Test' };
      await syncManager.queueChange('financial_accounts', 'create', testData);

      // Wait for auto-sync to trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sync/sync'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('performSync', () => {
    it('should perform successful sync', async () => {
      const mockSyncResponse = {
        success: true,
        data: {
          server_timestamp: Date.now(),
          conflicts: [],
          server_changes: [],
          applied_operations: ['op-1'],
          failed_operations: [],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse),
      } as any);

      mockAsyncStorage.getItem
        .mockResolvedValueOnce('1234567890') // last_sync_timestamp
        .mockResolvedValueOnce('[]'); // sync_queue

      await syncManager.performSync();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sync/sync'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('operations'),
        })
      );

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'last_sync_timestamp',
        mockSyncResponse.data.server_timestamp.toString()
      );
    });

    it('should handle sync conflicts', async () => {
      const mockConflict = {
        operation_id: 'op-1',
        table: 'financial_accounts',
        record_id: 'account-123',
        client_data: { name: 'Client Name' },
        server_data: { name: 'Server Name' },
        conflict_type: 'update_conflict',
        client_timestamp: Date.now() - 1000,
        server_timestamp: Date.now(),
      };

      const mockSyncResponse = {
        success: true,
        data: {
          server_timestamp: Date.now(),
          conflicts: [mockConflict],
          server_changes: [],
          applied_operations: [],
          failed_operations: [],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSyncResponse),
      } as any);

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // last_sync_timestamp
        .mockResolvedValueOnce('[]') // sync_queue
        .mockResolvedValueOnce('[]'); // existing conflicts

      await syncManager.performSync();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_conflicts',
        expect.stringContaining('update_conflict')
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // last_sync_timestamp
        .mockResolvedValueOnce('[]'); // sync_queue

      await expect(syncManager.performSync()).rejects.toThrow('Network error');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'last_sync_error',
        'Network error'
      );
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(null) // last_sync_timestamp
        .mockResolvedValueOnce('[]'); // sync_queue

      await expect(syncManager.performSync()).rejects.toThrow('Sync request failed: 500 Internal Server Error');
    });

    it('should skip sync when offline', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false } as any);

      await syncManager.performSync();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip sync when already in progress', async () => {
      // Start first sync
      const syncPromise1 = syncManager.performSync();
      
      // Try to start second sync immediately
      const syncPromise2 = syncManager.performSync();

      await Promise.all([syncPromise1, syncPromise2]);

      // Should only make one fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('conflict resolution', () => {
    it('should resolve conflict with client wins', async () => {
      const mockConflict = {
        operation_id: 'op-1',
        table: 'financial_accounts',
        record_id: 'account-123',
        client_data: { name: 'Client Name' },
        server_data: { name: 'Server Name' },
        conflict_type: 'update_conflict',
        client_timestamp: Date.now() - 1000,
        server_timestamp: Date.now(),
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([mockConflict]));
      mockFetch.mockResolvedValueOnce({ ok: true } as any);

      await syncManager.resolveConflict('op-1', 'client');

      // Should queue client data for sync
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_queue',
        expect.stringContaining('Client Name')
      );

      // Should remove conflict from storage
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_conflicts',
        '[]'
      );
    });

    it('should resolve conflict with server wins', async () => {
      const mockConflict = {
        operation_id: 'op-1',
        table: 'financial_accounts',
        record_id: 'account-123',
        client_data: { name: 'Client Name' },
        server_data: { name: 'Server Name' },
        conflict_type: 'update_conflict',
        client_timestamp: Date.now() - 1000,
        server_timestamp: Date.now(),
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([mockConflict]));
      mockFetch.mockResolvedValueOnce({ ok: true } as any);

      await syncManager.resolveConflict('op-1', 'server');

      // Should remove conflict from storage
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_conflicts',
        '[]'
      );
    });
  });

  describe('data management', () => {
    it('should load sync queue on initialization', async () => {
      const mockQueue = [
        {
          id: 'op-1',
          table: 'financial_accounts',
          operation: 'create',
          data: { name: 'Test' },
          client_timestamp: Date.now(),
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockQueue));

      await syncManager.loadSyncQueue();

      // Queue should be loaded (we can't directly test this, but it should not throw)
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('sync_queue');
    });

    it('should clear all sync data', async () => {
      await syncManager.clearSyncData();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'sync_queue',
        'last_sync_timestamp',
        'sync_conflicts',
        'last_sync_error',
      ]);
    });

    it('should force full sync', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            server_timestamp: Date.now(),
            conflicts: [],
            server_changes: [],
            applied_operations: [],
            failed_operations: [],
          },
        }),
      } as any);

      await syncManager.forceFullSync();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('last_sync_timestamp');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('sync listeners', () => {
    it('should add and remove sync listeners', () => {
      const mockListener = jest.fn();
      
      const unsubscribe = syncManager.addSyncListener(mockListener);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
      
      // Listener should be removed (we can't directly test this without triggering an event)
    });
  });
});
