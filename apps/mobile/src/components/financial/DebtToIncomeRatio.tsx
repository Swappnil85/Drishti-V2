/**
 * DebtToIncomeRatio Component
 * Debt-to-income ratio tracking with benchmark comparisons
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
import { debtService, DebtToIncomeRatio as DTIRatio } from '../../services/financial/DebtService';
import { useFormHaptic } from '../../hooks/useHaptic';

interface DebtToIncomeRatioProps {
  onImprovementTipsPress?: () => void;
}

const DebtToIncomeRatio: React.FC<DebtToIncomeRatioProps> = ({
  onImprovementTipsPress,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [dtiRatio, setDtiRatio] = useState<DTIRatio | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateRatio = async () => {
    if (!user?.id || !monthlyIncome) return;

    try {
      setLoading(true);
      const income = parseFloat(monthlyIncome) || 0;
      const ratio = await debtService.calculateDebtToIncomeRatio(user.id, income);
      setDtiRatio(ratio);
      setHasCalculated(true);
    } catch (error) {
      console.error('Error calculating debt-to-income ratio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeChange = (value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setMonthlyIncome(numericValue);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getRatingColor = (category: DTIRatio['ratingCategory']) => {
    switch (category) {
      case 'excellent': return theme.colors.success;
      case 'good': return '#8BC34A';
      case 'fair': return theme.colors.warning;
      case 'poor': return '#FF9800';
      case 'dangerous': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getRatingIcon = (category: DTIRatio['ratingCategory']) => {
    switch (category) {
      case 'excellent': return 'checkmark-circle';
      case 'good': return 'thumbs-up';
      case 'fair': return 'warning';
      case 'poor': return 'alert-circle';
      case 'dangerous': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getRatingLabel = (category: DTIRatio['ratingCategory']) => {
    switch (category) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      case 'dangerous': return 'Dangerous';
      default: return 'Unknown';
    }
  };

  const renderIncomeInput = () => {
    return (
      <Card variant="outlined" padding="lg" style={styles.inputCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Monthly Income
        </Text>
        <Text style={[styles.inputDescription, { color: theme.colors.textSecondary }]}>
          Enter your gross monthly income to calculate your debt-to-income ratio
        </Text>
        
        <Input
          value={monthlyIncome}
          onChangeText={handleIncomeChange}
          placeholder="5000"
          keyboardType="numeric"
          leftIcon={<Text style={styles.dollarSign}>$</Text>}
          style={styles.incomeInput}
        />

        <Button
          variant="filled"
          onPress={calculateRatio}
          disabled={!monthlyIncome || loading}
          style={styles.calculateButton}
        >
          {loading ? 'Calculating...' : 'Calculate Ratio'}
        </Button>
      </Card>
    );
  };

  const renderRatioResult = () => {
    if (!dtiRatio || !hasCalculated) return null;

    const ratingColor = getRatingColor(dtiRatio.ratingCategory);
    const ratingIcon = getRatingIcon(dtiRatio.ratingCategory);
    const ratingLabel = getRatingLabel(dtiRatio.ratingCategory);

    return (
      <Card variant="filled" padding="lg" style={styles.resultCard}>
        <Flex direction="column" align="center" gap="sm">
          <Text style={[styles.resultTitle, { color: theme.colors.onPrimary }]}>
            Your Debt-to-Income Ratio
          </Text>
          
          <Text style={[styles.ratioValue, { color: ratingColor }]}>
            {formatPercentage(dtiRatio.ratio)}
          </Text>

          <Flex direction="row" align="center" gap="xs">
            <Icon name={ratingIcon} size="sm" color={ratingColor} />
            <Text style={[styles.ratingLabel, { color: ratingColor }]}>
              {ratingLabel}
            </Text>
          </Flex>

          <View style={styles.ratioBreakdown}>
            <Flex direction="row" justify="space-between" style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.onPrimary }]}>
                Monthly Debt Payments:
              </Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.onPrimary }]}>
                {formatCurrency(dtiRatio.monthlyDebtPayments)}
              </Text>
            </Flex>

            <Flex direction="row" justify="space-between" style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.colors.onPrimary }]}>
                Monthly Income:
              </Text>
              <Text style={[styles.breakdownValue, { color: theme.colors.onPrimary }]}>
                {formatCurrency(dtiRatio.monthlyIncome)}
              </Text>
            </Flex>
          </View>
        </Flex>
      </Card>
    );
  };

  const renderBenchmarks = () => {
    if (!dtiRatio || !hasCalculated) return null;

    return (
      <Card variant="outlined" padding="lg" style={styles.benchmarksCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Industry Benchmarks
        </Text>
        <Text style={[styles.benchmarkDescription, { color: theme.colors.textSecondary }]}>
          How your ratio compares to financial industry standards
        </Text>

        <View style={styles.benchmarksList}>
          {Object.entries(dtiRatio.benchmark).map(([category, threshold]) => {
            const isCurrentCategory = category === dtiRatio.ratingCategory;
            const categoryColor = getRatingColor(category as DTIRatio['ratingCategory']);
            const categoryIcon = getRatingIcon(category as DTIRatio['ratingCategory']);
            
            return (
              <View key={category} style={[
                styles.benchmarkItem,
                isCurrentCategory && { backgroundColor: 'rgba(33, 150, 243, 0.1)' }
              ]}>
                <Flex direction="row" align="center" gap="sm">
                  <Icon name={categoryIcon} size="sm" color={categoryColor} />
                  <View style={styles.benchmarkInfo}>
                    <Text style={[styles.benchmarkCategory, { color: theme.colors.text }]}>
                      {getRatingLabel(category as DTIRatio['ratingCategory'])}
                    </Text>
                    <Text style={[styles.benchmarkThreshold, { color: theme.colors.textSecondary }]}>
                      {category === 'excellent' ? '≤' : category === 'good' ? '≤' : category === 'fair' ? '≤' : '≤'}{threshold}%
                    </Text>
                  </View>
                  {isCurrentCategory && (
                    <Badge variant="filled" color="primary" size="sm">
                      Your Range
                    </Badge>
                  )}
                </Flex>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  const renderRecommendation = () => {
    if (!dtiRatio || !hasCalculated) return null;

    return (
      <Card variant="outlined" padding="lg" style={styles.recommendationCard}>
        <Flex direction="row" align="center" gap="sm" style={styles.recommendationHeader}>
          <Icon name="lightbulb-outline" size="md" color="primary" />
          <Text style={[styles.recommendationTitle, { color: theme.colors.text }]}>
            Recommendation
          </Text>
        </Flex>

        <Text style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>
          {dtiRatio.recommendation}
        </Text>
      </Card>
    );
  };

  const renderImprovementTips = () => {
    if (!dtiRatio || !hasCalculated || dtiRatio.ratingCategory === 'excellent') return null;

    const tips = [
      'Pay down high-interest debt first',
      'Consider debt consolidation',
      'Increase your income through side work',
      'Avoid taking on new debt',
      'Create a strict budget and stick to it',
    ];

    return (
      <Card variant="outlined" padding="lg" style={styles.tipsCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Improvement Tips
        </Text>

        {tips.slice(0, 3).map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Flex direction="row" align="center" gap="sm">
              <Icon name="checkmark-circle-outline" size="sm" color="success" />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                {tip}
              </Text>
            </Flex>
          </View>
        ))}

        <Button
          variant="outline"
          onPress={onImprovementTipsPress}
          leftIcon={<Icon name="book-outline" size="sm" />}
          style={styles.tipsButton}
        >
          View All Tips
        </Button>
      </Card>
    );
  };

  const renderActionButtons = () => {
    if (!dtiRatio || !hasCalculated) return null;

    return (
      <Card variant="outlined" padding="lg" style={styles.actionsCard}>
        <Flex direction="row" gap="sm">
          <Button
            variant="outline"
            onPress={() => {
              // Navigate to debt payoff calculator
              console.log('Navigate to debt payoff calculator');
            }}
            leftIcon={<Icon name="calculator-outline" size="sm" />}
            style={styles.actionButton}
          >
            Payoff Plan
          </Button>
          
          <Button
            variant="outline"
            onPress={() => {
              // Share or export ratio
              console.log('Share DTI ratio');
            }}
            leftIcon={<Icon name="share-outline" size="sm" />}
            style={styles.actionButton}
          >
            Share Result
          </Button>
        </Flex>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderIncomeInput()}
      {renderRatioResult()}
      {renderBenchmarks()}
      {renderRecommendation()}
      {renderImprovementTips()}
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
  incomeInput: {
    fontSize: 18,
    marginBottom: 16,
  },
  calculateButton: {
    // Calculate button styles
  },
  resultCard: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratioValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  ratioBreakdown: {
    width: '100%',
    marginTop: 16,
  },
  breakdownRow: {
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  benchmarksCard: {
    marginBottom: 16,
  },
  benchmarkDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  benchmarksList: {
    // Benchmarks list styles
  },
  benchmarkItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  benchmarkInfo: {
    flex: 1,
  },
  benchmarkCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  benchmarkThreshold: {
    fontSize: 12,
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
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipItem: {
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  tipsButton: {
    marginTop: 12,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
});

export default DebtToIncomeRatio;
