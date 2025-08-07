/**
 * GoalAdjustmentWizard Component
 * Guided goal adjustment wizard for major life changes
 * Epic 8, Story 3: Goal Adjustment & Impact Analysis
 */

import React, { useState, useEffect } from 'react';
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
  FIREGoalProgress,
} from '@drishti/shared/types/financial';
import { Button, Input, Card, Icon } from '../ui';
import { HapticService } from '../../services/HapticService';

interface GoalAdjustmentWizardProps {
  visible: boolean;
  goal: FinancialGoal;
  progress: FIREGoalProgress;
  onClose: () => void;
  onAdjustmentComplete: (
    adjustedGoal: FinancialGoal,
    adjustmentReason: string
  ) => void;
}

export type LifeEventType =
  | 'job_loss'
  | 'promotion'
  | 'marriage'
  | 'divorce'
  | 'child_birth'
  | 'inheritance'
  | 'major_expense'
  | 'health_issue'
  | 'career_change'
  | 'relocation'
  | 'custom';

export type AdjustmentType =
  | 'timeline'
  | 'target_amount'
  | 'monthly_contribution'
  | 'expenses'
  | 'suspension'
  | 'split_goal';

interface LifeEvent {
  type: LifeEventType;
  title: string;
  description: string;
  icon: string;
  suggestedAdjustments: AdjustmentType[];
  impactLevel: 'low' | 'medium' | 'high';
}

interface AdjustmentImpact {
  timelineChange: number; // months
  targetAmountChange: number; // dollars
  monthlyContributionChange: number; // dollars
  feasibilityChange: number; // percentage points
  confidenceChange: number; // percentage points
}

const LIFE_EVENTS: LifeEvent[] = [
  {
    type: 'job_loss',
    title: 'Job Loss',
    description: 'Lost employment or reduced income',
    icon: 'briefcase-off',
    suggestedAdjustments: ['suspension', 'timeline', 'monthly_contribution'],
    impactLevel: 'high',
  },
  {
    type: 'promotion',
    title: 'Promotion/Raise',
    description: 'Increased income or better position',
    icon: 'trending-up',
    suggestedAdjustments: ['monthly_contribution', 'timeline'],
    impactLevel: 'medium',
  },
  {
    type: 'marriage',
    title: 'Marriage/Partnership',
    description: 'Combined finances and shared goals',
    icon: 'heart',
    suggestedAdjustments: ['target_amount', 'expenses', 'split_goal'],
    impactLevel: 'high',
  },
  {
    type: 'child_birth',
    title: 'New Child',
    description: 'Increased expenses and changed priorities',
    icon: 'baby',
    suggestedAdjustments: ['expenses', 'timeline', 'target_amount'],
    impactLevel: 'high',
  },
  {
    type: 'inheritance',
    title: 'Inheritance/Windfall',
    description: 'Unexpected financial gain',
    icon: 'gift',
    suggestedAdjustments: ['timeline', 'target_amount'],
    impactLevel: 'medium',
  },
  {
    type: 'major_expense',
    title: 'Major Expense',
    description: 'Large unexpected cost (medical, home repair, etc.)',
    icon: 'alert-triangle',
    suggestedAdjustments: ['timeline', 'monthly_contribution'],
    impactLevel: 'medium',
  },
  {
    type: 'custom',
    title: 'Other Life Change',
    description: 'Custom adjustment for other circumstances',
    icon: 'edit',
    suggestedAdjustments: ['timeline', 'target_amount', 'monthly_contribution'],
    impactLevel: 'medium',
  },
];

export const GoalAdjustmentWizard: React.FC<GoalAdjustmentWizardProps> = ({
  visible,
  goal,
  progress,
  onClose,
  onAdjustmentComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLifeEvent, setSelectedLifeEvent] = useState<LifeEvent | null>(
    null
  );
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType | null>(
    null
  );
  const [adjustmentValues, setAdjustmentValues] = useState({
    newTargetAmount: goal.target_amount,
    newTargetDate: goal.target_date || '',
    newMonthlyExpenses:
      (goal.metadata as FIREGoalMetadata)?.monthlyExpenses || 0,
    newMonthlyContribution: 0,
    adjustmentReason: '',
    suspensionMonths: 0,
  });
  const [calculatedImpact, setCalculatedImpact] =
    useState<AdjustmentImpact | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const hapticService = HapticService.getInstance();

  const steps = [
    'Select Life Event',
    'Choose Adjustment',
    'Set New Values',
    'Review Impact',
    'Confirm Changes',
  ];

  useEffect(() => {
    if (currentStep === 3 && adjustmentType) {
      calculateImpact();
    }
  }, [currentStep, adjustmentType, adjustmentValues]);

  const handleNext = async () => {
    await hapticService.impact('light');

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleConfirmAdjustment();
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
    setSelectedLifeEvent(null);
    setAdjustmentType(null);
    setCalculatedImpact(null);
    onClose();
  };

  const calculateImpact = async () => {
    setIsCalculating(true);

    try {
      // Simulate impact calculation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const metadata = goal.metadata as FIREGoalMetadata;
      const currentMonthlyExpenses = metadata.monthlyExpenses || 0;
      const currentTargetAmount = goal.target_amount;

      let timelineChange = 0;
      let targetAmountChange =
        adjustmentValues.newTargetAmount - currentTargetAmount;
      let monthlyContributionChange = adjustmentValues.newMonthlyContribution;
      let feasibilityChange = 0;
      let confidenceChange = 0;

      // Calculate timeline impact based on adjustment type
      switch (adjustmentType) {
        case 'target_amount':
          timelineChange = targetAmountChange > 0 ? 12 : -6; // Rough estimate
          feasibilityChange = targetAmountChange > 0 ? -10 : 15;
          break;
        case 'monthly_contribution':
          timelineChange = monthlyContributionChange > 0 ? -6 : 12;
          feasibilityChange = monthlyContributionChange > 0 ? 20 : -15;
          break;
        case 'expenses':
          const expenseChange =
            adjustmentValues.newMonthlyExpenses - currentMonthlyExpenses;
          targetAmountChange = expenseChange * 12 * 25; // 4% rule
          timelineChange = expenseChange > 0 ? 8 : -4;
          feasibilityChange = expenseChange > 0 ? -8 : 12;
          break;
        case 'suspension':
          timelineChange = adjustmentValues.suspensionMonths;
          feasibilityChange = -5;
          confidenceChange = -10;
          break;
      }

      setCalculatedImpact({
        timelineChange,
        targetAmountChange,
        monthlyContributionChange,
        feasibilityChange,
        confidenceChange,
      });
    } catch (error) {
      console.error('Failed to calculate impact:', error);
      Alert.alert(
        'Error',
        'Failed to calculate adjustment impact. Please try again.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmAdjustment = async () => {
    try {
      await hapticService.success();

      const adjustedGoal: FinancialGoal = {
        ...goal,
        target_amount: adjustmentValues.newTargetAmount,
        target_date: adjustmentValues.newTargetDate || goal.target_date,
        metadata: {
          ...goal.metadata,
          monthlyExpenses: adjustmentValues.newMonthlyExpenses,
          adjustmentHistory: [
            ...((goal.metadata as FIREGoalMetadata).adjustmentHistory || []),
            {
              date: new Date().toISOString(),
              previousAmount: goal.target_amount,
              newAmount: adjustmentValues.newTargetAmount,
              reason:
                adjustmentValues.adjustmentReason ||
                selectedLifeEvent?.title ||
                'Manual adjustment',
              impact: {
                timelineChange: calculatedImpact?.timelineChange || 0,
                savingsRateChange: calculatedImpact?.feasibilityChange || 0,
              },
            },
          ],
        },
        updated_at: new Date().toISOString(),
      };

      onAdjustmentComplete(
        adjustedGoal,
        adjustmentValues.adjustmentReason ||
          selectedLifeEvent?.title ||
          'Manual adjustment'
      );

      handleClose();
    } catch (error) {
      await hapticService.error();
      Alert.alert(
        'Error',
        'Failed to save goal adjustments. Please try again.'
      );
    }
  };

  const renderLifeEventSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        What life event prompted this adjustment?
      </Text>
      <Text style={styles.stepDescription}>
        Select the event that best describes your situation for personalized
        guidance.
      </Text>

      <ScrollView style={styles.eventList} showsVerticalScrollIndicator={false}>
        {LIFE_EVENTS.map(event => (
          <TouchableOpacity
            key={event.type}
            style={[
              styles.eventCard,
              selectedLifeEvent?.type === event.type &&
                styles.selectedEventCard,
            ]}
            onPress={() => setSelectedLifeEvent(event)}
          >
            <View style={styles.eventHeader}>
              <Icon name={event.icon} size={24} color='#007AFF' />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
              <View
                style={[
                  styles.impactBadge,
                  styles[`impact${event.impactLevel}`],
                ]}
              >
                <Text style={styles.impactText}>{event.impactLevel}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAdjustmentTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What would you like to adjust?</Text>
      <Text style={styles.stepDescription}>
        Based on your situation, here are the recommended adjustments:
      </Text>

      <View style={styles.adjustmentOptions}>
        {selectedLifeEvent?.suggestedAdjustments.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.adjustmentCard,
              adjustmentType === type && styles.selectedAdjustmentCard,
            ]}
            onPress={() => setAdjustmentType(type)}
          >
            <Text style={styles.adjustmentTitle}>
              {getAdjustmentTitle(type)}
            </Text>
            <Text style={styles.adjustmentDescription}>
              {getAdjustmentDescription(type)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderValueAdjustment = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Set new values</Text>
      <Text style={styles.stepDescription}>
        Adjust the values based on your new circumstances:
      </Text>

      <ScrollView
        style={styles.inputContainer}
        showsVerticalScrollIndicator={false}
      >
        {adjustmentType === 'target_amount' && (
          <Input
            label='New Target Amount'
            value={adjustmentValues.newTargetAmount.toString()}
            onChangeText={value =>
              setAdjustmentValues(prev => ({
                ...prev,
                newTargetAmount: parseFloat(value) || 0,
              }))
            }
            keyboardType='numeric'
            style={styles.input}
          />
        )}

        {adjustmentType === 'timeline' && (
          <Input
            label='New Target Date'
            value={adjustmentValues.newTargetDate}
            onChangeText={value =>
              setAdjustmentValues(prev => ({
                ...prev,
                newTargetDate: value,
              }))
            }
            placeholder='YYYY-MM-DD'
            style={styles.input}
          />
        )}

        {adjustmentType === 'expenses' && (
          <Input
            label='New Monthly Expenses'
            value={adjustmentValues.newMonthlyExpenses.toString()}
            onChangeText={value =>
              setAdjustmentValues(prev => ({
                ...prev,
                newMonthlyExpenses: parseFloat(value) || 0,
              }))
            }
            keyboardType='numeric'
            style={styles.input}
          />
        )}

        {adjustmentType === 'monthly_contribution' && (
          <Input
            label='New Monthly Contribution'
            value={adjustmentValues.newMonthlyContribution.toString()}
            onChangeText={value =>
              setAdjustmentValues(prev => ({
                ...prev,
                newMonthlyContribution: parseFloat(value) || 0,
              }))
            }
            keyboardType='numeric'
            style={styles.input}
          />
        )}

        {adjustmentType === 'suspension' && (
          <Input
            label='Suspension Period (months)'
            value={adjustmentValues.suspensionMonths.toString()}
            onChangeText={value =>
              setAdjustmentValues(prev => ({
                ...prev,
                suspensionMonths: parseInt(value) || 0,
              }))
            }
            keyboardType='numeric'
            style={styles.input}
          />
        )}

        <Input
          label='Reason for Adjustment (Optional)'
          value={adjustmentValues.adjustmentReason}
          onChangeText={value =>
            setAdjustmentValues(prev => ({
              ...prev,
              adjustmentReason: value,
            }))
          }
          multiline
          numberOfLines={3}
          style={styles.input}
        />
      </ScrollView>
    </View>
  );

  const renderImpactReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Impact</Text>
      <Text style={styles.stepDescription}>
        Here's how your adjustments will affect your FIRE goal:
      </Text>

      {isCalculating ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating impact...</Text>
        </View>
      ) : (
        calculatedImpact && (
          <Card style={styles.impactCard}>
            <View style={styles.impactRow}>
              <Text style={styles.impactLabel}>Timeline Change:</Text>
              <Text
                style={[
                  styles.impactValue,
                  calculatedImpact.timelineChange > 0
                    ? styles.negativeImpact
                    : styles.positiveImpact,
                ]}
              >
                {calculatedImpact.timelineChange > 0 ? '+' : ''}
                {calculatedImpact.timelineChange} months
              </Text>
            </View>

            <View style={styles.impactRow}>
              <Text style={styles.impactLabel}>Target Amount Change:</Text>
              <Text
                style={[
                  styles.impactValue,
                  calculatedImpact.targetAmountChange > 0
                    ? styles.negativeImpact
                    : styles.positiveImpact,
                ]}
              >
                {calculatedImpact.targetAmountChange > 0 ? '+' : ''}$
                {calculatedImpact.targetAmountChange.toLocaleString()}
              </Text>
            </View>

            <View style={styles.impactRow}>
              <Text style={styles.impactLabel}>Feasibility Change:</Text>
              <Text
                style={[
                  styles.impactValue,
                  calculatedImpact.feasibilityChange < 0
                    ? styles.negativeImpact
                    : styles.positiveImpact,
                ]}
              >
                {calculatedImpact.feasibilityChange > 0 ? '+' : ''}
                {calculatedImpact.feasibilityChange}%
              </Text>
            </View>
          </Card>
        )
      )}
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirm Changes</Text>
      <Text style={styles.stepDescription}>
        Review your adjustments before applying them to your goal:
      </Text>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Adjustment Summary</Text>
        <Text style={styles.summaryItem}>
          Life Event: {selectedLifeEvent?.title}
        </Text>
        <Text style={styles.summaryItem}>
          Adjustment Type: {getAdjustmentTitle(adjustmentType!)}
        </Text>
        {adjustmentValues.adjustmentReason && (
          <Text style={styles.summaryItem}>
            Reason: {adjustmentValues.adjustmentReason}
          </Text>
        )}
      </Card>
    </View>
  );

  const getAdjustmentTitle = (type: AdjustmentType): string => {
    const titles = {
      timeline: 'Adjust Timeline',
      target_amount: 'Change Target Amount',
      monthly_contribution: 'Modify Monthly Contribution',
      expenses: 'Update Expenses',
      suspension: 'Suspend Goal Temporarily',
      split_goal: 'Split Into Multiple Goals',
    };
    return titles[type];
  };

  const getAdjustmentDescription = (type: AdjustmentType): string => {
    const descriptions = {
      timeline: 'Change your target retirement date',
      target_amount: 'Increase or decrease your FIRE number',
      monthly_contribution: 'Adjust how much you save monthly',
      expenses: 'Update your expected retirement expenses',
      suspension: 'Pause contributions temporarily',
      split_goal: 'Create separate goals for different purposes',
    };
    return descriptions[type];
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!selectedLifeEvent;
      case 1:
        return !!adjustmentType;
      case 2:
        return true; // Values are optional
      case 3:
        return !!calculatedImpact;
      case 4:
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
          <Text style={styles.headerTitle}>Adjust Goal</Text>
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
          {currentStep === 0 && renderLifeEventSelection()}
          {currentStep === 1 && renderAdjustmentTypeSelection()}
          {currentStep === 2 && renderValueAdjustment()}
          {currentStep === 3 && renderImpactReview()}
          {currentStep === 4 && renderConfirmation()}
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
            title={currentStep === steps.length - 1 ? 'Apply Changes' : 'Next'}
            onPress={handleNext}
            disabled={!isStepValid()}
            loading={isCalculating && currentStep === 3}
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
  eventList: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEventCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactlow: {
    backgroundColor: '#D4EDDA',
  },
  impactmedium: {
    backgroundColor: '#FFF3CD',
  },
  impacthigh: {
    backgroundColor: '#F8D7DA',
  },
  impactText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#495057',
  },
  adjustmentOptions: {
    gap: 12,
  },
  adjustmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAdjustmentCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  adjustmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  adjustmentDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  impactCard: {
    padding: 20,
    gap: 16,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveImpact: {
    color: '#28A745',
  },
  negativeImpact: {
    color: '#DC3545',
  },
  summaryCard: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  summaryItem: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 8,
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

export default GoalAdjustmentWizard;
