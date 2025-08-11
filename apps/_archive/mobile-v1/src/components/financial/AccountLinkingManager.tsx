/**
 * Account Linking Manager Component
 * Manages linked accounts for organization and relationships
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Icon, Button, Flex, Avatar, Input } from '../ui';
import { database } from '../../database';
import FinancialAccount from '../../database/models/FinancialAccount';
import { useAuth } from '../../contexts/AuthContext';
import { useFormHaptic } from '../../hooks/useHaptic';

interface AccountLinkingManagerProps {
  currentAccountId?: string;
  linkedAccountIds: string[];
  onLinkedAccountsChange: (accountIds: string[]) => void;
  label?: string;
  maxLinks?: number;
  testID?: string;
}

interface AccountOption {
  id: string;
  name: string;
  accountType: string;
  institution?: string;
  balance: number;
  currency: string;
  color?: string;
}

const AccountLinkingManager: React.FC<AccountLinkingManagerProps> = ({
  currentAccountId,
  linkedAccountIds,
  onLinkedAccountsChange,
  label = 'Linked Accounts',
  maxLinks = 5,
  testID,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const formHaptic = useFormHaptic();
  
  const [availableAccounts, setAvailableAccounts] = useState<AccountOption[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<AccountOption[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [currentAccountId, linkedAccountIds]);

  const loadAccounts = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const accountsCollection = database.get('financial_accounts');
      
      // Get all user's accounts except current one
      const allAccounts = await accountsCollection
        .query(
          Q.where('user_id', user.id),
          Q.where('is_active', true),
          ...(currentAccountId ? [Q.where('id', Q.notEq(currentAccountId))] : [])
        )
        .fetch() as FinancialAccount[];

      const accountOptions: AccountOption[] = allAccounts.map(account => ({
        id: account.id,
        name: account.name,
        accountType: account.accountType,
        institution: account.institution,
        balance: account.balance,
        currency: account.currency,
        color: account.color,
      }));

      // Separate linked and available accounts
      const linked = accountOptions.filter(account => 
        linkedAccountIds.includes(account.id)
      );
      const available = accountOptions.filter(account => 
        !linkedAccountIds.includes(account.id)
      );

      setLinkedAccounts(linked);
      setAvailableAccounts(available);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLinkedAccount = async (accountId: string) => {
    if (linkedAccountIds.length >= maxLinks) {
      return;
    }
    
    await formHaptic.success();
    const newLinkedIds = [...linkedAccountIds, accountId];
    onLinkedAccountsChange(newLinkedIds);
    setModalVisible(false);
  };

  const removeLinkedAccount = async (accountId: string) => {
    await formHaptic.light();
    const newLinkedIds = linkedAccountIds.filter(id => id !== accountId);
    onLinkedAccountsChange(newLinkedIds);
  };

  const openModal = async () => {
    await formHaptic.light();
    setModalVisible(true);
    setSearchTerm('');
  };

  const getAccountIcon = (accountType: string): string => {
    const iconMap: Record<string, string> = {
      checking: 'card-outline',
      savings: 'wallet-outline',
      investment: 'trending-up-outline',
      retirement: 'time-outline',
      credit: 'card',
      loan: 'home-outline',
      other: 'ellipsis-horizontal-outline',
    };
    return iconMap[accountType] || 'wallet-outline';
  };

  const getAccountColor = (account: AccountOption): string => {
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
      };
      return colorMap[account.color] || '#607D8B';
    }
    return '#607D8B';
  };

  const filteredAvailableAccounts = availableAccounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.institution && account.institution.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderLinkedAccount = (account: AccountOption) => (
    <Card
      key={account.id}
      variant="outlined"
      padding="sm"
      style={[styles.linkedAccountCard, { borderColor: getAccountColor(account) }]}
    >
      <Flex direction="row" align="center" justify="space-between">
        <Flex direction="row" align="center" gap="sm" flex={1}>
          <Avatar
            size="sm"
            backgroundColor={getAccountColor(account)}
            fallbackIcon={getAccountIcon(account.accountType)}
          />
          <Flex direction="column" flex={1}>
            <Text style={[styles.accountName, { color: theme.colors.text.primary }]}>
              {account.name}
            </Text>
            <Text style={[styles.accountDetails, { color: theme.colors.text.secondary }]}>
              {account.institution} • {account.accountType}
            </Text>
          </Flex>
        </Flex>
        
        <TouchableOpacity
          onPress={() => removeLinkedAccount(account.id)}
          style={styles.removeButton}
          testID={`remove-link-${account.id}`}
        >
          <Icon
            name="close-circle"
            size="sm"
            color="error.500"
          />
        </TouchableOpacity>
      </Flex>
    </Card>
  );

  const renderAvailableAccount = ({ item }: { item: AccountOption }) => (
    <TouchableOpacity
      onPress={() => addLinkedAccount(item.id)}
      style={styles.availableAccountItem}
      testID={`add-link-${item.id}`}
    >
      <Flex direction="row" align="center" gap="base">
        <Avatar
          size="md"
          backgroundColor={getAccountColor(item)}
          fallbackIcon={getAccountIcon(item.accountType)}
        />
        <Flex direction="column" flex={1}>
          <Text style={[styles.accountName, { color: theme.colors.text.primary }]}>
            {item.name}
          </Text>
          <Text style={[styles.accountDetails, { color: theme.colors.text.secondary }]}>
            {item.institution} • {item.accountType}
          </Text>
          <Text style={[styles.accountBalance, { color: theme.colors.text.tertiary }]}>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: item.currency,
            }).format(item.balance)}
          </Text>
        </Flex>
        <Icon
          name="add-circle-outline"
          size="sm"
          color="primary.500"
        />
      </Flex>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID={testID}>
      <Flex direction="row" align="center" justify="space-between">
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {label}
        </Text>
        {linkedAccountIds.length < maxLinks && availableAccounts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onPress={openModal}
            rightIcon={<Icon name="add" size="sm" />}
            testID="add-link-button"
          >
            Link Account
          </Button>
        )}
      </Flex>

      {linkedAccounts.length > 0 ? (
        <View style={styles.linkedAccountsContainer}>
          {linkedAccounts.map(renderLinkedAccount)}
        </View>
      ) : (
        <Card variant="outlined" padding="lg" style={styles.emptyState}>
          <Flex direction="column" align="center" gap="sm">
            <Icon
              name="link-outline"
              size="lg"
              color="text.tertiary"
            />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              No linked accounts
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
              Link related accounts to organize your finances
            </Text>
          </Flex>
        </Card>
      )}

      <Text style={[styles.linkCount, { color: theme.colors.text.tertiary }]}>
        {linkedAccountIds.length} of {maxLinks} links used
      </Text>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border.primary }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              Link Account
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setModalVisible(false)}
              rightIcon={<Icon name="close" size="sm" />}
            >
              Close
            </Button>
          </View>

          <View style={styles.modalContent}>
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              leftIcon={<Icon name="search-outline" size="sm" color="text.tertiary" />}
              style={styles.searchInput}
            />

            <FlatList
              data={filteredAvailableAccounts}
              renderItem={renderAvailableAccount}
              keyExtractor={(item) => item.id}
              style={styles.accountsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                    No accounts available to link
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkedAccountsContainer: {
    gap: 8,
  },
  linkedAccountCard: {
    borderWidth: 2,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  linkCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  accountsList: {
    flex: 1,
  },
  availableAccountItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
});

export default AccountLinkingManager;
