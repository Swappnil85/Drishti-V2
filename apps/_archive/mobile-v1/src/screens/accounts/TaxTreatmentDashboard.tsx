/**
 * TaxTreatmentDashboard Screen
 * Comprehensive tax treatment management and optimization dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
import ContributionLimitTracker from '../../components/financial/ContributionLimitTracker';
import TaxImpactCalculator from '../../components/financial/TaxImpactCalculator';
import { taxTreatmentService } from '../../services/financial/TaxTreatmentService';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import type FinancialAccount from '../../database/models/FinancialAccount';
import type { TaxTreatment } from '@drishti/shared/types/financial';

type Props = AccountsStackScreenProps<'TaxTreatmentDashboard'>;

interface TaxSummary {
  totalTaxAdvantaged: number;
  totalTaxable: number;
  contributionCapacity: number;
  taxSavingsOpportunity: number;
}

const TaxTreatmentDashboard: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'limits' | 'calculator'>('overview');
  const [taxSummary, setTaxSummary] = useState<TaxSummary>({
    totalTaxAdvantaged: 0,
    totalTaxable: 0,
    contributionCapacity: 0,
    taxSavingsOpportunity: 0,
  });

  useEffect(() => {
    loadAccounts();
  }, [user?.id]);

  const loadAccounts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userAccounts = await database
        .get('financial_accounts')
        .query(
          Q.where('user_id', user.id),
          Q.where('is_active', true)
        )
        .fetch();

      setAccounts(userAccounts as FinancialAccount[]);
      calculateTaxSummary(userAccounts as FinancialAccount[]);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const calculateTaxSummary = (accountList: FinancialAccount[]) => {
    let totalTaxAdvantaged = 0;
    let totalTaxable = 0;
    let contributionCapacity = 0;

    accountList.forEach(account => {
      if (account.taxTreatment === 'taxable') {
        totalTaxable += account.balance;
      } else {
        totalTaxAdvantaged += account.balance;
        
        // Calculate remaining contribution capacity
        const limits = taxTreatmentService.calculateContributionLimits(
          account.taxTreatment as TaxTreatment,
          user?.age || 30
        );
        contributionCapacity += limits.annual;
      }
    });

    // Estimate tax savings opportunity (simplified calculation)
    const taxSavingsOpportunity = contributionCapacity * 0.22; // Assume 22% tax bracket

    setTaxSummary({
      totalTaxAdvantaged,
      totalTaxable,
      contributionCapacity,
      taxSavingsOpportunity,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getContributionData = () => {
    return accounts
      .filter(account => account.taxTreatment !== 'taxable')
      .map(account => ({
        treatment: account.taxTreatment as TaxTreatment,
        currentContributions: 0, // This would come from transaction data
        accountName: account.name,
      }));
  };

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Tax Summary Cards */}
      <View style={styles.summaryGrid}>
        <Card variant="outlined" padding="base" style={styles.summaryCard}>
          <Flex direction="column" align="center" gap="xs">
            <Icon name="shield-checkmark" size="lg" color="success" />
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
              {formatCurrency(taxSummary.totalTaxAdvantaged)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Tax-Advantaged
            </Text>
          </Flex>
        </Card>

        <Card variant="outlined" padding="base" style={styles.summaryCard}>
          <Flex direction="column" align="center" gap="xs">
            <Icon name="receipt" size="lg" color="warning" />
            <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>
              {formatCurrency(taxSummary.totalTaxable)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Taxable
            </Text>
          </Flex>
        </Card>
      </View>

      <View style={styles.summaryGrid}>
        <Card variant="outlined" padding="base" style={styles.summaryCard}>
          <Flex direction="column" align="center" gap="xs">
            <Icon name="trending-up" size="lg" color="info" />
            <Text style={[styles.summaryValue, { color: theme.colors.info }]}>
              {formatCurrency(taxSummary.contributionCapacity)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Contribution Room
            </Text>
          </Flex>
        </Card>

        <Card variant="outlined" padding="base" style={styles.summaryCard}>
          <Flex direction="column" align="center" gap="xs">
            <Icon name="cash" size="lg" color="primary" />
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
              {formatCurrency(taxSummary.taxSavingsOpportunity)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Tax Savings Potential
            </Text>
          </Flex>
        </Card>
      </View>

      {/* Account Breakdown */}
      <Card variant="outlined" padding="lg" style={styles.breakdownCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Account Breakdown
        </Text>
        
        {accounts.map(account => {
          const treatmentInfo = taxTreatmentService.getTaxTreatmentInfo(
            account.taxTreatment as TaxTreatment
          );
          
          return (
            <TouchableOpacity
              key={account.id}
              style={styles.accountItem}
              onPress={() => navigation.navigate('AccountDetails', { accountId: account.id })}
            >
              <Flex direction="row" justify="space-between" align="center">
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: theme.colors.text }]}>
                    {account.name}
                  </Text>
                  <Text style={[styles.treatmentName, { color: theme.colors.textSecondary }]}>
                    {treatmentInfo.name}
                  </Text>
                </View>
                
                <View style={styles.accountBalance}>
                  <Text style={[styles.balanceAmount, { color: theme.colors.text }]}>
                    {formatCurrency(account.balance)}
                  </Text>
                  <Badge
                    variant="outline"
                    color={account.taxTreatment === 'taxable' ? 'warning' : 'success'}
                    size="xs"
                  >
                    {account.taxTreatment === 'taxable' ? 'Taxable' : 'Tax-Advantaged'}
                  </Badge>
                </View>
              </Flex>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Quick Actions */}
      <Card variant="outlined" padding="lg" style={styles.actionsCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Quick Actions
        </Text>
        
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('AddAccount')}
            leftIcon={<Icon name="add" size="sm" />}
            style={styles.actionButton}
          >
            Add Tax-Advantaged Account
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onPress={() => setSelectedTab('limits')}
            leftIcon={<Icon name="analytics" size="sm" />}
            style={styles.actionButton}
          >
            Check Contribution Limits
          </Button>
        </View>
      </Card>
    </ScrollView>
  );

  const renderLimitsTab = () => (
    <ContributionLimitTracker
      contributions={getContributionData()}
      userAge={user?.age || 30}
      userIncome={user?.income}
    />
  );

  const renderCalculatorTab = () => {
    const taxAdvantagedAccounts = accounts.filter(
      account => account.taxTreatment !== 'taxable'
    );

    if (taxAdvantagedAccounts.length === 0) {
      return (
        <Card variant="outlined" padding="lg">
          <Flex direction="column" align="center" gap="base">
            <Icon name="calculator-outline" size="lg" color="textSecondary" />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Tax-Advantaged Accounts
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Add retirement or HSA accounts to use the tax impact calculator
            </Text>
            <Button
              variant="filled"
              onPress={() => navigation.navigate('AddAccount')}
              leftIcon={<Icon name="add" size="sm" />}
            >
              Add Account
            </Button>
          </Flex>
        </Card>
      );
    }

    return (
      <TaxImpactCalculator
        accountBalance={taxAdvantagedAccounts[0].balance}
        taxTreatment={taxAdvantagedAccounts[0].taxTreatment as TaxTreatment}
        userAge={user?.age || 30}
      />
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'limits':
        return renderLimitsTab();
      case 'calculator':
        return renderCalculatorTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <ScreenTemplate
        title="Tax Treatment"
        showBackButton
        scrollable={false}
        padding="none"
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading tax information...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      title="Tax Treatment"
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
              selectedTab === 'overview' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'overview' 
                    ? theme.colors.onPrimary 
                    : theme.colors.textSecondary
                }
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'limits' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setSelectedTab('limits')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'limits' 
                    ? theme.colors.onPrimary 
                    : theme.colors.textSecondary
                }
              ]}
            >
              Limits
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'calculator' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setSelectedTab('calculator')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'calculator' 
                    ? theme.colors.onPrimary 
                    : theme.colors.textSecondary
                }
              ]}
            >
              Calculator
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {renderTabContent()}
        </View>
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  breakdownCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  accountItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  treatmentName: {
    fontSize: 14,
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TaxTreatmentDashboard;
