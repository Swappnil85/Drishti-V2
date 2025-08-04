/**
 * AccountRecoveryScreen Component
 * Manage deleted and archived accounts with recovery options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AccountsStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ScreenTemplate,
  Card,
  Button,
  Icon,
  Flex,
  Badge,
} from '../../components/ui';
import { database } from '../../database';
import FinancialAccount from '../../database/models/FinancialAccount';
import { useFormHaptic } from '../../hooks/useHaptic';
import { Q } from '@nozbe/watermelondb';

type Props = AccountsStackScreenProps<'AccountRecovery'>;

interface RecoverableAccount {
  account: FinancialAccount;
  deletedAt?: Date;
  archivedAt?: Date;
  type: 'deleted' | 'archived';
  daysRemaining?: number;
}

const AccountRecoveryScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [deletedAccounts, setDeletedAccounts] = useState<RecoverableAccount[]>([]);
  const [archivedAccounts, setArchivedAccounts] = useState<RecoverableAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'deleted' | 'archived'>('deleted');

  useEffect(() => {
    loadRecoverableAccounts();
  }, [user?.id]);

  const loadRecoverableAccounts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load deleted accounts (is_active = false)
      const deletedAccountsData = await database
        .get('financial_accounts')
        .query(
          Q.where('user_id', user.id),
          Q.where('is_active', false)
        )
        .fetch();

      // Load archived accounts (is_active = true but archived in metadata)
      const allActiveAccounts = await database
        .get('financial_accounts')
        .query(
          Q.where('user_id', user.id),
          Q.where('is_active', true)
        )
        .fetch();

      const archivedAccountsData = allActiveAccounts.filter((account: FinancialAccount) => {
        const metadata = account.metadata;
        return metadata.archived === true;
      });

      // Process deleted accounts
      const processedDeletedAccounts: RecoverableAccount[] = deletedAccountsData.map((account: FinancialAccount) => {
        const deletedAt = account.updatedAt;
        const daysSinceDeleted = Math.floor((Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 30 - daysSinceDeleted);

        return {
          account,
          deletedAt,
          type: 'deleted',
          daysRemaining,
        };
      });

      // Process archived accounts
      const processedArchivedAccounts: RecoverableAccount[] = archivedAccountsData.map((account: FinancialAccount) => {
        const metadata = account.metadata;
        const archivedAt = metadata.archivedAt ? new Date(metadata.archivedAt) : account.updatedAt;

        return {
          account,
          archivedAt,
          type: 'archived',
        };
      });

      setDeletedAccounts(processedDeletedAccounts);
      setArchivedAccounts(processedArchivedAccounts);
    } catch (error) {
      console.error('Error loading recoverable accounts:', error);
      Alert.alert('Error', 'Failed to load recoverable accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (recoverableAccount: RecoverableAccount) => {
    const { account, type } = recoverableAccount;

    Alert.alert(
      `Restore ${type === 'deleted' ? 'Deleted' : 'Archived'} Account`,
      `Restore "${account.name}" to your active accounts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await database.write(async () => {
                await account.update((acc: FinancialAccount) => {
                  if (type === 'deleted') {
                    acc.isActive = true;
                  } else {
                    // Remove archived flag from metadata
                    const metadata = acc.metadata;
                    delete metadata.archived;
                    delete metadata.archivedAt;
                    acc.metadataRaw = JSON.stringify(metadata);
                  }
                  acc.updatedAt = new Date();
                });
              });

              await haptic.success();
              Alert.alert(
                'Account Restored',
                `"${account.name}" has been restored to your active accounts.`,
                [
                  {
                    text: 'OK',
                    onPress: () => loadRecoverableAccounts(),
                  },
                ]
              );
            } catch (error) {
              console.error('Error restoring account:', error);
              await haptic.error();
              Alert.alert('Error', 'Failed to restore account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePermanentDelete = async (recoverableAccount: RecoverableAccount) => {
    const { account } = recoverableAccount;

    Alert.alert(
      'Permanently Delete Account',
      `Permanently delete "${account.name}"? This action cannot be undone and all account data will be lost forever.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await account.destroyPermanently();
              });

              await haptic.success();
              Alert.alert(
                'Account Permanently Deleted',
                `"${account.name}" has been permanently deleted.`,
                [
                  {
                    text: 'OK',
                    onPress: () => loadRecoverableAccounts(),
                  },
                ]
              );
            } catch (error) {
              console.error('Error permanently deleting account:', error);
              await haptic.error();
              Alert.alert('Error', 'Failed to delete account permanently. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderAccountItem = (recoverableAccount: RecoverableAccount) => {
    const { account, type, deletedAt, archivedAt, daysRemaining } = recoverableAccount;

    return (
      <Card
        key={account.id}
        variant="outlined"
        padding="lg"
        style={styles.accountCard}
      >
        <Flex direction="row" justify="space-between" align="flex-start" style={styles.accountHeader}>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountName, { color: theme.colors.text }]}>
              {account.name}
            </Text>
            <Text style={[styles.accountDetails, { color: theme.colors.textSecondary }]}>
              {account.accountType} • {formatCurrency(account.balance)}
            </Text>
            {account.institution && (
              <Text style={[styles.accountInstitution, { color: theme.colors.textSecondary }]}>
                {account.institution}
              </Text>
            )}
          </View>

          <View style={styles.statusContainer}>
            <Badge
              variant="filled"
              color={type === 'deleted' ? 'error' : 'warning'}
              size="sm"
            >
              {type === 'deleted' ? 'Deleted' : 'Archived'}
            </Badge>
            {type === 'deleted' && daysRemaining !== undefined && (
              <Text style={[styles.daysRemaining, { color: theme.colors.textSecondary }]}>
                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expires today'}
              </Text>
            )}
          </View>
        </Flex>

        <View style={styles.dateInfo}>
          <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
            {type === 'deleted' ? 'Deleted:' : 'Archived:'}
          </Text>
          <Text style={[styles.dateValue, { color: theme.colors.textSecondary }]}>
            {formatDate(type === 'deleted' ? deletedAt! : archivedAt!)}
          </Text>
        </View>

        <Flex direction="row" gap="sm" style={styles.actionButtons}>
          <Button
            variant="filled"
            size="sm"
            onPress={() => handleRestore(recoverableAccount)}
            leftIcon={<Icon name="refresh-outline" size="sm" />}
            style={styles.actionButton}
          >
            Restore
          </Button>

          {type === 'deleted' && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => handlePermanentDelete(recoverableAccount)}
              leftIcon={<Icon name="trash-outline" size="sm" />}
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
            >
              <Text style={{ color: theme.colors.error }}>Delete Forever</Text>
            </Button>
          )}
        </Flex>
      </Card>
    );
  };

  const renderEmptyState = (type: 'deleted' | 'archived') => (
    <Card variant="outlined" padding="lg">
      <Flex direction="column" align="center" gap="base">
        <Icon
          name={type === 'deleted' ? 'checkmark-circle-outline' : 'archive-outline'}
          size="lg"
          color="success"
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          No {type === 'deleted' ? 'Deleted' : 'Archived'} Accounts
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          {type === 'deleted'
            ? 'You have no deleted accounts to recover.'
            : 'You have no archived accounts to restore.'}
        </Text>
      </Flex>
    </Card>
  );

  if (loading) {
    return (
      <ScreenTemplate
        title="Account Recovery"
        showBackButton
        scrollable={false}
        padding="none"
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading recoverable accounts...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  const currentAccounts = selectedTab === 'deleted' ? deletedAccounts : archivedAccounts;

  return (
    <ScreenTemplate
      title="Account Recovery"
      showBackButton
      scrollable={false}
      padding="none"
    >
      <View style={styles.container}>
        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'deleted' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setSelectedTab('deleted')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'deleted'
                    ? theme.colors.onPrimary
                    : theme.colors.textSecondary
                }
              ]}
            >
              Deleted ({deletedAccounts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'archived' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setSelectedTab('archived')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'archived'
                    ? theme.colors.onPrimary
                    : theme.colors.textSecondary
                }
              ]}
            >
              Archived ({archivedAccounts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedTab === 'deleted' && (
            <Card variant="outlined" padding="lg" style={styles.infoCard}>
              <Flex direction="row" align="center" gap="sm">
                <Icon name="information-circle-outline" size="md" color="info" />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
                    Deleted Account Recovery
                  </Text>
                  <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    Deleted accounts can be recovered for 30 days. After that, they are permanently deleted.
                  </Text>
                </View>
              </Flex>
            </Card>
          )}

          {currentAccounts.length === 0
            ? renderEmptyState(selectedTab)
            : currentAccounts.map(renderAccountItem)
          }
        </ScrollView>
      </View>
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  accountCard: {
    marginBottom: 16,
  },
  accountHeader: {
    marginBottom: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  accountInstitution: {
    fontSize: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  daysRemaining: {
    fontSize: 12,
    marginTop: 4,
  },
  dateInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AccountRecoveryScreen;
