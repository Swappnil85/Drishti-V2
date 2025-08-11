/**
 * TaxImpactCalculator Component
 * Calculator for early withdrawal tax impact scenarios
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Flex, Button, Icon, Badge } from '../ui';
import { taxTreatmentService, type TaxImpactCalculation } from '../../services/financial/TaxTreatmentService';
import type { TaxTreatment } from '@drishti/shared/types/financial';

interface TaxImpactCalculatorProps {
  accountBalance: number;
  taxTreatment: TaxTreatment;
  userAge: number;
  onCalculationComplete?: (calculation: TaxImpactCalculation) => void;
}

const TaxImpactCalculator: React.FC<TaxImpactCalculatorProps> = ({
  accountBalance,
  taxTreatment,
  userAge,
  onCalculationComplete,
}) => {
  const { theme } = useTheme();
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [taxBracket, setTaxBracket] = useState('22');
  const [calculation, setCalculation] = useState<TaxImpactCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const taxBrackets = [
    { rate: 10, range: '$0 - $11,000' },
    { rate: 12, range: '$11,001 - $44,725' },
    { rate: 22, range: '$44,726 - $95,375' },
    { rate: 24, range: '$95,376 - $182,050' },
    { rate: 32, range: '$182,051 - $231,250' },
    { rate: 35, range: '$231,251 - $578,125' },
    { rate: 37, range: '$578,126+' },
  ];

  useEffect(() => {
    if (withdrawalAmount && !isNaN(parseFloat(withdrawalAmount))) {
      calculateTaxImpact();
    } else {
      setCalculation(null);
    }
  }, [withdrawalAmount, taxBracket, accountBalance, taxTreatment, userAge]);

  const calculateTaxImpact = () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setCalculation(null);
      return;
    }

    if (amount > accountBalance) {
      Alert.alert(
        'Invalid Amount',
        'Withdrawal amount cannot exceed account balance'
      );
      return;
    }

    setIsCalculating(true);

    const result = taxTreatmentService.calculateTaxImpact(
      amount,
      userAge,
      accountBalance,
      taxTreatment,
      parseFloat(taxBracket) / 100
    );

    setCalculation(result);
    onCalculationComplete?.(result);
    setIsCalculating(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate}%`;
  };

  const handleWithdrawalAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setWithdrawalAmount(cleanValue);
  };

  const renderTaxBracketSelector = () => (
    <View style={styles.taxBracketContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Your Tax Bracket
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bracketScroll}>
        {taxBrackets.map((bracket) => (
          <Button
            key={bracket.rate}
            variant={taxBracket === bracket.rate.toString() ? 'filled' : 'outline'}
            size="sm"
            onPress={() => setTaxBracket(bracket.rate.toString())}
            style={styles.bracketButton}
          >
            {formatPercentage(bracket.rate)}
          </Button>
        ))}
      </ScrollView>
      <Text style={[styles.bracketRange, { color: theme.colors.textSecondary }]}>
        {taxBrackets.find(b => b.rate.toString() === taxBracket)?.range}
      </Text>
    </View>
  );

  const renderCalculationResults = () => {
    if (!calculation) return null;

    const treatmentInfo = taxTreatmentService.getTaxTreatmentInfo(taxTreatment);
    const isEarlyWithdrawal = userAge < 59.5;

    return (
      <Card variant="outlined" padding="lg" style={styles.resultsCard}>
        <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
          Tax Impact Summary
        </Text>

        <View style={styles.resultItem}>
          <Flex direction="row" justify="space-between" align="center">
            <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
              Withdrawal Amount
            </Text>
            <Text style={[styles.resultValue, { color: theme.colors.text }]}>
              {formatCurrency(calculation.withdrawalAmount)}
            </Text>
          </Flex>
        </View>

        {calculation.estimatedTaxes > 0 && (
          <View style={styles.resultItem}>
            <Flex direction="row" justify="space-between" align="center">
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
                Income Taxes ({formatPercentage(parseFloat(taxBracket))})
              </Text>
              <Text style={[styles.resultValue, { color: theme.colors.error }]}>
                -{formatCurrency(calculation.estimatedTaxes)}
              </Text>
            </Flex>
          </View>
        )}

        {calculation.earlyWithdrawalPenalty > 0 && (
          <View style={styles.resultItem}>
            <Flex direction="row" justify="space-between" align="center">
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
                Early Withdrawal Penalty ({formatPercentage(treatmentInfo.earlyWithdrawalPenalty)})
              </Text>
              <Text style={[styles.resultValue, { color: theme.colors.error }]}>
                -{formatCurrency(calculation.earlyWithdrawalPenalty)}
              </Text>
            </Flex>
          </View>
        )}

        <View style={[styles.resultItem, styles.totalItem]}>
          <Flex direction="row" justify="space-between" align="center">
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
              Net Amount Received
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.success }]}>
              {formatCurrency(calculation.netAmount)}
            </Text>
          </Flex>
        </View>

        {isEarlyWithdrawal && (
          <Badge
            variant="filled"
            color="warning"
            size="sm"
            style={styles.warningBadge}
          >
            <Icon name="warning" size="xs" color="white" />
            <Text style={styles.warningText}>Early Withdrawal</Text>
          </Badge>
        )}

        {calculation.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={[styles.recommendationsTitle, { color: theme.colors.text }]}>
              Recommendations
            </Text>
            {calculation.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Icon name="bulb-outline" size="sm" color="info" />
                <Text style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>
                  {recommendation}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card variant="outlined" padding="lg" style={styles.inputCard}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Early Withdrawal Calculator
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Calculate the tax impact of withdrawing from your {treatmentInfo.name}
        </Text>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Withdrawal Amount
          </Text>
          <TextInput
            style={[
              styles.amountInput,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={withdrawalAmount}
            onChangeText={handleWithdrawalAmountChange}
            placeholder="Enter amount..."
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Text style={[styles.balanceInfo, { color: theme.colors.textSecondary }]}>
            Account Balance: {formatCurrency(accountBalance)}
          </Text>
        </View>

        {renderTaxBracketSelector()}

        <View style={styles.accountInfo}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
            Account Type
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {treatmentInfo.name}
          </Text>
          
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
            Your Age
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {userAge} years old
          </Text>
        </View>
      </Card>

      {renderCalculationResults()}
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  balanceInfo: {
    fontSize: 14,
    textAlign: 'center',
  },
  taxBracketContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  bracketScroll: {
    marginBottom: 8,
  },
  bracketButton: {
    marginRight: 8,
    minWidth: 60,
  },
  bracketRange: {
    fontSize: 12,
    textAlign: 'center',
  },
  accountInfo: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 8,
  },
  resultsCard: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  resultLabel: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalItem: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  warningBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TaxImpactCalculator;
