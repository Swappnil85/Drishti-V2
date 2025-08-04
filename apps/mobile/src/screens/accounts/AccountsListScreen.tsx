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
  FloatingActionButton,
} from '../../components/ui';
import { database } from '../../database';
import FinancialAccount from '../../database/models/FinancialAccount';
import { useAuth } from '../../contexts/AuthContext';
import { useFormHaptic } from '../../hooks/useHaptic';
import type { AccountType } from '@drishti/shared/types/financial';

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
  const [summary, setSummary] = useState<AccountSummary>({
    totalAccounts: 0,
    totalBalance: 0,
    accountsByType: {} as Record<AccountType, number>,
  });

  useEffect(() => {
    loadAccounts();
  }, [user?.id]);

  useEffect(() => {
    filterAndSortAccounts();
  }, [accounts, searchTerm, sortBy, sortDirection, filterBy]);

  const loadAccounts = async () => {
    if (!user?.id) return;

    try {
      const accountsCollection = database.get('financial_accounts');
      const userAccounts = (await accountsCollection
        .query(Q.where('user_id', user.id), Q.where('is_active', true))
        .fetch()) as FinancialAccount[];

      setAccounts(userAccounts);
      calculateSummary(userAccounts);
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
    await formHaptic.light();
    navigation.navigate('AccountDetails', { accountId: account.id });
  };

  const handleAccountLongPress = async (account: FinancialAccount) => {
    await formHaptic.medium();

    const options = [
      'View Details',
      'Edit Account',
      'View History',
      'Delete Account',
      'Cancel',
    ];

    const destructiveButtonIndex = 3;
    const cancelButtonIndex = 4;

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
          text: 'Delete Account',
          onPress: () => handleAccountAction(account, 3),
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
      case 3: // Delete Account
        handleDeleteAccount(account);
        break;
    }
  };

  const handleDeleteAccount = (account: FinancialAccount) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
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
                });
              });

              await formHaptic.success();
              await loadAccounts();
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
    <Card variant='filled' padding='base' style={styles.summaryCard}>
      <Flex direction='row' justify='space-around'>
        <Flex direction='column' align='center'>
          <Text
            style={[styles.summaryNumber, { color: theme.colors.primary[600] }]}
          >
            {summary.totalAccounts}
          </Text>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Accounts
          </Text>
        </Flex>
        <Flex direction='column' align='center'>
          <Text
            style={[styles.summaryNumber, { color: theme.colors.success[600] }]}
          >
            {formatBalance(summary.totalBalance)}
          </Text>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Total Balance
          </Text>
        </Flex>
      </Flex>
    </Card>
  );

  const renderFilterBar = () => (
    <Card variant='outlined' padding='sm' style={styles.filterBar}>
      <Flex direction='row' align='center' justify='space-between'>
        <Flex direction='row' align='center' gap='sm' flex={1}>
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
          <Flex direction='row' wrap gap='xs' style={styles.filterTags}>
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
          <Flex direction='column' flex={1} gap='xs'>
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
              <Flex direction='row' wrap gap='xs' style={styles.tags}>
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

        {/* Floating Action Button */}
        <FloatingActionButton
          onPress={handleAddAccount}
          icon={<Icon name='add' size='md' color='white' />}
          testID='add-account-fab'
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
  summaryCard: {
    backgroundColor: '#F8F9FA',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
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
});

export default AccountsListScreen;
