import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { syncService } from '../../services/sync/SyncService';
import { query, transaction } from '../../db/connection';

// Mock database functions
jest.mock('../../db/connection');
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockTransaction = transaction as jest.MockedFunction<typeof transaction>;

describe('SyncService', () => {
  const testUserId = 'test-user-123';
  const testDeviceId = 'test-device-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processSync', () => {
    it('should process sync request with no operations', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        last_sync_timestamp: Date.now() - 1000,
        operations: [],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.applied_operations).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.failed_operations).toHaveLength(0);
      expect(typeof result.server_timestamp).toBe('number');
    });

    it('should process create operation successfully', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // Check if record exists
          .mockResolvedValueOnce({ rows: [{ id: 'new-record' }] }) // Insert record
          .mockResolvedValueOnce({ rows: [] }) // Get server changes
          .mockResolvedValueOnce({ rows: [] }), // Update sync status
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [{
          id: 'op-1',
          table: 'financial_accounts',
          operation: 'create' as const,
          data: {
            id: 'account-123',
            user_id: testUserId,
            name: 'Test Account',
            account_type: 'checking',
            balance: 1000,
            currency: 'USD',
          },
          client_timestamp: Date.now(),
        }],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.applied_operations).toContain('op-1');
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect create conflict when record already exists', async () => {
      const existingRecord = {
        id: 'account-123',
        updated_at: new Date(),
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [existingRecord] }) // Record exists
          .mockResolvedValueOnce({ rows: [] }) // Get server changes
          .mockResolvedValueOnce({ rows: [] }), // Update sync status
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [{
          id: 'op-1',
          table: 'financial_accounts',
          operation: 'create' as const,
          data: {
            id: 'account-123',
            user_id: testUserId,
            name: 'Test Account',
          },
          client_timestamp: Date.now(),
        }],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].conflict_type).toBe('create_conflict');
      expect(result.applied_operations).not.toContain('op-1');
    });

    it('should process update operation successfully', async () => {
      const existingRecord = {
        id: 'account-123',
        name: 'Old Name',
        updated_at: new Date(Date.now() - 5000), // 5 seconds ago
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [existingRecord] }) // Get existing record
          .mockResolvedValueOnce({ rows: [{ id: 'account-123' }] }) // Update record
          .mockResolvedValueOnce({ rows: [] }) // Get server changes
          .mockResolvedValueOnce({ rows: [] }), // Update sync status
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [{
          id: 'op-1',
          table: 'financial_accounts',
          operation: 'update' as const,
          data: {
            id: 'account-123',
            name: 'New Name',
          },
          client_timestamp: Date.now(),
        }],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.applied_operations).toContain('op-1');
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect update conflict when server record is newer', async () => {
      const existingRecord = {
        id: 'account-123',
        name: 'Server Name',
        updated_at: new Date(Date.now() + 1000), // 1 second in future
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [existingRecord] }) // Get existing record
          .mockResolvedValueOnce({ rows: [] }) // Get server changes
          .mockResolvedValueOnce({ rows: [] }), // Update sync status
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [{
          id: 'op-1',
          table: 'financial_accounts',
          operation: 'update' as const,
          data: {
            id: 'account-123',
            name: 'Client Name',
          },
          client_timestamp: Date.now() - 2000, // 2 seconds ago
        }],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].conflict_type).toBe('update_conflict');
      expect(result.applied_operations).not.toContain('op-1');
    });

    it('should process delete operation successfully', async () => {
      const existingRecord = {
        id: 'account-123',
        updated_at: new Date(Date.now() - 5000),
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [existingRecord] }) // Get existing record
          .mockResolvedValueOnce({ rows: [{ id: 'account-123' }] }) // Soft delete
          .mockResolvedValueOnce({ rows: [] }) // Get server changes
          .mockResolvedValueOnce({ rows: [] }), // Update sync status
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [{
          id: 'op-1',
          table: 'financial_accounts',
          operation: 'delete' as const,
          data: {
            id: 'account-123',
          },
          client_timestamp: Date.now(),
        }],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.applied_operations).toContain('op-1');
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle delete operation when record does not exist', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // Record not found
          .mockResolvedValueOnce({ rows: [] }) // Get server changes
          .mockResolvedValueOnce({ rows: [] }), // Update sync status
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [{
          id: 'op-1',
          table: 'financial_accounts',
          operation: 'delete' as const,
          data: {
            id: 'account-123',
          },
          client_timestamp: Date.now(),
        }],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.applied_operations).toContain('op-1');
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return server changes since last sync', async () => {
      const serverChanges = [
        {
          id: 'goal-456',
          user_id: testUserId,
          name: 'Server Goal',
          updated_at: new Date(),
          created_at: new Date(),
          synced_at: null,
          is_active: true,
        },
      ];

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // No operations to process
          .mockResolvedValueOnce({ rows: serverChanges }) // financial_accounts changes
          .mockResolvedValueOnce({ rows: [] }) // financial_goals changes
          .mockResolvedValueOnce({ rows: [] }) // scenarios changes
          .mockResolvedValueOnce({ rows: [] }), // Update sync status
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        last_sync_timestamp: Date.now() - 10000, // 10 seconds ago
        operations: [],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.server_changes).toHaveLength(1);
      expect(result.server_changes[0].table).toBe('financial_accounts');
      expect(result.server_changes[0].operation).toBe('create');
    });

    it('should reject invalid table names', async () => {
      const mockClient = {
        query: jest.fn(),
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [{
          id: 'op-1',
          table: 'invalid_table',
          operation: 'create' as const,
          data: { id: 'test' },
          client_timestamp: Date.now(),
        }],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.failed_operations).toHaveLength(1);
      expect(result.failed_operations[0].error).toContain('Invalid table');
    });

    it('should prevent users from modifying other users data', async () => {
      const mockClient = {
        query: jest.fn(),
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [{
          id: 'op-1',
          table: 'financial_accounts',
          operation: 'create' as const,
          data: {
            id: 'account-123',
            user_id: 'other-user-id', // Different user
            name: 'Malicious Account',
          },
          client_timestamp: Date.now(),
        }],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.failed_operations).toHaveLength(1);
      expect(result.failed_operations[0].error).toContain('Cannot modify data for other users');
    });

    it('should handle database errors gracefully', async () => {
      mockTransaction.mockRejectedValue(new Error('Database connection failed'));

      const syncRequest = {
        operations: [],
        device_id: testDeviceId,
      };

      await expect(syncService.processSync(testUserId, syncRequest))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle multiple operations with mixed results', async () => {
      const mockClient = {
        query: jest.fn()
          // First operation (create) - success
          .mockResolvedValueOnce({ rows: [] }) // Check if exists
          .mockResolvedValueOnce({ rows: [{ id: 'account-1' }] }) // Insert
          // Second operation (update) - conflict
          .mockResolvedValueOnce({ rows: [{ 
            id: 'account-2', 
            updated_at: new Date(Date.now() + 1000) 
          }] }) // Get existing (newer)
          // Third operation (delete) - success
          .mockResolvedValueOnce({ rows: [{ id: 'account-3' }] }) // Get existing
          .mockResolvedValueOnce({ rows: [{ id: 'account-3' }] }) // Delete
          // Get server changes and update sync status
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] }),
      };

      mockTransaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const syncRequest = {
        operations: [
          {
            id: 'op-1',
            table: 'financial_accounts',
            operation: 'create' as const,
            data: { id: 'account-1', user_id: testUserId, name: 'Account 1' },
            client_timestamp: Date.now(),
          },
          {
            id: 'op-2',
            table: 'financial_accounts',
            operation: 'update' as const,
            data: { id: 'account-2', name: 'Updated Name' },
            client_timestamp: Date.now() - 2000,
          },
          {
            id: 'op-3',
            table: 'financial_accounts',
            operation: 'delete' as const,
            data: { id: 'account-3' },
            client_timestamp: Date.now(),
          },
        ],
        device_id: testDeviceId,
      };

      const result = await syncService.processSync(testUserId, syncRequest);

      expect(result.success).toBe(true);
      expect(result.applied_operations).toContain('op-1');
      expect(result.applied_operations).toContain('op-3');
      expect(result.applied_operations).not.toContain('op-2');
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].operation_id).toBe('op-2');
    });
  });
});
