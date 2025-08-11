/**
 * ContributionLimitTracker Component
 * Tracks and displays contribution limits for tax-advantaged accounts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Flex, Badge, Button, Icon } from '../ui';
import { taxTreatmentService, type ContributionAlert } from '../../services/financial/TaxTreatmentService';
import type { TaxTreatment } from '@drishti/shared/types/financial';

interface ContributionData {
  treatment: TaxTreatment;
  currentContributions: number;
  accountName: string;
}

interface ContributionLimitTrackerProps {
  contributions: ContributionData[];
  userAge: number;
  userIncome?: number;
  onContributionUpdate?: (treatment: TaxTreatment, amount: number) => void;
}

const ContributionLimitTracker: React.FC<ContributionLimitTrackerProps> = ({
  contributions,
  userAge,
  userIncome,
  onContributionUpdate,
}) => {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<ContributionAlert[]>([]);
  const [expandedTreatment, setExpandedTreatment] = useState<TaxTreatment | null>(null);

  useEffect(() => {
    updateAlerts();
  }, [contributions, userAge, userIncome]);

  const updateAlerts = () => {
    const newAlerts = contributions.map(contribution =>
      taxTreatmentService.checkContributionLimits(
        contribution.treatment,
        contribution.currentContributions,
        userAge,
        userIncome
      )
    );
    setAlerts(newAlerts);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAlertColor = (alertType: ContributionAlert['alertType']) => {
    switch (alertType) {
      case 'over_limit':
        return theme.colors.error;
      case 'at_limit':
        return theme.colors.warning;
      case 'approaching_limit':
        return theme.colors.info;
      case 'catch_up_eligible':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getAlertIcon = (alertType: ContributionAlert['alertType']) => {
    switch (alertType) {
      case 'over_limit':
        return 'warning';
      case 'at_limit':
        return 'checkmark-circle';
      case 'approaching_limit':
        return 'information-circle';
      case 'catch_up_eligible':
        return 'trending-up';
      default:
        return 'information-circle';
    }
  };

  const handleContributionPress = (treatment: TaxTreatment) => {
    if (expandedTreatment === treatment) {
      setExpandedTreatment(null);
    } else {
      setExpandedTreatment(treatment);
    }
  };

  const handleOptimizeContributions = () => {
    Alert.alert(
      'Contribution Optimization',
      'Would you like to see recommendations for optimizing your retirement contributions across all accounts?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show Recommendations', onPress: showOptimizationRecommendations },
      ]
    );
  };

  const showOptimizationRecommendations = () => {
    // Calculate total contribution capacity
    const totalCapacity = alerts.reduce((sum, alert) => sum + alert.limit, 0);
    const totalContributions = alerts.reduce((sum, alert) => sum + alert.currentContributions, 0);
    const remainingCapacity = totalCapacity - totalContributions;

    Alert.alert(
      'Contribution Recommendations',
      `Total Capacity: ${formatCurrency(totalCapacity)}\n` +
      `Current Contributions: ${formatCurrency(totalContributions)}\n` +
      `Remaining Capacity: ${formatCurrency(remainingCapacity)}\n\n` +
      'Consider maximizing employer match first, then Roth IRA, then traditional 401(k).',
      [{ text: 'OK' }]
    );
  };

  const renderProgressBar = (alert: ContributionAlert) => {
    const percentage = Math.min(100, alert.percentageUsed);
    const isOverLimit = alert.percentageUsed > 100;

    return (
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.colors.background }
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, percentage)}%`,
                backgroundColor: isOverLimit 
                  ? theme.colors.error 
                  : percentage >= 80 
                    ? theme.colors.warning 
                    : theme.colors.success,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {percentage.toFixed(0)}%
        </Text>
      </View>
    );
  };

  const renderContributionDetails = (alert: ContributionAlert) => {
    const info = taxTreatmentService.getTaxTreatmentInfo(alert.treatment);
    const limits = taxTreatmentService.calculateContributionLimits(
      alert.treatment,
      userAge,
      userIncome
    );

    return (
      <View style={styles.detailsContainer}>
        <Flex direction="row" justify="space-between" style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Annual Limit
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {formatCurrency(alert.limit)}
          </Text>
        </Flex>

        <Flex direction="row" justify="space-between" style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Current Contributions
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {formatCurrency(alert.currentContributions)}
          </Text>
        </Flex>

        <Flex direction="row" justify="space-between" style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Remaining Capacity
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.success }]}>
            {formatCurrency(alert.remainingCapacity)}
          </Text>
        </Flex>

        {userAge >= 50 && limits.catchUp && (
          <Flex direction="row" justify="space-between" style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              Catch-up Contribution
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.info }]}>
              {formatCurrency(limits.catchUp)}
            </Text>
          </Flex>
        )}

        <View style={styles.benefitsContainer}>
          <Text style={[styles.benefitsTitle, { color: theme.colors.text }]}>
            Tax Benefits
          </Text>
          <View style={styles.benefitsList}>
            {info.taxDeductible && (
              <Text style={[styles.benefitItem, { color: theme.colors.textSecondary }]}>
                • Tax-deductible contributions
              </Text>
            )}
            {info.taxFreeGrowth && (
              <Text style={[styles.benefitItem, { color: theme.colors.textSecondary }]}>
                • Tax-free growth
              </Text>
            )}
            {info.taxFreeWithdrawals && (
              <Text style={[styles.benefitItem, { color: theme.colors.textSecondary }]}>
                • Tax-free withdrawals
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (contributions.length === 0) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Icon name="information-circle-outline" size="lg" color="textSecondary" />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Tax-Advantaged Accounts
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Add retirement or HSA accounts to track contribution limits
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Flex direction="row" justify="space-between" align="center" style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Contribution Limits
        </Text>
        <Button
          variant="outline"
          size="sm"
          onPress={handleOptimizeContributions}
          rightIcon={<Icon name="analytics-outline" size="sm" />}
        >
          Optimize
        </Button>
      </Flex>

      {alerts.map((alert, index) => {
        const contribution = contributions[index];
        const isExpanded = expandedTreatment === alert.treatment;

        return (
          <Card
            key={alert.treatment}
            variant="outlined"
            padding="base"
            style={styles.contributionCard}
          >
            <TouchableOpacity onPress={() => handleContributionPress(alert.treatment)}>
              <Flex direction="column" gap="sm">
                <Flex direction="row" justify="space-between" align="center">
                  <View style={styles.treatmentInfo}>
                    <Text style={[styles.treatmentName, { color: theme.colors.text }]}>
                      {taxTreatmentService.getTaxTreatmentInfo(alert.treatment).name}
                    </Text>
                    <Text style={[styles.accountName, { color: theme.colors.textSecondary }]}>
                      {contribution.accountName}
                    </Text>
                  </View>

                  <Flex direction="row" align="center" gap="sm">
                    <Badge
                      variant="filled"
                      color={getAlertColor(alert.alertType)}
                      size="sm"
                    >
                      <Icon
                        name={getAlertIcon(alert.alertType)}
                        size="xs"
                        color="white"
                      />
                    </Badge>
                    <Icon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size="sm"
                      color="textSecondary"
                    />
                  </Flex>
                </Flex>

                {renderProgressBar(alert)}

                <Text style={[styles.alertMessage, { color: getAlertColor(alert.alertType) }]}>
                  {alert.message}
                </Text>

                {isExpanded && renderContributionDetails(alert)}
              </Flex>
            </TouchableOpacity>
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  contributionCard: {
    marginBottom: 8,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  accountName: {
    fontSize: 14,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  benefitsContainer: {
    marginTop: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ContributionLimitTracker;
