/**
 * CreateScenarioScreen Component
 * Epic 9, Story 1: Scenario Creation Wizard
 * Comprehensive scenario creation with templates and step-by-step guidance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScenariosStackScreenProps } from '../../types/navigation';
import { Text, Button, Container } from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';
import useScenarios from '../../hooks/useScenarios';
import {
  CreateScenarioDto,
  ScenarioTemplateType,
  ScenarioTemplate,
} from '@drishti/shared/types/financial';

// Import wizard steps
import TemplateSelectionStep from './wizard/TemplateSelectionStep';
import BasicInfoStep from './wizard/BasicInfoStep';
import AssumptionsStep from './wizard/AssumptionsStep';
import ReviewStep from './wizard/ReviewStep';

type Props = ScenariosStackScreenProps<'CreateScenario'>;

export interface ScenarioWizardData extends CreateScenarioDto {
  selectedTemplate?: ScenarioTemplate;
}

export type WizardStep = 'template' | 'basic' | 'assumptions' | 'review';

const CreateScenarioScreen: React.FC<Props> = ({ navigation }) => {
  // Hooks
  const { buttonTap, successFeedback, errorFeedback } = useHaptic();
  const { createScenario, createFromTemplate, templates, loading } =
    useScenarios();

  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [wizardData, setWizardData] = useState<ScenarioWizardData>({
    name: '',
    description: '',
    assumptions: {},
    tags: [],
    color: '#2196F3',
    emoji: '📊',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Navigation setup
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          variant='ghost'
          size='sm'
          onPress={handleCancel}
          title='Cancel'
        />
      ),
      headerRight: () => (
        <Button
          variant='ghost'
          size='sm'
          onPress={handleNext}
          title={currentStep === 'review' ? 'Create' : 'Next'}
          disabled={!canProceed()}
        />
      ),
    });
  }, [navigation, currentStep, wizardData]);

  /**
   * Check if user can proceed to next step
   */
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'template':
        return !!wizardData.selectedTemplate;
      case 'basic':
        return !!wizardData.name.trim();
      case 'assumptions':
        return true; // Assumptions are optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    buttonTap();
    Alert.alert(
      'Cancel Creation',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  /**
   * Handle next/create action
   */
  const handleNext = async () => {
    buttonTap();

    if (currentStep === 'review') {
      await handleCreateScenario();
    } else {
      const nextStep = getNextStep(currentStep);
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  };

  /**
   * Handle back action
   */
  const handleBack = () => {
    buttonTap();
    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  /**
   * Get next step
   */
  const getNextStep = (step: WizardStep): WizardStep | null => {
    const steps: WizardStep[] = ['template', 'basic', 'assumptions', 'review'];
    const currentIndex = steps.indexOf(step);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  };

  /**
   * Get previous step
   */
  const getPreviousStep = (step: WizardStep): WizardStep | null => {
    const steps: WizardStep[] = ['template', 'basic', 'assumptions', 'review'];
    const currentIndex = steps.indexOf(step);
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  };

  /**
   * Handle scenario creation
   */
  const handleCreateScenario = async () => {
    try {
      setIsCreating(true);

      let newScenario;
      if (wizardData.selectedTemplate) {
        // Create from template with customizations
        newScenario = await createFromTemplate(
          wizardData.selectedTemplate.type,
          {
            name: wizardData.name,
            description: wizardData.description,
            assumptions: wizardData.assumptions,
            tags: wizardData.tags,
            color: wizardData.color,
            emoji: wizardData.emoji,
            folder: wizardData.folder,
            is_default: wizardData.is_default,
          }
        );
      } else {
        // Create custom scenario
        newScenario = await createScenario(wizardData);
      }

      if (newScenario) {
        successFeedback();
        navigation.navigate('ScenarioDetails', { scenarioId: newScenario.id });
      } else {
        throw new Error('Failed to create scenario');
      }
    } catch (error) {
      errorFeedback();
      Alert.alert(
        'Creation Failed',
        error instanceof Error ? error.message : 'Failed to create scenario',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Update wizard data
   */
  const updateWizardData = (updates: Partial<ScenarioWizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Render current step
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'template':
        return (
          <TemplateSelectionStep
            templates={templates}
            selectedTemplate={wizardData.selectedTemplate}
            onTemplateSelect={template =>
              updateWizardData({ selectedTemplate: template })
            }
          />
        );
      case 'basic':
        return <BasicInfoStep data={wizardData} onUpdate={updateWizardData} />;
      case 'assumptions':
        return (
          <AssumptionsStep data={wizardData} onUpdate={updateWizardData} />
        );
      case 'review':
        return <ReviewStep data={wizardData} onUpdate={updateWizardData} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
        >
          <Container style={styles.content}>
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <Text variant='caption' color='text.secondary' align='center'>
                Step{' '}
                {['template', 'basic', 'assumptions', 'review'].indexOf(
                  currentStep
                ) + 1}{' '}
                of 4
              </Text>
              <View style={styles.progressBar}>
                {['template', 'basic', 'assumptions', 'review'].map(
                  (step, index) => (
                    <View
                      key={step}
                      style={[
                        styles.progressDot,
                        index <=
                          [
                            'template',
                            'basic',
                            'assumptions',
                            'review',
                          ].indexOf(currentStep) && styles.progressDotActive,
                      ]}
                    />
                  )
                )}
              </View>
            </View>

            {/* Current step content */}
            {renderCurrentStep()}

            {/* Navigation buttons */}
            <View style={styles.navigationContainer}>
              {currentStep !== 'template' && (
                <Button
                  variant='outline'
                  onPress={handleBack}
                  title='Back'
                  style={styles.navButton}
                />
              )}
              <View style={styles.spacer} />
              <Button
                variant='primary'
                onPress={handleNext}
                title={currentStep === 'review' ? 'Create Scenario' : 'Next'}
                disabled={!canProceed() || isCreating}
                loading={isCreating}
                style={styles.navButton}
              />
            </View>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: '#2196F3',
  },
  navigationContainer: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navButton: {
    flex: 1,
  },
  spacer: {
    width: 16,
  },
});

export default CreateScenarioScreen;
