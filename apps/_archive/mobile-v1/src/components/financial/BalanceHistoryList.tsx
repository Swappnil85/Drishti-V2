/**
 * BalanceHistoryList Component
 * Displays balance change history with trend analysis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { balanceUpdateService } from '../../services/financial/BalanceUpdateService';
import type BalanceHistory from '../../database/models/BalanceHistory';

interface BalanceHistoryListProps {
  accountId?: string;
  userId?: string;
  limit?: number;
  showAccountNames?: boolean;
}

const BalanceHistoryList: React.FC<BalanceHistoryListProps> = ({
  accountId,
  userId,
  limit = 50,
  showAccountNames = false,
}) => {
  const { theme } = useTheme();
  const [history, setHistory] = useState<BalanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [accountId, userId, limit]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      let historyData: BalanceHistory[];

      if (accountId) {
        historyData = await balanceUpdateService.getBalanceHistory(accountId, limit);
      } else if (userId) {
        historyData = await balanceUpdateService.getRecentBalanceChanges(userId, limit);
      } else {
        historyData = [];
      }

      setHistory(historyData);
    } catch (error) {
      console.error('Error loading balance history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUpdateMethodIcon = (method: string) => {
    switch (method) {
      case 'manual':
        return 'create-outline';
      case 'bulk':
        return 'layers-outline';
      case 'import':
        return 'download-outline';
      case 'automatic':
        return 'sync-outline';
      default:
        return 'create-outline';
    }
  };

  const getUpdateMethodLabel = (method: string) => {
    switch (method) {
      case 'manual':
        return 'Manual';
      case 'bulk':
        return 'Bulk Update';
      case 'import':
        return 'Import';
      case 'automatic':
        return 'Automatic';
      default:
        return 'Manual';
    }
  };

  const renderHistoryItem = ({ item }: { item: BalanceHistory }) => {
    const isIncrease = item.changeAmount > 0;
    const isSignificant = item.isSignificantChange();
    const magnitude = item.getChangeMagnitude();

    return (
      <View style={[styles.historyItem, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.itemHeader}>
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getUpdateMethodIcon(item.updateMethod)}
                size={16}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.itemInfo}>
              {showAccountNames && (
                <Text style={[styles.accountName, { color: theme.colors.text }]}>
                  Account Name
                </Text>
              )}
              <Text style={[styles.updateMethod, { color: theme.colors.textSecondary }]}>
                {getUpdateMethodLabel(item.updateMethod)}
              </Text>
              <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={styles.balanceChange}>
              <Text style={[styles.newBalance, { color: theme.colors.text }]}>
                {formatCurrency(item.newBalance)}
              </Text>
              <View style={styles.changeIndicator}>
                <Ionicons
                  name={isIncrease ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={isIncrease ? theme.colors.success : theme.colors.error}
                />
                <Text
                  style={[
                    styles.changeAmount,
                    { color: isIncrease ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {item.getFormattedChangeAmount()}
                </Text>
                <Text
                  style={[
                    styles.changePercentage,
                    { color: isIncrease ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  ({item.getFormattedChangePercentage()})
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Previous Balance */}
        <View style={styles.previousBalance}>
          <Text style={[styles.previousBalanceLabel, { color: theme.colors.textSecondary }]}>
            Previous: {formatCurrency(item.previousBalance)}
          </Text>
        </View>

        {/* Magnitude Indicator */}
        {isSignificant && (
          <View style={styles.significantIndicator}>
            <Ionicons name="warning" size={12} color={theme.colors.warning} />
            <Text style={[styles.significantText, { color: theme.colors.warning }]}>
              {magnitude.charAt(0).toUpperCase() + magnitude.slice(1)} change
            </Text>
          </View>
        )}

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.notes, { color: theme.colors.textSecondary }]}>
              "{item.notes}"
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={48} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Balance History
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Balance changes will appear here once you start updating account balances.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading balance history...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  updateMethod: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  balanceChange: {
    alignItems: 'flex-end',
  },
  newBalance: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  changePercentage: {
    fontSize: 12,
    marginLeft: 4,
  },
  previousBalance: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  previousBalanceLabel: {
    fontSize: 12,
  },
  significantIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  significantText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BalanceHistoryList;
