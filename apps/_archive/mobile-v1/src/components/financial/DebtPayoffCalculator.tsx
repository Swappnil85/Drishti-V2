/**
 * DebtPayoffCalculator Component
 * Snowball vs Avalanche strategy comparison with interactive calculations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Icon, Flex, Badge, Input } from '../ui';
import { debtService, DebtPayoffComparison, PayoffStrategy } from '../../services/financial/DebtService';
import { useFormHaptic } from '../../hooks/useHaptic';

interface DebtPayoffCalculatorProps {
  onStrategySelect?: (strategy: 'snowball' | 'avalanche') => void;
}

const DebtPayoffCalculator: React.FC<DebtPayoffCalculatorProps> = ({
  onStrategySelect,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [comparison, setComparison] = useState<DebtPayoffComparison | null>(null);
  const [extraPayment, setExtraPayment] = useState('0');
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<'snowball' | 'avalanche' | null>(null);

  useEffect(() => {
    if (user?.id) {
      calculateComparison();
    }
  }, [user?.id, extraPayment]);

  const calculateComparison = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const extraAmount = parseFloat(extraPayment) || 0;
      const result = await debtService.comparePayoffStrategies(user.id, extraAmount);
      setComparison(result);
    } catch (error) {
      console.error('Error calculating payoff comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonths = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    
    return `${years}y ${remainingMonths}m`;
  };

  const handleExtraPaymentChange = (value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setExtraPayment(numericValue);
  };

  const handleStrategySelect = (strategy: 'snowball' | 'avalanche') => {
    haptic.light();
    setSelectedStrategy(strategy);
    onStrategySelect?.(strategy);
  };

  const renderExtraPaymentInput = () => {
    return (
      <Card variant="outlined" padding="lg" style={styles.inputCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Extra Monthly Payment
        </Text>
        <Text style={[styles.inputDescription, { color: theme.colors.textSecondary }]}>
          How much extra can you pay toward debt each month?
        </Text>
        
        <Input
          value={extraPayment}
          onChangeText={handleExtraPaymentChange}
          placeholder="0"
          keyboardType="numeric"
          leftIcon={<Text style={styles.dollarSign}>$</Text>}
          style={styles.paymentInput}
        />
      </Card>
    );
  };

  const renderStrategyCard = (strategy: PayoffStrategy, type: 'snowball' | 'avalanche') => {
    const isRecommended = comparison?.recommendation === type;
    const isSelected = selectedStrategy === type;
    
    const cardStyle = [
      styles.strategyCard,
      isRecommended && styles.recommendedCard,
      isSelected && styles.selectedCard,
    ];

    const titleColor = isRecommended ? theme.colors.success : theme.colors.text;
    const borderColor = isSelected ? theme.colors.primary : (isRecommended ? theme.colors.success : theme.colors.border);

    return (
      <TouchableOpacity
        style={[cardStyle, { borderColor }]}
        onPress={() => handleStrategySelect(type)}
      >
        <Card variant="outlined" padding="lg" style={styles.strategyContent}>
          <Flex direction="row" justify="space-between" align="center" style={styles.strategyHeader}>
            <View>
              <Text style={[styles.strategyTitle, { color: titleColor }]}>
                {type === 'snowball' ? 'Debt Snowball' : 'Debt Avalanche'}
              </Text>
              {isRecommended && (
                <Badge variant="filled" color="success" size="sm" style={styles.recommendedBadge}>
                  Recommended
                </Badge>
              )}
            </View>
            
            {isSelected && (
              <Icon name="checkmark-circle" size="md" color="primary" />
            )}
          </Flex>

          <Text style={[styles.strategyDescription, { color: theme.colors.textSecondary }]}>
            {strategy.description}
          </Text>

          <View style={styles.strategyMetrics}>
            <Flex direction="row" justify="space-between" style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                Total Interest:
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {formatCurrency(strategy.totalInterest)}
              </Text>
            </Flex>

            <Flex direction="row" justify="space-between" style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                Payoff Time:
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {formatMonths(strategy.totalTime)}
              </Text>
            </Flex>
          </View>

          <View style={styles.payoffOrder}>
            <Text style={[styles.orderTitle, { color: theme.colors.text }]}>
              Payoff Order:
            </Text>
            {strategy.payoffOrder.slice(0, 3).map((account, index) => (
              <Text key={account.accountId} style={[styles.orderItem, { color: theme.colors.textSecondary }]}>
                {index + 1}. {account.accountName} ({formatMonths(account.payoffMonth)})
              </Text>
            ))}
            {strategy.payoffOrder.length > 3 && (
              <Text style={[styles.orderItem, { color: theme.colors.textSecondary }]}>
                +{strategy.payoffOrder.length - 3} more accounts
              </Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderComparison = () => {
    if (!comparison) return null;

    return (
      <Card variant="outlined" padding="lg" style={styles.comparisonCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Strategy Comparison
        </Text>

        <View style={styles.comparisonGrid}>
          <Flex direction="row" gap="sm">
            {renderStrategyCard(comparison.snowball, 'snowball')}
            {renderStrategyCard(comparison.avalanche, 'avalanche')}
          </Flex>
        </View>

        {comparison.savings.interestSaved > 0 && (
          <View style={styles.savingsHighlight}>
            <Flex direction="row" align="center" gap="sm">
              <Icon name="trending-down" size="sm" color="success" />
              <Text style={[styles.savingsText, { color: theme.colors.success }]}>
                Avalanche saves {formatCurrency(comparison.savings.interestSaved)} in interest
                {comparison.savings.timeSaved > 0 && ` and ${formatMonths(comparison.savings.timeSaved)}`}
              </Text>
            </Flex>
          </View>
        )}
      </Card>
    );
  };

  const renderRecommendation = () => {
    if (!comparison) return null;

    const recommendedStrategy = comparison.recommendation === 'snowball' ? comparison.snowball : comparison.avalanche;
    const isSnowball = comparison.recommendation === 'snowball';

    return (
      <Card variant="filled" padding="lg" style={styles.recommendationCard}>
        <Flex direction="row" align="center" gap="sm" style={styles.recommendationHeader}>
          <Icon name="lightbulb" size="md" color="onPrimary" />
          <Text style={[styles.recommendationTitle, { color: theme.colors.onPrimary }]}>
            Our Recommendation
          </Text>
        </Flex>

        <Text style={[styles.recommendationText, { color: theme.colors.onPrimary }]}>
          {isSnowball 
            ? "Start with the Debt Snowball method. The psychological wins from paying off smaller debts first can help you stay motivated on your debt-free journey."
            : "Use the Debt Avalanche method. You'll save significant money in interest and pay off your debt faster by focusing on high-interest accounts first."
          }
        </Text>

        <View style={styles.recommendationStats}>
          <Flex direction="row" justify="space-around">
            <View style={styles.recommendationStat}>
              <Text style={[styles.recommendationStatValue, { color: theme.colors.onPrimary }]}>
                {formatCurrency(recommendedStrategy.totalInterest)}
              </Text>
              <Text style={[styles.recommendationStatLabel, { color: theme.colors.onPrimary }]}>
                Total Interest
              </Text>
            </View>

            <View style={styles.recommendationStat}>
              <Text style={[styles.recommendationStatValue, { color: theme.colors.onPrimary }]}>
                {formatMonths(recommendedStrategy.totalTime)}
              </Text>
              <Text style={[styles.recommendationStatLabel, { color: theme.colors.onPrimary }]}>
                Payoff Time
              </Text>
            </View>
          </Flex>
        </View>
      </Card>
    );
  };

  const renderActionButtons = () => {
    if (!selectedStrategy) return null;

    return (
      <Card variant="outlined" padding="lg" style={styles.actionsCard}>
        <Flex direction="row" gap="sm">
          <Button
            variant="filled"
            onPress={() => {
              // Navigate to payment allocation or debt management
              console.log('Start selected strategy:', selectedStrategy);
            }}
            leftIcon={<Icon name="play" size="sm" />}
            style={styles.actionButton}
          >
            Start {selectedStrategy === 'snowball' ? 'Snowball' : 'Avalanche'}
          </Button>
          
          <Button
            variant="outline"
            onPress={() => {
              // Share or export strategy
              console.log('Share strategy:', selectedStrategy);
            }}
            leftIcon={<Icon name="share" size="sm" />}
            style={styles.actionButton}
          >
            Share Plan
          </Button>
        </Flex>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Calculating payoff strategies...
          </Text>
        </Flex>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Icon name="alert-circle-outline" size="lg" color="error" />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Unable to calculate payoff strategies
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
            Make sure you have debt accounts with interest rates set up
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderExtraPaymentInput()}
      {renderComparison()}
      {renderRecommendation()}
      {renderActionButtons()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentInput: {
    fontSize: 18,
  },
  comparisonCard: {
    marginBottom: 16,
  },
  comparisonGrid: {
    marginTop: 16,
  },
  strategyCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  recommendedCard: {
    borderColor: '#4CAF50',
  },
  selectedCard: {
    borderColor: '#2196F3',
  },
  strategyContent: {
    margin: 0,
    padding: 16,
  },
  strategyHeader: {
    marginBottom: 8,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendedBadge: {
    marginTop: 4,
  },
  strategyDescription: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
  },
  strategyMetrics: {
    marginBottom: 16,
  },
  metricRow: {
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  payoffOrder: {
    // Payoff order styles
  },
  orderTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderItem: {
    fontSize: 10,
    marginBottom: 2,
  },
  savingsHighlight: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recommendationCard: {
    marginBottom: 16,
  },
  recommendationHeader: {
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  recommendationStats: {
    // Recommendation stats styles
  },
  recommendationStat: {
    alignItems: 'center',
  },
  recommendationStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DebtPayoffCalculator;
