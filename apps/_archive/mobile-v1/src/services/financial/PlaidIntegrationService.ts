import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import type FinancialAccount from '../../database/models/FinancialAccount';
import { enhancedSyncManager } from '../sync/EnhancedSyncManager';
import { ErrorHandlingService } from '../ErrorHandlingService';

// Plaid integration interfaces
export interface PlaidAccount {
  account_id: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string;
  };
  mask: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string;
  verification_status: string;
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string[];
  category_id: string;
  account_owner: string | null;
}

export interface PlaidLinkResult {
  public_token: string;
  metadata: {
    institution: {
      name: string;
      institution_id: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      subtype: string;
      mask: string;
    }>;
  };
}

export interface PlaidConnection {
  id: string;
  institutionId: string;
  institutionName: string;
  accessToken: string; // Encrypted
  itemId: string;
  accounts: PlaidAccount[];
  lastSync: number;
  isActive: boolean;
  syncEnabled: boolean;
  syncFrequency: 'daily' | 'weekly' | 'manual';
  errorCount: number;
  lastError?: string;
}

export interface AutoBalanceUpdateSettings {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  institutions: string[]; // Institution IDs to sync
  accountTypes: string[]; // Account types to sync
  notifyOnUpdates: boolean;
  conflictResolution: 'plaid_wins' | 'manual_wins' | 'prompt_user';
  syncThreshold: number; // Minimum balance change to trigger sync
}

/**
 * PlaidIntegrationService handles bank account aggregation and automatic balance updates
 * Integrates with Plaid API for real-time financial data synchronization
 */
export class PlaidIntegrationService {
  private static instance: PlaidIntegrationService;
  private connections: Map<string, PlaidConnection> = new Map();
  private autoUpdateSettings: AutoBalanceUpdateSettings;
  private errorHandler: ErrorHandlingService;
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
    this.initializeAutoUpdateSettings();
  }

  public static getInstance(): PlaidIntegrationService {
    if (!PlaidIntegrationService.instance) {
      PlaidIntegrationService.instance = new PlaidIntegrationService();
    }
    return PlaidIntegrationService.instance;
  }

  /**
   * Initialize the Plaid integration service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing connections
      await this.loadConnections();

      // Load auto-update settings
      await this.loadAutoUpdateSettings();

      // Start automatic sync if enabled
      if (this.autoUpdateSettings.enabled) {
        this.startAutomaticSync();
      }

      this.isInitialized = true;
      console.log('PlaidIntegrationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PlaidIntegrationService:', error);
      this.errorHandler.handleError(error as Error, {
        context: 'PlaidIntegrationService.initialize',
        severity: 'high',
      });
    }
  }

  /**
   * Initialize auto-update settings with defaults
   */
  private initializeAutoUpdateSettings(): void {
    this.autoUpdateSettings = {
      enabled: false, // Disabled by default for security
      frequency: 'daily',
      institutions: [],
      accountTypes: ['checking', 'savings', 'credit'],
      notifyOnUpdates: true,
      conflictResolution: 'prompt_user',
      syncThreshold: 1.0, // $1 minimum change
    };
  }

  /**
   * Link a new bank account via Plaid
   */
  public async linkAccount(linkResult: PlaidLinkResult): Promise<string> {
    try {
      // Exchange public token for access token (would call backend API)
      const accessToken = await this.exchangePublicToken(
        linkResult.public_token
      );

      // Get account details from Plaid
      const accounts = await this.getAccountDetails(accessToken);

      // Create connection record
      const connection: PlaidConnection = {
        id: `plaid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        institutionId: linkResult.metadata.institution.institution_id,
        institutionName: linkResult.metadata.institution.name,
        accessToken: await this.encryptAccessToken(accessToken),
        itemId: `item_${Date.now()}`, // Would come from Plaid response
        accounts,
        lastSync: 0,
        isActive: true,
        syncEnabled: true,
        syncFrequency: 'daily',
        errorCount: 0,
      };

      // Store connection
      this.connections.set(connection.id, connection);
      await this.saveConnections();

      // Create local financial accounts for each Plaid account
      await this.createLocalAccountsFromPlaid(connection);

      console.log(
        `Successfully linked ${accounts.length} accounts from ${connection.institutionName}`
      );
      return connection.id;
    } catch (error) {
      console.error('Failed to link Plaid account:', error);
      throw error;
    }
  }

  /**
   * Sync balances for all connected accounts
   */
  public async syncAllBalances(): Promise<{
    success: boolean;
    updatedAccounts: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      updatedAccounts: 0,
      errors: [] as string[],
    };

    for (const connection of this.connections.values()) {
      if (!connection.isActive || !connection.syncEnabled) continue;

      try {
        const updated = await this.syncConnectionBalances(connection);
        results.updatedAccounts += updated;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${connection.institutionName}: ${errorMessage}`);
        results.success = false;

        // Update error count
        connection.errorCount++;
        connection.lastError = errorMessage;
      }
    }

    // Save updated connections
    await this.saveConnections();

    return results;
  }

  /**
   * Sync balances for a specific connection
   */
  private async syncConnectionBalances(
    connection: PlaidConnection
  ): Promise<number> {
    try {
      // Decrypt access token
      const accessToken = await this.decryptAccessToken(connection.accessToken);

      // Get latest account data from Plaid
      const latestAccounts = await this.getAccountDetails(accessToken);

      let updatedCount = 0;

      // Update each account
      for (const plaidAccount of latestAccounts) {
        const updated = await this.updateLocalAccountBalance(
          connection.id,
          plaidAccount
        );
        if (updated) updatedCount++;
      }

      // Update connection sync timestamp
      connection.lastSync = Date.now();
      connection.errorCount = 0;
      connection.lastError = undefined;

      return updatedCount;
    } catch (error) {
      console.error(
        `Failed to sync balances for ${connection.institutionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update local account balance from Plaid data
   */
  private async updateLocalAccountBalance(
    connectionId: string,
    plaidAccount: PlaidAccount
  ): Promise<boolean> {
    try {
      // Find matching local account
      const localAccount = await this.findLocalAccountByPlaidId(
        connectionId,
        plaidAccount.account_id
      );
      if (!localAccount) {
        console.warn(
          `Local account not found for Plaid account ${plaidAccount.account_id}`
        );
        return false;
      }

      const newBalance =
        plaidAccount.balances.current || plaidAccount.balances.available || 0;
      const currentBalance = localAccount.balance;

      // Check if balance change meets threshold
      const balanceChange = Math.abs(newBalance - currentBalance);
      if (balanceChange < this.autoUpdateSettings.syncThreshold) {
        return false; // No significant change
      }

      // Handle conflict resolution
      if (await this.hasRecentManualUpdate(localAccount)) {
        switch (this.autoUpdateSettings.conflictResolution) {
          case 'manual_wins':
            return false; // Keep manual update
          case 'plaid_wins':
            break; // Continue with Plaid update
          case 'prompt_user':
            // Would show user prompt in real implementation
            console.log(
              `Balance conflict detected for ${localAccount.name}: Manual=${currentBalance}, Plaid=${newBalance}`
            );
            return false; // Skip for now
        }
      }

      // Update local account balance
      await database.write(async () => {
        await localAccount.update((account: any) => {
          account.balance = newBalance;
          account.updatedAt = new Date();
          account.metadata = {
            ...account.metadata,
            lastPlaidSync: Date.now(),
            plaidAccountId: plaidAccount.account_id,
          };
        });
      });

      // Queue sync operation
      await enhancedSyncManager.forceSync();

      console.log(
        `Updated ${localAccount.name}: ${currentBalance} → ${newBalance}`
      );
      return true;
    } catch (error) {
      console.error('Failed to update local account balance:', error);
      return false;
    }
  }

  /**
   * Find local account by Plaid account ID
   */
  private async findLocalAccountByPlaidId(
    connectionId: string,
    plaidAccountId: string
  ): Promise<FinancialAccount | null> {
    try {
      const accountsCollection = database.get('financial_accounts');
      const accounts = (await accountsCollection
        .query(
          Q.where('is_active', true),
          Q.where('metadata', Q.like(`%"plaidAccountId":"${plaidAccountId}"%`))
        )
        .fetch()) as FinancialAccount[];

      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Failed to find local account by Plaid ID:', error);
      return null;
    }
  }

  /**
   * Check if account has recent manual update
   */
  private async hasRecentManualUpdate(
    account: FinancialAccount
  ): Promise<boolean> {
    const lastUpdate = account.updatedAt.getTime();
    const lastPlaidSync = account.metadata?.lastPlaidSync || 0;
    const timeSinceLastSync = Date.now() - lastPlaidSync;

    // Consider manual if updated after last Plaid sync and within last hour
    return lastUpdate > lastPlaidSync && timeSinceLastSync < 3600000;
  }

  /**
   * Create local financial accounts from Plaid accounts
   */
  private async createLocalAccountsFromPlaid(
    connection: PlaidConnection
  ): Promise<void> {
    for (const plaidAccount of connection.accounts) {
      try {
        await database.write(async () => {
          const accountsCollection = database.get('financial_accounts');

          await accountsCollection.create((account: any) => {
            account.name =
              plaidAccount.name ||
              plaidAccount.official_name ||
              'Linked Account';
            account.accountType = this.mapPlaidAccountType(
              plaidAccount.type,
              plaidAccount.subtype
            );
            account.institution = connection.institutionName;
            account.balance =
              plaidAccount.balances.current ||
              plaidAccount.balances.available ||
              0;
            account.currency = plaidAccount.balances.iso_currency_code || 'USD';
            account.isActive = true;
            account.metadata = {
              plaidConnectionId: connection.id,
              plaidAccountId: plaidAccount.account_id,
              plaidMask: plaidAccount.mask,
              linkedViaPlaid: true,
              autoSyncEnabled: true,
            };
          });
        });
      } catch (error) {
        console.error(
          `Failed to create local account for ${plaidAccount.name}:`,
          error
        );
      }
    }
  }

  /**
   * Map Plaid account type to local account type
   */
  private mapPlaidAccountType(type: string, subtype: string): string {
    const typeMap: Record<string, string> = {
      'depository.checking': 'checking',
      'depository.savings': 'savings',
      'credit.credit_card': 'credit',
      'loan.mortgage': 'mortgage',
      'loan.student': 'loan',
      'investment.401k': 'retirement',
      'investment.ira': 'retirement',
      'investment.brokerage': 'investment',
    };

    const key = `${type}.${subtype}`;
    return typeMap[key] || type;
  }

  /**
   * Start automatic sync based on settings
   */
  private startAutomaticSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    const intervalMap = {
      realtime: 60000, // 1 minute (not truly realtime, but frequent)
      hourly: 3600000, // 1 hour
      daily: 86400000, // 24 hours
      weekly: 604800000, // 7 days
    };

    const interval = intervalMap[this.autoUpdateSettings.frequency];

    this.syncTimer = setInterval(async () => {
      try {
        await this.syncAllBalances();
      } catch (error) {
        console.error('Automatic sync failed:', error);
      }
    }, interval);
  }

  /**
   * Exchange public token for access token (mock implementation)
   */
  private async exchangePublicToken(publicToken: string): Promise<string> {
    // In real implementation, this would call the backend API
    // which would then call Plaid's /link/token/exchange endpoint
    return `access_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get account details from Plaid (mock implementation)
   */
  private async getAccountDetails(
    accessToken: string
  ): Promise<PlaidAccount[]> {
    // In real implementation, this would call the backend API
    // which would then call Plaid's /accounts/get endpoint
    return [
      {
        account_id: `account_${Date.now()}`,
        balances: {
          available: 1000.5,
          current: 1000.5,
          limit: null,
          iso_currency_code: 'USD',
        },
        mask: '0000',
        name: 'Plaid Checking',
        official_name: 'Plaid Gold Standard 0% Interest Checking',
        type: 'depository',
        subtype: 'checking',
        verification_status: 'verified',
      },
    ];
  }

  /**
   * Encrypt access token for secure storage
   */
  private async encryptAccessToken(accessToken: string): Promise<string> {
    // In real implementation, this would use proper encryption
    // For now, just base64 encode (NOT SECURE - for demo only)
    return Buffer.from(accessToken).toString('base64');
  }

  /**
   * Decrypt access token
   */
  private async decryptAccessToken(encryptedToken: string): Promise<string> {
    // In real implementation, this would use proper decryption
    // For now, just base64 decode (NOT SECURE - for demo only)
    return Buffer.from(encryptedToken, 'base64').toString();
  }

  /**
   * Load connections from storage
   */
  private async loadConnections(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('plaid_connections');
      if (stored) {
        const connections: PlaidConnection[] = JSON.parse(stored);
        this.connections.clear();
        connections.forEach(conn => this.connections.set(conn.id, conn));
      }
    } catch (error) {
      console.error('Failed to load Plaid connections:', error);
    }
  }

  /**
   * Save connections to storage
   */
  private async saveConnections(): Promise<void> {
    try {
      const connections = Array.from(this.connections.values());
      await AsyncStorage.setItem(
        'plaid_connections',
        JSON.stringify(connections)
      );
    } catch (error) {
      console.error('Failed to save Plaid connections:', error);
    }
  }

  /**
   * Load auto-update settings from storage
   */
  private async loadAutoUpdateSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('plaid_auto_update_settings');
      if (stored) {
        this.autoUpdateSettings = {
          ...this.autoUpdateSettings,
          ...JSON.parse(stored),
        };
      }
    } catch (error) {
      console.error('Failed to load auto-update settings:', error);
    }
  }

  /**
   * Save auto-update settings to storage
   */
  private async saveAutoUpdateSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'plaid_auto_update_settings',
        JSON.stringify(this.autoUpdateSettings)
      );
    } catch (error) {
      console.error('Failed to save auto-update settings:', error);
    }
  }

  /**
   * Get all connections
   */
  public getConnections(): PlaidConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get auto-update settings
   */
  public getAutoUpdateSettings(): AutoBalanceUpdateSettings {
    return { ...this.autoUpdateSettings };
  }

  /**
   * Update auto-update settings
   */
  public async updateAutoUpdateSettings(
    settings: Partial<AutoBalanceUpdateSettings>
  ): Promise<void> {
    this.autoUpdateSettings = { ...this.autoUpdateSettings, ...settings };
    await this.saveAutoUpdateSettings();

    // Restart automatic sync if enabled
    if (this.autoUpdateSettings.enabled) {
      this.startAutomaticSync();
    } else if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Remove a connection
   */
  public async removeConnection(connectionId: string): Promise<boolean> {
    if (!this.connections.has(connectionId)) {
      return false;
    }

    // Mark connection as inactive
    const connection = this.connections.get(connectionId)!;
    connection.isActive = false;

    // Remove from map
    this.connections.delete(connectionId);

    // Save changes
    await this.saveConnections();

    // Deactivate associated local accounts
    await this.deactivateLocalAccountsForConnection(connectionId);

    return true;
  }

  /**
   * Deactivate local accounts for a connection
   */
  private async deactivateLocalAccountsForConnection(
    connectionId: string
  ): Promise<void> {
    try {
      const accountsCollection = database.get('financial_accounts');
      const accounts = (await accountsCollection
        .query(
          Q.where('is_active', true),
          Q.where('metadata', Q.like(`%"plaidConnectionId":"${connectionId}"%`))
        )
        .fetch()) as FinancialAccount[];

      await database.write(async () => {
        for (const account of accounts) {
          await account.update((acc: any) => {
            acc.isActive = false;
            acc.metadata = {
              ...acc.metadata,
              deactivatedReason: 'plaid_connection_removed',
              deactivatedAt: Date.now(),
            };
          });
        }
      });
    } catch (error) {
      console.error('Failed to deactivate local accounts:', error);
    }
  }

  /**
   * Get sync statistics
   */
  public getSyncStatistics(): {
    totalConnections: number;
    activeConnections: number;
    totalAccounts: number;
    lastSyncTime: number | null;
    errorConnections: number;
  } {
    const connections = Array.from(this.connections.values());
    const activeConnections = connections.filter(c => c.isActive);
    const totalAccounts = activeConnections.reduce(
      (sum, c) => sum + c.accounts.length,
      0
    );
    const lastSyncTime =
      Math.max(...activeConnections.map(c => c.lastSync), 0) || null;
    const errorConnections = connections.filter(c => c.errorCount > 0).length;

    return {
      totalConnections: connections.length,
      activeConnections: activeConnections.length,
      totalAccounts,
      lastSyncTime,
      errorConnections,
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.connections.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const plaidIntegrationService = PlaidIntegrationService.getInstance();
