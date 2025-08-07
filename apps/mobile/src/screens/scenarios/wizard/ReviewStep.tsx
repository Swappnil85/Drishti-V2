/**
 * ReviewStep Component
 * Epic 9, Story 1: Review step in scenario creation wizard
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, Card } from '../../../components/ui';
import { useHaptic } from '../../../hooks/useHaptic';
import { ScenarioWizardData } from '../CreateScenarioScreen';
import { ScenarioAssumptions } from '@drishti/shared/types/financial';

interface ReviewStepProps {
  data: ScenarioWizardData;
  onUpdate: (updates: Partial<ScenarioWizardData>) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data, onUpdate }) => {
  const { buttonTap } = useHaptic();

  // Get current assumptions with defaults
  const assumptions: ScenarioAssumptions = {
    inflation_rate: 0.03,
    market_return: 0.07,
    savings_rate: 0.20,
    retirement_age: 65,
    life_expectancy: 87,
    emergency_fund_months: 6,
    healthcare_inflation: 0.06,
    tax_rate: 0.25,
    ...data.selectedTemplate?.assumptions,
    ...data.assumptions,
  };

  /**
   * Format percentage for display
   */
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  /**
   * Format years for display
   */
  const formatYears = (value: number): string => {
    return `${Math.round(value)} years`;
  };

  /**
   * Format months for display
   */
  const formatMonths = (value: number): string => {
    return `${Math.round(value)} months`;
  };

  /**
   * Calculate basic projections for preview
   */
  const calculateBasicProjections = () => {
    const currentAge = 30; // Assumed current age
    const yearsToRetirement = assumptions.retirement_age - currentAge;
    const retirementYears = assumptions.life_expectancy - assumptions.retirement_age;
    const realReturn = assumptions.market_return - assumptions.inflation_rate;
    
    // Simple FIRE number calculation (25x annual expenses)
    const fireNumber = 25 * 50000; // Assuming $50k annual expenses
    
    // Required monthly savings
    const monthlyReturn = assumptions.market_return / 12;
    const totalMonths = yearsToRetirement * 12;
    const requiredMonthlySavings = fireNumber * monthlyReturn / 
      (Math.pow(1 + monthlyReturn, totalMonths) - 1);

    return {
      yearsToRetirement,
      retirementYears,
      realReturn,
      fireNumber,
      requiredMonthlySavings,
    };
  };

  const projections = calculateBasicProjections();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="h5" style={styles.title}>
          Review & Create
        </Text>
        <Text variant="body1" color="text.secondary" style={styles.subtitle}>
          Review your scenario details before creating
        </Text>
      </View>

      {/* Scenario Overview */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Scenario Overview
        </Text>
        <View style={styles.overview}>
          <View style={styles.overviewHeader}>
            <View style={[styles.overviewIcon, { backgroundColor: data.color }]}>
              <Text style={styles.overviewEmoji}>{data.emoji}</Text>
            </View>
            <View style={styles.overviewInfo}>
              <Text variant="h6" style={styles.overviewName}>
                {data.name}
              </Text>
              <Text variant="caption" color="text.secondary">
                {data.selectedTemplate?.name || 'Custom Scenario'}
              </Text>
            </View>
          </View>
          
          {data.description && (
            <Text variant="body2" color="text.secondary" style={styles.overviewDescription}>
              {data.description}
            </Text>
          )}

          <View style={styles.overviewMeta}>
            {data.folder && (
              <View style={styles.metaItem}>
                <Text variant="caption" color="text.secondary">
                  📁 {data.folder}
                </Text>
              </View>
            )}
            {data.tags && data.tags.length > 0 && (
              <View style={styles.overviewTags}>
                {data.tags.map((tag, index) => (
                  <View key={index} style={styles.overviewTag}>
                    <Text variant="caption" style={styles.overviewTagText}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Card>

      {/* Key Assumptions */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Key Assumptions
        </Text>
        <View style={styles.assumptions}>
          <View style={styles.assumptionRow}>
            <Text variant="body2" color="text.secondary">
              Market Return
            </Text>
            <Text variant="body2" style={styles.assumptionValue}>
              {formatPercentage(assumptions.market_return)}
            </Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text variant="body2" color="text.secondary">
              Inflation Rate
            </Text>
            <Text variant="body2" style={styles.assumptionValue}>
              {formatPercentage(assumptions.inflation_rate)}
            </Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text variant="body2" color="text.secondary">
              Savings Rate
            </Text>
            <Text variant="body2" style={styles.assumptionValue}>
              {formatPercentage(assumptions.savings_rate)}
            </Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text variant="body2" color="text.secondary">
              Retirement Age
            </Text>
            <Text variant="body2" style={styles.assumptionValue}>
              {formatYears(assumptions.retirement_age)}
            </Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text variant="body2" color="text.secondary">
              Life Expectancy
            </Text>
            <Text variant="body2" style={styles.assumptionValue}>
              {formatYears(assumptions.life_expectancy)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Quick Projections Preview */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Quick Preview
        </Text>
        <View style={styles.projections}>
          <View style={styles.projectionCard}>
            <Text variant="h4" style={styles.projectionValue}>
              {formatYears(projections.yearsToRetirement)}
            </Text>
            <Text variant="caption" color="text.secondary" style={styles.projectionLabel}>
              Years to Retirement
            </Text>
          </View>
          <View style={styles.projectionCard}>
            <Text variant="h4" style={styles.projectionValue}>
              {formatPercentage(projections.realReturn)}
            </Text>
            <Text variant="caption" color="text.secondary" style={styles.projectionLabel}>
              Real Return
            </Text>
          </View>
          <View style={styles.projectionCard}>
            <Text variant="h4" style={styles.projectionValue}>
              ${Math.round(projections.requiredMonthlySavings).toLocaleString()}
            </Text>
            <Text variant="caption" color="text.secondary" style={styles.projectionLabel}>
              Monthly Savings Needed
            </Text>
          </View>
        </View>
        <Text variant="caption" color="text.secondary" style={styles.projectionNote}>
          * These are rough estimates. Detailed projections will be calculated after creation.
        </Text>
      </Card>

      {/* Validation Summary */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Validation Summary
        </Text>
        <View style={styles.validation}>
          <View style={styles.validationItem}>
            <Text style={styles.validationIcon}>✅</Text>
            <Text variant="body2" style={styles.validationText}>
              Scenario name provided
            </Text>
          </View>
          <View style={styles.validationItem}>
            <Text style={styles.validationIcon}>✅</Text>
            <Text variant="body2" style={styles.validationText}>
              Template selected
            </Text>
          </View>
          <View style={styles.validationItem}>
            <Text style={styles.validationIcon}>✅</Text>
            <Text variant="body2" style={styles.validationText}>
              Assumptions configured
            </Text>
          </View>
          
          {/* Warnings */}
          {assumptions.market_return > 0.12 && (
            <View style={styles.validationItem}>
              <Text style={styles.validationIcon}>⚠️</Text>
              <Text variant="body2" style={styles.warningText}>
                High market return assumption
              </Text>
            </View>
          )}
          {assumptions.savings_rate > 0.50 && (
            <View style={styles.validationItem}>
              <Text style={styles.validationIcon}>⚠️</Text>
              <Text variant="body2" style={styles.warningText}>
                Very high savings rate
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Next Steps */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          What's Next?
        </Text>
        <View style={styles.nextSteps}>
          <View style={styles.nextStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text variant="body2" style={styles.stepText}>
              Your scenario will be created and saved
            </Text>
          </View>
          <View style={styles.nextStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text variant="body2" style={styles.stepText}>
              Detailed projections will be calculated
            </Text>
          </View>
          <View style={styles.nextStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text variant="body2" style={styles.stepText}>
              You can view charts and compare with other scenarios
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 20,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  overview: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  overviewEmoji: {
    fontSize: 24,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewName: {
    marginBottom: 2,
  },
  overviewDescription: {
    marginBottom: 12,
    lineHeight: 18,
  },
  overviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    marginRight: 12,
  },
  overviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  overviewTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overviewTagText: {
    color: '#1976D2',
    fontSize: 10,
    fontWeight: '500',
  },
  assumptions: {
    gap: 12,
  },
  assumptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  assumptionValue: {
    fontWeight: '600',
    color: '#2196F3',
  },
  projections: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  projectionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  projectionValue: {
    color: '#2196F3',
    marginBottom: 4,
  },
  projectionLabel: {
    textAlign: 'center',
    lineHeight: 14,
  },
  projectionNote: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  validation: {
    gap: 12,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validationIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  validationText: {
    flex: 1,
  },
  warningText: {
    flex: 1,
    color: '#E65100',
  },
  nextSteps: {
    gap: 12,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    lineHeight: 18,
  },
});

export default ReviewStep;
