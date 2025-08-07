/**
 * GoalSplittingWizard Component
 * Goal splitting functionality for creating sub-goals or alternative paths
 * Epic 8, Story 3: Goal Adjustment & Impact Analysis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  FinancialGoal,
  FIREGoalMetadata,
  FIREGoalType,
  CreateFIREGoalDto,
} from '@drishti/shared/types/financial';
import { Button, Input, Card, Icon } from '../ui';
import { HapticService } from '../../services/HapticService';

interface GoalSplittingWizardProps {
  visible: boolean;
  originalGoal: FinancialGoal;
  onClose: () => void;
  onSplitComplete: (
    newGoals: FinancialGoal[],
    splitStrategy: SplitStrategy
  ) => void;
}

export type SplitStrategy =
  | 'time_based'
  | 'amount_based'
  | 'purpose_based'
  | 'risk_based'
  | 'geographic_based';

export interface SplitConfiguration {
  strategy: SplitStrategy;
  numberOfGoals: number;
  goals: Array<{
    name: string;
    description: string;
    targetAmount: number;
    targetDate?: string;
    fireType: FIREGoalType;
    priority: number;
    allocation: number; // percentage of original goal
  }>;
  reasoning: string;
}

const SPLIT_STRATEGIES = [
  {
    type: 'time_based' as SplitStrategy,
    title: 'Time-Based Split',
    description: 'Split into short-term and long-term goals',
    icon: 'clock',
    example: 'Coast FIRE by 40, Full FIRE by 55',
    benefits: ['Clear milestones', 'Reduced pressure', 'Flexible timeline'],
  },
  {
    type: 'amount_based' as SplitStrategy,
    title: 'Amount-Based Split',
    description: 'Split into different financial levels',
    icon: 'dollar-sign',
    example: 'Lean FIRE $500K, Fat FIRE $2M',
    benefits: [
      'Multiple safety nets',
      'Progressive achievement',
      'Risk management',
    ],
  },
  {
    type: 'purpose_based' as SplitStrategy,
    title: 'Purpose-Based Split',
    description: 'Split by different life purposes',
    icon: 'target',
    example: 'Travel fund, Basic living, Healthcare',
    benefits: ['Clear purpose', 'Easier tracking', 'Motivation clarity'],
  },
  {
    type: 'risk_based' as SplitStrategy,
    title: 'Risk-Based Split',
    description: 'Split by investment risk levels',
    icon: 'shield',
    example: 'Conservative base, Growth portion',
    benefits: ['Risk diversification', 'Stable foundation', 'Growth potential'],
  },
  {
    type: 'geographic_based' as SplitStrategy,
    title: 'Geographic Split',
    description: 'Split for different locations',
    icon: 'map-pin',
    example: 'Home country, International options',
    benefits: [
      'Location flexibility',
      'Currency diversification',
      'Lifestyle options',
    ],
  },
];

export const GoalSplittingWizard: React.FC<GoalSplittingWizardProps> = ({
  visible,
  originalGoal,
  onClose,
  onSplitComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStrategy, setSelectedStrategy] =
    useState<SplitStrategy | null>(null);
  const [splitConfig, setSplitConfig] = useState<SplitConfiguration>({
    strategy: 'time_based',
    numberOfGoals: 2,
    goals: [],
    reasoning: '',
  });

  const hapticService = HapticService.getInstance();

  const steps = ['Choose Strategy', 'Configure Split', 'Review & Create'];

  const handleNext = async () => {
    await hapticService.impact('light');

    if (currentStep < steps.length - 1) {
      if (currentStep === 0 && selectedStrategy) {
        initializeSplitConfig(selectedStrategy);
      }
      setCurrentStep(currentStep + 1);
    } else {
      await handleCreateSplit();
    }
  };

  const handleBack = async () => {
    await hapticService.impact('light');

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedStrategy(null);
    setSplitConfig({
      strategy: 'time_based',
      numberOfGoals: 2,
      goals: [],
      reasoning: '',
    });
    onClose();
  };

  const initializeSplitConfig = (strategy: SplitStrategy) => {
    const originalMetadata = originalGoal.metadata as FIREGoalMetadata;
    const baseConfig = getDefaultSplitConfig(strategy, originalGoal);

    setSplitConfig({
      ...baseConfig,
      strategy,
    });
  };

  const getDefaultSplitConfig = (
    strategy: SplitStrategy,
    goal: FinancialGoal
  ): Omit<SplitConfiguration, 'strategy'> => {
    const metadata = goal.metadata as FIREGoalMetadata;

    switch (strategy) {
      case 'time_based':
        return {
          numberOfGoals: 2,
          goals: [
            {
              name: 'Coast FIRE Goal',
              description:
                'Achieve Coast FIRE - enough invested to grow to full FIRE',
              targetAmount: goal.target_amount * 0.4,
              targetDate: new Date(
                Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
              fireType: 'fire_coast',
              priority: 1,
              allocation: 40,
            },
            {
              name: 'Full FIRE Goal',
              description: 'Complete financial independence',
              targetAmount: goal.target_amount,
              targetDate: goal.target_date,
              fireType: metadata.fireType,
              priority: 2,
              allocation: 60,
            },
          ],
          reasoning:
            'Split into achievable milestones with Coast FIRE as intermediate goal',
        };

      case 'amount_based':
        return {
          numberOfGoals: 2,
          goals: [
            {
              name: 'Lean FIRE Goal',
              description: 'Minimal financial independence',
              targetAmount: goal.target_amount * 0.6,
              targetDate: new Date(
                Date.now() + 12 * 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
              fireType: 'fire_lean',
              priority: 1,
              allocation: 60,
            },
            {
              name: 'Fat FIRE Goal',
              description: 'Comfortable financial independence',
              targetAmount: goal.target_amount * 1.5,
              targetDate: goal.target_date,
              fireType: 'fire_fat',
              priority: 2,
              allocation: 40,
            },
          ],
          reasoning:
            'Create safety net with Lean FIRE and stretch goal with Fat FIRE',
        };

      case 'purpose_based':
        return {
          numberOfGoals: 3,
          goals: [
            {
              name: 'Basic Living Fund',
              description: 'Essential expenses coverage',
              targetAmount: goal.target_amount * 0.5,
              fireType: 'fire_lean',
              priority: 1,
              allocation: 50,
            },
            {
              name: 'Healthcare & Security',
              description: 'Healthcare and emergency coverage',
              targetAmount: goal.target_amount * 0.3,
              fireType: 'fire_traditional',
              priority: 2,
              allocation: 30,
            },
            {
              name: 'Lifestyle & Travel',
              description: 'Discretionary spending and experiences',
              targetAmount: goal.target_amount * 0.2,
              fireType: 'fire_fat',
              priority: 3,
              allocation: 20,
            },
          ],
          reasoning:
            'Organize by life priorities with clear purpose for each fund',
        };

      default:
        return {
          numberOfGoals: 2,
          goals: [],
          reasoning: '',
        };
    }
  };

  const handleCreateSplit = async () => {
    try {
      await hapticService.success();

      // Create new goals based on split configuration
      const newGoals: FinancialGoal[] = splitConfig.goals.map(
        (goalConfig, index) => ({
          id: `${originalGoal.id}_split_${index + 1}`,
          user_id: originalGoal.user_id,
          name: goalConfig.name,
          goal_type: goalConfig.fireType,
          target_amount: goalConfig.targetAmount,
          current_amount: 0,
          target_date: goalConfig.targetDate,
          priority: goalConfig.priority,
          description: goalConfig.description,
          is_active: true,
          metadata: {
            ...originalGoal.metadata,
            fireType: goalConfig.fireType,
            originalGoalId: originalGoal.id,
            splitStrategy: splitConfig.strategy,
            splitAllocation: goalConfig.allocation,
            splitReasoning: splitConfig.reasoning,
            splitDate: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      );

      onSplitComplete(newGoals, splitConfig.strategy);
      handleClose();
    } catch (error) {
      await hapticService.error();
      Alert.alert('Error', 'Failed to split goal. Please try again.');
    }
  };

  const updateGoalConfig = (
    index: number,
    updates: Partial<SplitConfiguration['goals'][0]>
  ) => {
    setSplitConfig(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) =>
        i === index ? { ...goal, ...updates } : goal
      ),
    }));
  };

  const renderStrategySelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Split Strategy</Text>
      <Text style={styles.stepDescription}>
        How would you like to split your FIRE goal?
      </Text>

      <ScrollView
        style={styles.strategyList}
        showsVerticalScrollIndicator={false}
      >
        {SPLIT_STRATEGIES.map(strategy => (
          <TouchableOpacity
            key={strategy.type}
            style={[
              styles.strategyCard,
              selectedStrategy === strategy.type && styles.selectedStrategyCard,
            ]}
            onPress={() => setSelectedStrategy(strategy.type)}
          >
            <View style={styles.strategyHeader}>
              <Icon name={strategy.icon} size={24} color='#007AFF' />
              <View style={styles.strategyInfo}>
                <Text style={styles.strategyTitle}>{strategy.title}</Text>
                <Text style={styles.strategyDescription}>
                  {strategy.description}
                </Text>
              </View>
            </View>

            <Text style={styles.strategyExample}>
              Example: {strategy.example}
            </Text>

            <View style={styles.benefitsList}>
              {strategy.benefits.map((benefit, index) => (
                <Text key={index} style={styles.benefit}>
                  • {benefit}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSplitConfiguration = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Configure Split</Text>
      <Text style={styles.stepDescription}>
        Customize the details for each goal in your split:
      </Text>

      <ScrollView
        style={styles.configContainer}
        showsVerticalScrollIndicator={false}
      >
        {splitConfig.goals.map((goal, index) => (
          <Card key={index} style={styles.goalConfigCard}>
            <Text style={styles.goalConfigTitle}>Goal {index + 1}</Text>

            <Input
              label='Goal Name'
              value={goal.name}
              onChangeText={value => updateGoalConfig(index, { name: value })}
              style={styles.input}
            />

            <Input
              label='Description'
              value={goal.description}
              onChangeText={value =>
                updateGoalConfig(index, { description: value })
              }
              multiline
              numberOfLines={2}
              style={styles.input}
            />

            <Input
              label='Target Amount'
              value={goal.targetAmount.toString()}
              onChangeText={value =>
                updateGoalConfig(index, {
                  targetAmount: parseFloat(value) || 0,
                })
              }
              keyboardType='numeric'
              style={styles.input}
            />

            <View style={styles.allocationContainer}>
              <Text style={styles.allocationLabel}>
                Allocation: {goal.allocation}% of original goal
              </Text>
            </View>
          </Card>
        ))}

        <Input
          label='Reasoning for Split'
          value={splitConfig.reasoning}
          onChangeText={value =>
            setSplitConfig(prev => ({ ...prev, reasoning: value }))
          }
          multiline
          numberOfLines={3}
          style={styles.input}
        />
      </ScrollView>
    </View>
  );

  const renderReviewAndCreate = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Split</Text>
      <Text style={styles.stepDescription}>
        Review your goal split before creating the new goals:
      </Text>

      <ScrollView
        style={styles.reviewContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Split Summary</Text>
          <Text style={styles.summaryItem}>
            Strategy:{' '}
            {SPLIT_STRATEGIES.find(s => s.type === splitConfig.strategy)?.title}
          </Text>
          <Text style={styles.summaryItem}>
            Number of Goals: {splitConfig.goals.length}
          </Text>
          <Text style={styles.summaryItem}>
            Original Goal: ${originalGoal.target_amount.toLocaleString()}
          </Text>
        </Card>

        {splitConfig.goals.map((goal, index) => (
          <Card key={index} style={styles.goalSummaryCard}>
            <Text style={styles.goalSummaryTitle}>{goal.name}</Text>
            <Text style={styles.goalSummaryAmount}>
              ${goal.targetAmount.toLocaleString()} ({goal.allocation}%)
            </Text>
            <Text style={styles.goalSummaryDescription}>
              {goal.description}
            </Text>
          </Card>
        ))}

        {splitConfig.reasoning && (
          <Card style={styles.reasoningCard}>
            <Text style={styles.reasoningTitle}>Reasoning</Text>
            <Text style={styles.reasoningText}>{splitConfig.reasoning}</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!selectedStrategy;
      case 1:
        return splitConfig.goals.every(
          goal => goal.name && goal.targetAmount > 0
        );
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name='x' size={24} color='#007AFF' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Split Goal</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / steps.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 0 && renderStrategySelection()}
          {currentStep === 1 && renderSplitConfiguration()}
          {currentStep === 2 && renderReviewAndCreate()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={currentStep === 0 ? 'Cancel' : 'Back'}
            variant='outline'
            onPress={handleBack}
            style={styles.backButton}
          />
          <Button
            title={
              currentStep === steps.length - 1 ? 'Create Split Goals' : 'Next'
            }
            onPress={handleNext}
            disabled={!isStepValid()}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 22,
    marginBottom: 24,
  },
  strategyList: {
    flex: 1,
  },
  strategyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStrategyCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  strategyExample: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 4,
  },
  benefit: {
    fontSize: 12,
    color: '#28A745',
  },
  configContainer: {
    flex: 1,
  },
  goalConfigCard: {
    padding: 16,
    marginBottom: 16,
  },
  goalConfigTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  allocationContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  allocationLabel: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  reviewContainer: {
    flex: 1,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  goalSummaryCard: {
    padding: 16,
    marginBottom: 12,
  },
  goalSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  goalSummaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  goalSummaryDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  reasoningCard: {
    padding: 16,
  },
  reasoningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

export default GoalSplittingWizard;
