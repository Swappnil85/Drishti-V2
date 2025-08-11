/**
 * CreateGoalScreen Component
 * FIRE Goal Creation Wizard
 * Epic 8, Story 1: FIRE Goal Creation & Management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GoalsStackScreenProps } from '../../types/navigation';
import {
  FIREGoalType,
  FIREGoalTemplate,
  FIREGoalMetadata,
  CreateFIREGoalDto,
} from '@drishti/shared/types/financial';
import { FIREGoalService } from '../../services/financial/FIREGoalService';
import { Button, Input, Card, Container } from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';

type Props = GoalsStackScreenProps<'CreateGoal'>;

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

const CreateGoalScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [goalData, setGoalData] = useState<Partial<CreateFIREGoalDto>>({
    name: '',
    goal_type: 'fire_traditional',
    fireMetadata: {
      fireType: 'fire_traditional',
      withdrawalRate: 0.04,
      safetyMargin: 0.1,
      monthlyExpenses: 0,
      annualExpenses: 0,
      currentAge: 30,
      expectedReturn: 0.07,
      inflationRate: 0.03,
      autoAdjustForInflation: true,
      includeHealthcareBuffer: true,
      includeTaxConsiderations: true,
    } as FIREGoalMetadata,
  });
  const [templates, setTemplates] = useState<FIREGoalTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<FIREGoalTemplate | null>(null);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fireGoalService = FIREGoalService.getInstance();
  const { buttonTap, successFeedback, errorFeedback } = useHaptic();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const availableTemplates = fireGoalService.getTemplates();
    setTemplates(availableTemplates);
  };

  const steps: WizardStep[] = [
    {
      id: 'template',
      title: 'Choose FIRE Strategy',
      description: 'Select a FIRE approach that matches your goals',
      component: TemplateSelectionStep,
    },
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Tell us about your current situation',
      component: BasicInfoStep,
    },
    {
      id: 'expenses',
      title: 'Expense Planning',
      description: 'Plan your retirement expenses',
      component: ExpenseStep,
    },
    {
      id: 'calculation',
      title: 'FIRE Number',
      description: 'Calculate your target amount',
      component: CalculationStep,
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review your goal and create it',
      component: ReviewStep,
    },
  ];

  const handleNext = async () => {
    await buttonTap();

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleCreateGoal();
    }
  };

  const handleBack = async () => {
    await buttonTap();

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCreateGoal = async () => {
    try {
      setIsCreating(true);
      await buttonTap();

      const goal = await fireGoalService.createFIREGoal(
        goalData as CreateFIREGoalDto
      );

      await successFeedback();
      Alert.alert(
        'Goal Created!',
        `Your ${goalData.name} goal has been created successfully.`,
        [
          {
            text: 'View Goal',
            onPress: () => {
              navigation.replace('GoalDetails', { goalId: goal.id });
            },
          },
        ]
      );
    } catch (error) {
      await errorFeedback();
      Alert.alert('Error', 'Failed to create goal. Please try again.', [
        { text: 'OK' },
      ]);
      console.error('Failed to create goal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const calculateFIRENumber = async () => {
    if (!goalData.fireMetadata) return;

    try {
      setIsCalculating(true);
      const amount = await fireGoalService.calculateFIRENumber(
        goalData.fireMetadata
      );
      setCalculatedAmount(amount);
      setGoalData(prev => ({
        ...prev,
        target_amount: amount,
      }));
    } catch (error) {
      console.error('Failed to calculate FIRE number:', error);
      Alert.alert(
        'Error',
        'Failed to calculate FIRE number. Please check your inputs.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const updateGoalData = (updates: Partial<CreateFIREGoalDto>) => {
    setGoalData(prev => ({
      ...prev,
      ...updates,
      fireMetadata: {
        ...prev.fireMetadata,
        ...updates.fireMetadata,
      } as FIREGoalMetadata,
    }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress Header */}
        <View style={styles.header}>
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
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>
          <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
          <Text style={styles.stepDescription}>
            {steps[currentStep].description}
          </Text>
        </View>

        {/* Step Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <CurrentStepComponent
            goalData={goalData}
            updateGoalData={updateGoalData}
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            calculatedAmount={calculatedAmount}
            isCalculating={isCalculating}
            calculateFIRENumber={calculateFIRENumber}
          />
        </ScrollView>

        {/* Navigation Footer */}
        <View style={styles.footer}>
          <Button
            title={currentStep === 0 ? 'Cancel' : 'Back'}
            variant='outline'
            onPress={handleBack}
            style={styles.backButton}
          />
          <Button
            title={currentStep === steps.length - 1 ? 'Create Goal' : 'Next'}
            onPress={handleNext}
            loading={isCreating}
            disabled={!isStepValid()}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function isStepValid(): boolean {
    switch (currentStep) {
      case 0: // Template selection
        return !!selectedTemplate;
      case 1: // Basic info
        return !!(goalData.name && goalData.fireMetadata?.currentAge);
      case 2: // Expenses
        return !!(
          goalData.fireMetadata?.monthlyExpenses &&
          goalData.fireMetadata.monthlyExpenses > 0
        );
      case 3: // Calculation
        return !!(goalData.target_amount && goalData.target_amount > 0);
      case 4: // Review
        return true;
      default:
        return false;
    }
  }
};

// Wizard Step Components

const TemplateSelectionStep: React.FC<any> = ({
  templates,
  selectedTemplate,
  setSelectedTemplate,
  updateGoalData,
}) => {
  const handleTemplateSelect = (template: FIREGoalTemplate) => {
    setSelectedTemplate(template);
    updateGoalData({
      goal_type: template.fireType,
      fireMetadata: {
        ...template.defaultMetadata,
        fireType: template.fireType,
      } as Partial<FIREGoalMetadata>,
      templateId: template.id,
      templateName: template.name,
    });
  };

  return (
    <Container>
      <Text style={styles.sectionTitle}>Choose Your FIRE Strategy</Text>
      <Text style={styles.sectionDescription}>
        Each strategy has different approaches to achieving financial
        independence.
      </Text>

      {templates.map(template => (
        <Card
          key={template.id}
          style={[
            styles.templateCard,
            selectedTemplate?.id === template.id && styles.selectedTemplateCard,
          ]}
          onPress={() => handleTemplateSelect(template)}
        >
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateCategory}>{template.category}</Text>
          </View>
          <Text style={styles.templateDescription}>{template.description}</Text>

          <View style={styles.templateDetails}>
            <Text style={styles.templateDetailLabel}>Withdrawal Rate:</Text>
            <Text style={styles.templateDetailValue}>
              {(template.assumptions.withdrawalRate * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.templateTips}>
            {template.guidance.tips.slice(0, 2).map((tip, index) => (
              <Text key={index} style={styles.templateTip}>
                • {tip}
              </Text>
            ))}
          </View>
        </Card>
      ))}
    </Container>
  );
};

const BasicInfoStep: React.FC<any> = ({ goalData, updateGoalData }) => {
  return (
    <Container>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      <Text style={styles.sectionDescription}>
        Tell us about your current situation to personalize your FIRE goal.
      </Text>

      <Input
        label='Goal Name'
        placeholder='e.g., My FIRE Goal'
        value={goalData.name}
        onChangeText={name => updateGoalData({ name })}
        style={styles.input}
      />

      <Input
        label='Current Age'
        placeholder='30'
        value={goalData.fireMetadata?.currentAge?.toString() || ''}
        onChangeText={value =>
          updateGoalData({
            fireMetadata: { currentAge: parseInt(value) || 0 },
          })
        }
        keyboardType='numeric'
        style={styles.input}
      />

      <Input
        label='Target Retirement Age (Optional)'
        placeholder='65'
        value={goalData.fireMetadata?.targetRetirementAge?.toString() || ''}
        onChangeText={value =>
          updateGoalData({
            fireMetadata: { targetRetirementAge: parseInt(value) || undefined },
          })
        }
        keyboardType='numeric'
        style={styles.input}
      />

      <Input
        label='Current Annual Income (Optional)'
        placeholder='75000'
        value={goalData.fireMetadata?.currentIncome?.toString() || ''}
        onChangeText={value =>
          updateGoalData({
            fireMetadata: { currentIncome: parseInt(value) || undefined },
          })
        }
        keyboardType='numeric'
        style={styles.input}
      />
    </Container>
  );
};

const ExpenseStep: React.FC<any> = ({ goalData, updateGoalData }) => {
  const handleMonthlyExpenseChange = (value: string) => {
    const monthlyExpenses = parseFloat(value) || 0;
    const annualExpenses = monthlyExpenses * 12;

    updateGoalData({
      fireMetadata: {
        monthlyExpenses,
        annualExpenses,
      },
    });
  };

  return (
    <Container>
      <Text style={styles.sectionTitle}>Expense Planning</Text>
      <Text style={styles.sectionDescription}>
        Estimate your monthly expenses in retirement. This will be used to
        calculate your FIRE number.
      </Text>

      <Input
        label='Monthly Expenses in Retirement'
        placeholder='4000'
        value={goalData.fireMetadata?.monthlyExpenses?.toString() || ''}
        onChangeText={handleMonthlyExpenseChange}
        keyboardType='numeric'
        style={styles.input}
      />

      {goalData.fireMetadata?.monthlyExpenses && (
        <Card style={styles.expensePreview}>
          <Text style={styles.expensePreviewTitle}>Annual Expenses</Text>
          <Text style={styles.expensePreviewAmount}>
            ${(goalData.fireMetadata.monthlyExpenses * 12).toLocaleString()}
          </Text>
        </Card>
      )}

      <Input
        label='Geographic Location (Optional)'
        placeholder='e.g., Austin, TX'
        value={goalData.fireMetadata?.geographicLocation || ''}
        onChangeText={value =>
          updateGoalData({
            fireMetadata: { geographicLocation: value },
          })
        }
        style={styles.input}
      />
    </Container>
  );
};

const CalculationStep: React.FC<any> = ({
  goalData,
  calculatedAmount,
  isCalculating,
  calculateFIRENumber,
}) => {
  useEffect(() => {
    if (goalData.fireMetadata?.monthlyExpenses) {
      calculateFIRENumber();
    }
  }, []);

  return (
    <Container>
      <Text style={styles.sectionTitle}>Your FIRE Number</Text>
      <Text style={styles.sectionDescription}>
        Based on your expenses and strategy, here's your calculated FIRE number.
      </Text>

      <Card style={styles.calculationCard}>
        <Text style={styles.calculationLabel}>Target Amount</Text>
        {isCalculating ? (
          <Text style={styles.calculationAmount}>Calculating...</Text>
        ) : (
          <Text style={styles.calculationAmount}>
            ${calculatedAmount.toLocaleString()}
          </Text>
        )}

        <View style={styles.calculationDetails}>
          <View style={styles.calculationDetail}>
            <Text style={styles.calculationDetailLabel}>Monthly Expenses:</Text>
            <Text style={styles.calculationDetailValue}>
              ${goalData.fireMetadata?.monthlyExpenses?.toLocaleString() || '0'}
            </Text>
          </View>
          <View style={styles.calculationDetail}>
            <Text style={styles.calculationDetailLabel}>Annual Expenses:</Text>
            <Text style={styles.calculationDetailValue}>
              $
              {(
                (goalData.fireMetadata?.monthlyExpenses || 0) * 12
              ).toLocaleString()}
            </Text>
          </View>
          <View style={styles.calculationDetail}>
            <Text style={styles.calculationDetailLabel}>Withdrawal Rate:</Text>
            <Text style={styles.calculationDetailValue}>
              {((goalData.fireMetadata?.withdrawalRate || 0.04) * 100).toFixed(
                1
              )}
              %
            </Text>
          </View>
        </View>
      </Card>

      <Button
        title='Recalculate'
        variant='outline'
        onPress={calculateFIRENumber}
        loading={isCalculating}
        style={styles.recalculateButton}
      />
    </Container>
  );
};

const ReviewStep: React.FC<any> = ({ goalData, calculatedAmount }) => {
  return (
    <Container>
      <Text style={styles.sectionTitle}>Review Your Goal</Text>
      <Text style={styles.sectionDescription}>
        Review the details of your FIRE goal before creating it.
      </Text>

      <Card style={styles.reviewCard}>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Goal Name:</Text>
          <Text style={styles.reviewValue}>{goalData.name}</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>FIRE Strategy:</Text>
          <Text style={styles.reviewValue}>{goalData.templateName}</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Target Amount:</Text>
          <Text style={styles.reviewValue}>
            ${calculatedAmount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Monthly Expenses:</Text>
          <Text style={styles.reviewValue}>
            ${goalData.fireMetadata?.monthlyExpenses?.toLocaleString() || '0'}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Current Age:</Text>
          <Text style={styles.reviewValue}>
            {goalData.fireMetadata?.currentAge}
          </Text>
        </View>

        {goalData.fireMetadata?.targetRetirementAge && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Target Retirement Age:</Text>
            <Text style={styles.reviewValue}>
              {goalData.fireMetadata.targetRetirementAge}
            </Text>
          </View>
        )}
      </Card>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  progressContainer: {
    marginBottom: 16,
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
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6C757D',
  },
  content: {
    flex: 1,
    padding: 20,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    marginBottom: 16,
  },
  templateCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTemplateCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  templateCategory: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
    lineHeight: 20,
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  templateDetailLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  templateDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  templateTips: {
    gap: 4,
  },
  templateTip: {
    fontSize: 12,
    color: '#28A745',
    lineHeight: 16,
  },
  expensePreview: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  expensePreviewTitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  expensePreviewAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  calculationCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  calculationLabel: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 8,
  },
  calculationAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 20,
  },
  calculationDetails: {
    width: '100%',
    gap: 12,
  },
  calculationDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  calculationDetailLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  calculationDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  recalculateButton: {
    marginTop: 16,
  },
  reviewCard: {
    padding: 20,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#6C757D',
    flex: 1,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    textAlign: 'right',
  },
});

export default CreateGoalScreen;
