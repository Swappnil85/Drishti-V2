/**
 * AccountsListScreen Component
 * Enhanced accounts list with filtering, sorting, and management features
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { AccountsStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ScreenTemplate,
  Card,
  Button,
  Icon,
  Flex,
  Input,
  Badge,
  Avatar,
} from '../../components/ui';
import QuickBalanceUpdate from '../../components/financial/QuickBalanceUpdate';
import BulkBalanceUpdate from '../../components/financial/BulkBalanceUpdate';
import { database } from '../../database';
import FinancialAccount from '../../database/models/FinancialAccount';
import { useAuth } from '../../contexts/AuthContext';
import { useFormHaptic } from '../../hooks/useHaptic';
import { useOffline, useOfflineFeature } from '../../hooks/useOffline';
import OfflineIndicator from '../../components/sync/OfflineIndicator';
import EnhancedSyncIndicator from '../../components/sync/EnhancedSyncIndicator';
import AdvancedConflictResolutionModal from '../../components/sync/AdvancedConflictResolutionModal';
import {
  useEnhancedSync,
  usePlaidIntegration,
} from '../../hooks/useEnhancedSync';
import { useAdvancedConflictResolution } from '../../hooks/useAdvancedConflictResolution';
import type { AccountType } from '@drishti/shared/types/financial';
import { apiService } from '../../services/api/ApiService';
import { authService } from '../../services/auth/AuthService';

type Props = AccountsStackScreenProps<'AccountsList'>;

type SortOption = 'name' | 'balance' | 'type' | 'created' | 'updated';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | AccountType;

interface AccountSummary {
  totalAccounts: number;
  totalBalance: number;
  accountsByType: Record<AccountType, number>;
}

const AccountsListScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const formHaptic = useFormHaptic();
  const { isOfflineMode, offlineStatusText, offlineStatusColor } = useOffline();
  const { isAvailable: isAccountManagementAvailable, performOperation } =
    useOfflineFeature('accountManagement');

  // Enhanced sync hooks
  const {
    networkQuality,
    isSyncing: isEnhancedSyncing,
    performAdaptiveSync,
    networkQualityDescription,
  } = useEnhancedSync();

  const {
    totalConnections,
    activeConnections,
    syncAllBalances,
    isSyncing: isPlaidSyncing,
  } = usePlaidIntegration();

  // Advanced conflict resolution hooks
  const {
    conflicts,
    isResolving,
    resolveConflict,
    bulkResolveConflicts,
    autoResolveConflicts,
    totalConflicts,
    criticalConflicts,
    hasCriticalConflicts,
  } = useAdvancedConflictResolution();

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<FinancialAccount[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [summary, setSummary] = useState<AccountSummary>({
    totalAccounts: 0,
    totalBalance: 0,
    accountsByType: {} as Record<AccountType, number>,
  });

  // Balance update states
  const [quickUpdateVisible, setQuickUpdateVisible] = useState(false);
  const [bulkUpdateVisible, setBulkUpdateVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<FinancialAccount | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [user?.id]);

  useEffect(() => {
    filterAndSortAccounts();
  }, [accounts, searchTerm, sortBy, sortDirection, filterBy]);

  // After local DB loads, attempt to refresh from server using ApiService and Auth token
  const loadAccounts = async () => {
    if (!user?.id) return;

    try {
      const accountsCollection = database.get('financial_accounts');
      const userAccounts = (await accountsCollection
        .query(Q.where('user_id', user.id), Q.where('is_active', true))
        .fetch()) as FinancialAccount[];

      setAccounts(userAccounts);
      calculateSummary(userAccounts);

      // Server refresh (non-blocking): fetch and reconcile
      const token = await authService.getAccessToken();
      if (token) {
        apiService
          .get<any[]>(`/financial/accounts`, {
            Authorization: `Bearer ${token}`,
          })
          .then(async serverList => {
            if (!Array.isArray(serverList)) return;
            // Reconcile by id: upsert missing/changed into local DB
            const existingById = new Map(userAccounts.map(a => [a.id, a]));
            const toUpsert = serverList.filter(apiAcc => {
              const local = existingById.get(apiAcc.id);
              return !local || local.updatedAt < new Date(apiAcc.updated_at);
            });
            if (toUpsert.length > 0) {
              await database.write(async () => {
                for (const apiAcc of toUpsert) {
                  const collection =
                    database.get<FinancialAccount>('financial_accounts');
                  const local = existingById.get(apiAcc.id);
                  if (local) {
                    await local.update(acc => {
                      const mapped = FinancialAccount.fromAPI(apiAcc);
                      Object.assign(acc, mapped);
                    });
                  } else {
                    await collection.create(acc => {
                      const mapped = FinancialAccount.fromAPI(apiAcc);
                      Object.assign(acc, mapped);
                    });
                  }
                }
              });
              // reload local state
              const refreshed = (await accountsCollection
                .query(Q.where('user_id', user.id), Q.where('is_active', true))
                .fetch()) as FinancialAccount[];
              setAccounts(refreshed);
              calculateSummary(refreshed);
            }
          })
          .catch(() => {
            // ignore server refresh errors; local-first still displayed
          });
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateSummary = (accountsList: FinancialAccount[]) => {
    const summary: AccountSummary = {
      totalAccounts: accountsList.length,
      totalBalance: 0,
      accountsByType: {} as Record<AccountType, number>,
    };

    accountsList.forEach(account => {
      summary.totalBalance += account.balance;
      summary.accountsByType[account.accountType] =
        (summary.accountsByType[account.accountType] || 0) + 1;
    });

    setSummary(summary);
  };

  const filterAndSortAccounts = () => {
    let filtered = [...accounts];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        account =>
          account.name.toLowerCase().includes(searchLower) ||
          (account.institution &&
            account.institution.toLowerCase().includes(searchLower)) ||
          account.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(account => account.accountType === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'balance':
          comparison = a.balance - b.balance;
          break;
        case 'type':
          comparison = a.accountType.localeCompare(b.accountType);
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    setFilteredAccounts(filtered);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAccounts();
  }, [user?.id]);

  const handleAccountPress = async (account: FinancialAccount) => {
    await formHaptic.success();
    navigation.navigate('AccountDetails', { accountId: account.id });
  };

  const handleAccountLongPress = async (account: FinancialAccount) => {
    await formHaptic.success();

    const options = [
      'View Details',
      'Edit Account',
      'View History',
      'Update Balance',
      'Archive Account',
      'Delete Account',
      'Cancel',
    ];

    const destructiveButtonIndex = 5;
    const cancelButtonIndex = 6;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        buttonIndex => {
          handleAccountAction(account, buttonIndex);
        }
      );
    } else {
      // For Android, show a simple alert
      Alert.alert(account.name, 'Choose an action', [
        {
          text: 'View Details',
          onPress: () => handleAccountAction(account, 0),
        },
        {
          text: 'Edit Account',
          onPress: () => handleAccountAction(account, 1),
        },
        {
          text: 'View History',
          onPress: () => handleAccountAction(account, 2),
        },
        {
          text: 'Update Balance',
          onPress: () => handleAccountAction(account, 3),
        },
        {
          text: 'Archive Account',
          onPress: () => handleAccountAction(account, 4),
        },
        {
          text: 'Delete Account',
          onPress: () => handleAccountAction(account, 5),
          style: 'destructive',
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleAccountAction = (
    account: FinancialAccount,
    actionIndex: number
  ) => {
    switch (actionIndex) {
      case 0: // View Details
        navigation.navigate('AccountDetails', { accountId: account.id });
        break;
      case 1: // Edit Account
        navigation.navigate('EditAccount', { accountId: account.id });
        break;
      case 2: // View History
        navigation.navigate('AccountHistory', { accountId: account.id });
        break;
      case 3: // Update Balance
        handleQuickBalanceUpdate(account);
        break;
      case 4: // Archive Account
        handleArchiveAccount(account);
        break;
      case 5: // Delete Account
        handleDeleteAccount(account);
        break;
    }
  };

  const handleDeleteAccount = (account: FinancialAccount) => {
    const offlineMessage = isOfflineMode
      ? " (Changes will sync when you're back online)"
      : '';

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This will move the account to trash where it can be recovered for 30 days.${offlineMessage}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await account.update((acc: FinancialAccount) => {
                  acc.isActive = false;
                  acc.updatedAt = new Date();
                });
              });

              // Queue offline operation if offline
              if (isOfflineMode && isAccountManagementAvailable) {
                await performOperation(
                  'update',
                  'financial_accounts',
                  account.id,
                  { isActive: false, updatedAt: new Date() },
                  'normal'
                );
              }

              await formHaptic.success();
              await loadAccounts();

              // Show recovery option with offline status
              const message = isOfflineMode
                ? "Account has been deleted offline. Changes will sync when you're back online. You can recover it from the Account Recovery screen."
                : 'Account has been moved to trash. You can recover it from the Account Recovery screen.';

              Alert.alert('Account Deleted', message, [
                { text: 'OK' },
                {
                  text: 'View Recovery',
                  onPress: () => navigation.navigate('AccountRecovery'),
                },
              ]);
            } catch (error) {
              console.error('Error deleting account:', error);
              await formHaptic.error();
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleArchiveAccount = (account: FinancialAccount) => {
    Alert.alert(
      'Archive Account',
      `Archive "${account.name}"? Archived accounts are hidden from the main list but preserve all historical data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await account.update((acc: FinancialAccount) => {
                  const metadata = acc.metadata;
                  metadata.archived = true;
                  metadata.archivedAt = new Date().toISOString();
                  acc.metadataRaw = JSON.stringify(metadata);
                  acc.updatedAt = new Date();
                });
              });

              await formHaptic.success();
              await loadAccounts();

              Alert.alert(
                'Account Archived',
                'Account has been archived and hidden from the main list. You can restore it from the Account Recovery screen.',
                [
                  { text: 'OK' },
                  {
                    text: 'View Recovery',
                    onPress: () => navigation.navigate('AccountRecovery'),
                  },
                ]
              );
            } catch (error) {
              console.error('Error archiving account:', error);
              await formHaptic.error();
              Alert.alert(
                'Error',
                'Failed to archive account. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  // Balance update handlers
  const handleQuickBalanceUpdate = (account: FinancialAccount) => {
    setSelectedAccount(account);
    setQuickUpdateVisible(true);
  };

  const handleBulkBalanceUpdate = () => {
    setBulkUpdateVisible(true);
  };

  const handleBalanceUpdated = (updatedAccount: FinancialAccount) => {
    // Update the account in the local state
    setAccounts(prevAccounts =>
      prevAccounts.map(account =>
        account.id === updatedAccount.id ? updatedAccount : account
      )
    );
    setQuickUpdateVisible(false);
    setSelectedAccount(null);
  };

  const handleBulkBalancesUpdated = (updatedAccounts: FinancialAccount[]) => {
    // Update multiple accounts in the local state
    setAccounts(prevAccounts => {
      const updatedAccountsMap = new Map(
        updatedAccounts.map(account => [account.id, account])
      );
      return prevAccounts.map(
        account => updatedAccountsMap.get(account.id) || account
      );
    });
    setBulkUpdateVisible(false);
  };

  // Conflict resolution handlers
  const handleShowConflictResolution = () => {
    setShowConflictResolution(true);
  };

  const handleConflictResolve = async (
    conflict: any,
    resolution: any,
    mergedData?: any
  ) => {
    try {
      await resolveConflict(conflict, resolution, mergedData);
      Alert.alert(
        'Conflict Resolved',
        'The sync conflict has been resolved successfully.'
      );
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      Alert.alert(
        'Resolution Failed',
        'Failed to resolve the conflict. Please try again.'
      );
    }
  };

  const handleBulkConflictResolve = async (
    conflictsToResolve: any[],
    options: any
  ) => {
    try {
      const result = await bulkResolveConflicts(conflictsToResolve, options);
      Alert.alert(
        'Bulk Resolution Complete',
        `Resolved ${result.resolved} conflicts. ${result.failed} failed. ${result.skipped} skipped.`
      );
      setShowConflictResolution(false);
    } catch (error) {
      console.error('Failed to bulk resolve conflicts:', error);
      Alert.alert(
        'Bulk Resolution Failed',
        'Failed to resolve conflicts in bulk. Please try again.'
      );
    }
  };

  const handleAutoConflictResolve = async (conflictsToResolve: any[]) => {
    try {
      const result = await autoResolveConflicts(conflictsToResolve);
      Alert.alert(
        'Auto-Resolution Complete',
        `Automatically resolved ${result.resolved.length} conflicts. ${result.remaining.length} require manual attention.`
      );

      if (result.remaining.length === 0) {
        setShowConflictResolution(false);
      }
    } catch (error) {
      console.error('Failed to auto-resolve conflicts:', error);
      Alert.alert(
        'Auto-Resolution Failed',
        'Failed to automatically resolve conflicts. Please try again.'
      );
    }
  };

  const handleCancelQuickUpdate = () => {
    setQuickUpdateVisible(false);
    setSelectedAccount(null);
  };

  const handleCancelBulkUpdate = () => {
    setBulkUpdateVisible(false);
  };

  const handleSortPress = () => {
    const sortOptions = [
      { key: 'name', label: 'Name' },
      { key: 'balance', label: 'Balance' },
      { key: 'type', label: 'Account Type' },
      { key: 'created', label: 'Date Created' },
      { key: 'updated', label: 'Last Updated' },
    ];

    const options = [
      ...sortOptions.map(
        option =>
          `${option.label} ${sortBy === option.key ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`
      ),
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        buttonIndex => {
          if (buttonIndex < sortOptions.length) {
            const selectedSort = sortOptions[buttonIndex].key as SortOption;
            if (selectedSort === sortBy) {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(selectedSort);
              setSortDirection('asc');
            }
          }
        }
      );
    }
  };

  const handleAddAccount = () => {
    const options = [
      'Create Manually',
      'Use Template',
      'Import from CSV',
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
        },
        buttonIndex => {
          switch (buttonIndex) {
            case 0:
              navigation.navigate('AddAccount');
              break;
            case 1:
              navigation.navigate('AddAccountFromTemplate');
              break;
            case 2:
              navigation.navigate('ImportAccounts');
              break;
          }
        }
      );
    } else {
      Alert.alert('Add Account', 'Choose how you want to add accounts', [
        {
          text: 'Create Manually',
          onPress: () => navigation.navigate('AddAccount'),
        },
        {
          text: 'Use Template',
          onPress: () => navigation.navigate('AddAccountFromTemplate'),
        },
        {
          text: 'Import from CSV',
          onPress: () => navigation.navigate('ImportAccounts'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const getAccountIcon = (accountType: AccountType): string => {
    const iconMap: Record<AccountType, string> = {
      checking: 'card-outline',
      savings: 'wallet-outline',
      investment: 'trending-up-outline',
      retirement: 'time-outline',
      credit: 'card',
      loan: 'home-outline',
      other: 'ellipsis-horizontal-outline',
    };
    return iconMap[accountType];
  };

  const getAccountColor = (account: FinancialAccount): string => {
    if (account.color) {
      const colorMap: Record<string, string> = {
        blue: '#2196F3',
        green: '#4CAF50',
        orange: '#FF9800',
        purple: '#9C27B0',
        red: '#F44336',
        teal: '#009688',
        indigo: '#3F51B5',
        pink: '#E91E63',
        amber: '#FFC107',
        cyan: '#00BCD4',
        lime: '#CDDC39',
        brown: '#795548',
        gray: '#607D8B',
      };
      return colorMap[account.color] || '#607D8B';
    }
    return '#607D8B';
  };

  const formatBalance = (balance: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance);
  };

  const renderSummaryCard = () => (
    <TouchableOpacity
      onPress={() => navigation.navigate('NetWorth')}
      style={styles.summaryCardTouchable}
    >
      <Card variant='filled' padding='base' style={styles.summaryCard}>
        <Flex direction='row' justify='space-between' align='center'>
          <Flex direction='column'>
            <Text
              style={[
                styles.summaryTitle,
                { color: theme.colors.primary[600] },
              ]}
            >
              Net Worth Overview
            </Text>
            <Text
              style={[
                styles.summaryNumber,
                { color: theme.colors.success[600] },
              ]}
            >
              {formatBalance(summary.totalBalance)}
            </Text>
            <Text
              style={[
                styles.summarySubtitle,
                { color: theme.colors.text.secondary },
              ]}
            >
              {summary.totalAccounts} accounts •{' '}
              {Object.keys(summary.accountsByType).length} types
            </Text>
          </Flex>

          <Flex direction='column' align='center' gap='xs'>
            <Icon name='trending-up-outline' size='lg' color='success.500' />
            <Text
              style={[
                styles.viewDetailsText,
                { color: theme.colors.primary[600] },
              ]}
            >
              View Details
            </Text>
          </Flex>
        </Flex>
      </Card>
    </TouchableOpacity>
  );

  const renderFilterBar = () => (
    <Card variant='outlined' padding='sm' style={styles.filterBar}>
      <Flex direction='row' align='center' justify='space-between'>
        <Flex direction='row' align='center' gap='sm'>
          <Input
            placeholder='Search accounts...'
            value={searchTerm}
            onChangeText={setSearchTerm}
            leftIcon={
              <Icon name='search-outline' size='sm' color='text.tertiary' />
            }
            style={styles.searchInput}
            testID='search-input'
          />
        </Flex>

        <Flex direction='row' align='center' gap='xs'>
          <TouchableOpacity
            onPress={() => navigation.navigate('NetWorth')}
            style={styles.filterButton}
            testID='net-worth-button'
          >
            <Icon name='trending-up-outline' size='sm' color='success.500' />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('DebtManagement')}
            style={styles.filterButton}
            testID='debt-management-button'
          >
            <Icon name='card-outline' size='sm' color='error.500' />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('AccountRecovery')}
            style={styles.filterButton}
            testID='recovery-button'
          >
            <Icon name='refresh-outline' size='sm' color='info.500' />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('TaxTreatmentDashboard')}
            style={styles.filterButton}
            testID='tax-dashboard-button'
          >
            <Icon
              name='shield-checkmark-outline'
              size='sm'
              color='success.500'
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBulkBalanceUpdate}
            style={styles.filterButton}
            testID='bulk-update-button'
          >
            <Icon name='layers-outline' size='sm' color='primary.500' />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSortPress}
            style={styles.filterButton}
            testID='sort-button'
          >
            <Icon name='funnel-outline' size='sm' color='text.secondary' />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={[
              styles.filterButton,
              showFilters && { backgroundColor: theme.colors.primary[100] },
            ]}
            testID='filter-button'
          >
            <Icon
              name='options-outline'
              size='sm'
              color={showFilters ? 'primary.500' : 'text.secondary'}
            />
          </TouchableOpacity>
        </Flex>
      </Flex>

      {showFilters && (
        <View style={styles.filterOptions}>
          <Flex direction='row' gap='xs' style={styles.filterTags}>
            {(
              [
                'all',
                'checking',
                'savings',
                'investment',
                'retirement',
                'credit',
                'loan',
                'other',
              ] as FilterOption[]
            ).map(filter => (
              <TouchableOpacity
                key={filter}
                onPress={() => setFilterBy(filter)}
                testID={`filter-${filter}`}
              >
                <Badge
                  variant={filterBy === filter ? 'filled' : 'outline'}
                  color='primary'
                  size='sm'
                >
                  {filter === 'all'
                    ? 'All'
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Badge>
              </TouchableOpacity>
            ))}
          </Flex>
        </View>
      )}
    </Card>
  );

  const renderAccountItem = ({ item }: { item: FinancialAccount }) => (
    <TouchableOpacity
      onPress={() => handleAccountPress(item)}
      onLongPress={() => handleAccountLongPress(item)}
      testID={`account-${item.id}`}
    >
      <Card
        variant='outlined'
        padding='base'
        style={[
          styles.accountCard,
          { borderLeftColor: getAccountColor(item), borderLeftWidth: 4 },
        ]}
      >
        <Flex direction='row' align='center' gap='base'>
          {/* Account Icon */}
          <Avatar
            size='md'
            backgroundColor={getAccountColor(item)}
            fallbackIcon={getAccountIcon(item.accountType)}
          />

          {/* Account Info */}
          <Flex direction='column' gap='xs' style={{ flex: 1 }}>
            <Flex direction='row' align='center' justify='space-between'>
              <Text
                style={[
                  styles.accountName,
                  { color: theme.colors.text.primary },
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.accountBalance,
                  {
                    color:
                      item.balance >= 0
                        ? theme.colors.success[600]
                        : theme.colors.error[600],
                  },
                ]}
              >
                {formatBalance(item.balance, item.currency)}
              </Text>
            </Flex>

            <Flex direction='row' align='center' justify='space-between'>
              <Flex direction='row' align='center' gap='sm'>
                <Badge variant='outline' color='secondary' size='xs'>
                  {item.accountType}
                </Badge>
                {item.institution && (
                  <Text
                    style={[
                      styles.institutionName,
                      { color: theme.colors.text.tertiary },
                    ]}
                  >
                    {item.institution}
                  </Text>
                )}
              </Flex>

              {item.interestRate && (
                <Text
                  style={[
                    styles.interestRate,
                    { color: theme.colors.text.tertiary },
                  ]}
                >
                  {(item.interestRate * 100).toFixed(2)}% APR
                </Text>
              )}
            </Flex>

            {/* Tags */}
            {item.tags.length > 0 && (
              <Flex direction='row' gap='xs' style={styles.tags}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant='filled' color='gray' size='xs'>
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Text
                    style={[
                      styles.moreTags,
                      { color: theme.colors.text.tertiary },
                    ]}
                  >
                    +{item.tags.length - 3}
                  </Text>
                )}
              </Flex>
            )}
          </Flex>

          {/* Quick Balance Update Button */}
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              handleQuickBalanceUpdate(item);
            }}
            style={styles.quickUpdateButton}
            testID={`quick-update-${item.id}`}
          >
            <Icon name='create-outline' size='sm' color='primary.500' />
          </TouchableOpacity>

          {/* Chevron */}
          <Icon
            name='chevron-forward-outline'
            size='sm'
            color='text.tertiary'
          />
        </Flex>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name='wallet-outline' size='xl' color='text.tertiary' />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
        {searchTerm || filterBy !== 'all'
          ? 'No accounts found'
          : 'No accounts yet'}
      </Text>
      <Text
        style={[styles.emptyDescription, { color: theme.colors.text.tertiary }]}
      >
        {searchTerm || filterBy !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Add your first account to get started'}
      </Text>
      {!searchTerm && filterBy === 'all' && (
        <Button
          variant='primary'
          onPress={handleAddAccount}
          style={styles.emptyButton}
          testID='add-first-account-button'
        >
          Add Account
        </Button>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenTemplate
        title='Accounts'
        scrollable={false}
        padding='none'
        testID='accounts-list-screen'
      >
        <View style={styles.loadingContainer}>
          <Text
            style={[styles.loadingText, { color: theme.colors.text.secondary }]}
          >
            Loading accounts...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      title='Accounts'
      scrollable={false}
      padding='none'
      testID='accounts-list-screen'
    >
      <View style={styles.container}>
        {/* Summary Card */}
        <View style={styles.header}>
          {/* Sync Indicators */}
          <View style={styles.syncIndicators}>
            {/* Offline Indicator */}
            {isOfflineMode && (
              <OfflineIndicator
                showText={true}
                showAnalytics={false}
                style={styles.offlineIndicator}
              />
            )}

            {/* Enhanced Sync Indicator */}
            <EnhancedSyncIndicator
              showText={true}
              showNetworkQuality={true}
              showPlaidStatus={totalConnections > 0}
              style={styles.enhancedSyncIndicator}
              testID='enhanced-sync-indicator'
            />

            {/* Conflict Resolution Indicator */}
            {totalConflicts > 0 && (
              <TouchableOpacity
                style={[
                  styles.conflictIndicator,
                  hasCriticalConflicts && styles.criticalConflictIndicator,
                ]}
                onPress={handleShowConflictResolution}
                testID='conflict-resolution-indicator'
              >
                <Icon
                  name={hasCriticalConflicts ? 'warning' : 'info'}
                  size='sm'
                  color={hasCriticalConflicts ? '#ef4444' : '#f59e0b'}
                />
                <Text
                  style={[
                    styles.conflictText,
                    {
                      color: hasCriticalConflicts ? '#ef4444' : '#f59e0b',
                    },
                  ]}
                >
                  {totalConflicts} Conflict{totalConflicts > 1 ? 's' : ''}
                  {criticalConflicts > 0 && ` (${criticalConflicts} Critical)`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {renderSummaryCard()}
          {renderFilterBar()}
        </View>

        {/* Accounts List */}
        <FlatList
          data={filteredAccounts}
          renderItem={renderAccountItem}
          keyExtractor={item => item.id}
          style={styles.accountsList}
          contentContainerStyle={[
            styles.accountsContent,
            filteredAccounts.length === 0 && styles.emptyContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary[500]}
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* Add Account Button */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            onPress={handleAddAccount}
            style={styles.fab}
            testID='add-account-fab'
          >
            <Icon name='add' size='md' color='white' />
          </TouchableOpacity>
        </View>

        {/* Balance Update Modals */}
        {selectedAccount && (
          <QuickBalanceUpdate
            account={selectedAccount}
            onBalanceUpdated={handleBalanceUpdated}
            onCancel={handleCancelQuickUpdate}
            visible={quickUpdateVisible}
          />
        )}

        <BulkBalanceUpdate
          accounts={filteredAccounts}
          onBalancesUpdated={handleBulkBalancesUpdated}
          onCancel={handleCancelBulkUpdate}
          visible={bulkUpdateVisible}
        />

        {/* Advanced Conflict Resolution Modal */}
        <AdvancedConflictResolutionModal
          visible={showConflictResolution}
          conflicts={conflicts}
          onResolve={handleConflictResolve}
          onBulkResolve={handleBulkConflictResolve}
          onAutoResolve={handleAutoConflictResolve}
          onClose={() => setShowConflictResolution(false)}
          testID='advanced-conflict-resolution-modal'
        />
      </View>
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    gap: 12,
  },
  syncIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  offlineIndicator: {
    flex: 0,
  },
  enhancedSyncIndicator: {
    flex: 1,
    minWidth: 200,
  },
  conflictIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 6,
  },
  criticalConflictIndicator: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  conflictText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCardTouchable: {
    // No additional styles needed, TouchableOpacity handles touch feedback
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  viewDetailsText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterBar: {
    // Card handles styling
  },
  searchInput: {
    flex: 1,
    minHeight: 40,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  filterTags: {
    // Flex handles layout
  },
  accountsList: {
    flex: 1,
  },
  accountsContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  accountCard: {
    // Card handles styling
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '700',
  },
  institutionName: {
    fontSize: 12,
  },
  interestRate: {
    fontSize: 12,
    fontWeight: '500',
  },
  tags: {
    marginTop: 4,
  },
  moreTags: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickUpdateButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default AccountsListScreen;
