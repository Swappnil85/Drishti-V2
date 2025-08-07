/**
 * AssumptionsStep Component
 * Epic 9, Story 1: Financial assumptions step in scenario creation wizard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Text, Card, Input } from '../../../components/ui';
import { useHaptic } from '../../../hooks/useHaptic';
import { ScenarioWizardData } from '../CreateScenarioScreen';
import { ScenarioAssumptions } from '@drishti/shared/types/financial';
import {
  historicalMarketDataService,
  AssumptionGuidance,
} from '../../../services/market/HistoricalMarketDataService';
import {
  realTimeCalculationService,
  RealTimeProjections,
  ProjectionInputs,
} from '../../../services/calculations/RealTimeCalculationService';
import {
  whatIfAnalysisService,
  WhatIfScenario,
  SensitivityAnalysis,
} from '../../../services/analysis/WhatIfAnalysisService';

interface AssumptionsStepProps {
  data: ScenarioWizardData;
  onUpdate: (updates: Partial<ScenarioWizardData>) => void;
}

const AssumptionsStep: React.FC<AssumptionsStepProps> = ({
  data,
  onUpdate,
}) => {
  const { buttonTap } = useHaptic();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistoricalContext, setShowHistoricalContext] = useState(false);
  const [selectedGuidance, setSelectedGuidance] =
    useState<AssumptionGuidance | null>(null);
  const [guidanceCache, setGuidanceCache] = useState<
    Map<string, AssumptionGuidance>
  >(new Map());
  const [realTimeProjections, setRealTimeProjections] =
    useState<RealTimeProjections | null>(null);
  const [showProjections, setShowProjections] = useState(true);
  const [whatIfScenarios, setWhatIfScenarios] = useState<WhatIfScenario[]>([]);
  const [sensitivityAnalysis, setSensitivityAnalysis] = useState<
    SensitivityAnalysis[]
  >([]);
  const [showWhatIf, setShowWhatIf] = useState(false);

  // Get current assumptions with defaults
  const assumptions: ScenarioAssumptions = {
    inflation_rate: 0.03,
    market_return: 0.07,
    savings_rate: 0.2,
    retirement_age: 65,
    life_expectancy: 87,
    emergency_fund_months: 6,
    healthcare_inflation: 0.06,
    tax_rate: 0.25,
    ...data.selectedTemplate?.assumptions,
    ...data.assumptions,
  };

  /**
   * Calculate real-time projections
   */
  const calculateRealTimeProjections = (
    newAssumptions: ScenarioAssumptions
  ) => {
    try {
      const projectionInputs: ProjectionInputs = {
        currentAge: 30, // Default current age
        currentNetWorth: 50000, // Default starting net worth
        monthlyIncome: 8000, // Default monthly income
        monthlyExpenses: 4000, // Default monthly expenses
        assumptions: newAssumptions,
      };

      const projections =
        realTimeCalculationService.calculateProjections(projectionInputs);
      setRealTimeProjections(projections);
    } catch (error) {
      console.error('Error calculating real-time projections:', error);
      setRealTimeProjections(null);
    }
  };

  /**
   * Generate what-if analysis
   */
  const generateWhatIfAnalysis = (baseAssumptions: ScenarioAssumptions) => {
    try {
      // Generate common what-if scenarios
      const scenarios =
        whatIfAnalysisService.generateCommonWhatIfScenarios(baseAssumptions);
      setWhatIfScenarios(scenarios);

      // Perform sensitivity analysis
      const sensitivity =
        whatIfAnalysisService.performSensitivityAnalysis(baseAssumptions);
      setSensitivityAnalysis(sensitivity);
    } catch (error) {
      console.error('Error generating what-if analysis:', error);
      setWhatIfScenarios([]);
      setSensitivityAnalysis([]);
    }
  };

  /**
   * Update assumption value
   */
  const updateAssumption = (key: keyof ScenarioAssumptions, value: number) => {
    const newAssumptions = { ...assumptions, [key]: value };
    onUpdate({ assumptions: newAssumptions });

    // Update guidance cache for relevant parameters
    if (
      key === 'inflation_rate' ||
      key === 'market_return' ||
      key === 'savings_rate'
    ) {
      const guidance = historicalMarketDataService.getAssumptionGuidance(
        key,
        value
      );
      setGuidanceCache(prev => new Map(prev.set(key, guidance)));
    }

    // Calculate real-time projections
    calculateRealTimeProjections(newAssumptions);
  };

  // Calculate initial projections and what-if analysis
  useEffect(() => {
    calculateRealTimeProjections(assumptions);
    generateWhatIfAnalysis(assumptions);
  }, []);

  /**
   * Get guidance for a parameter
   */
  const getGuidance = (
    parameter: 'inflation_rate' | 'market_return' | 'savings_rate'
  ): AssumptionGuidance => {
    const cacheKey = parameter;
    if (guidanceCache.has(cacheKey)) {
      return guidanceCache.get(cacheKey)!;
    }

    const value = assumptions[parameter] as number;
    const guidance = historicalMarketDataService.getAssumptionGuidance(
      parameter,
      value
    );
    setGuidanceCache(prev => new Map(prev.set(cacheKey, guidance)));
    return guidance;
  };

  /**
   * Show historical context modal
   */
  const showGuidanceModal = (
    parameter: 'inflation_rate' | 'market_return' | 'savings_rate'
  ) => {
    buttonTap();
    const guidance = getGuidance(parameter);
    setSelectedGuidance(guidance);
    setShowHistoricalContext(true);
  };

  /**
   * Get confidence color
   */
  const getConfidenceColor = (
    confidence: 'low' | 'medium' | 'high'
  ): string => {
    switch (confidence) {
      case 'high':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#F44336';
    }
  };

  /**
   * Format percentage for display
   */
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  /**
   * Format currency for display
   */
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
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
   * Render slider with label and value
   */
  const renderSlider = (
    label: string,
    key: keyof ScenarioAssumptions,
    min: number,
    max: number,
    step: number,
    formatter: (value: number) => string,
    description?: string,
    showHistoricalContext: boolean = false
  ) => {
    const hasGuidance =
      showHistoricalContext &&
      (key === 'inflation_rate' ||
        key === 'market_return' ||
        key === 'savings_rate');
    const guidance = hasGuidance
      ? getGuidance(key as 'inflation_rate' | 'market_return' | 'savings_rate')
      : null;

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderHeader}>
          <View style={styles.sliderLabelContainer}>
            <Text variant='body2' style={styles.sliderLabel}>
              {label}
            </Text>
            {hasGuidance && (
              <TouchableOpacity
                style={[
                  styles.contextButton,
                  { borderColor: getConfidenceColor(guidance!.confidence) },
                ]}
                onPress={() =>
                  showGuidanceModal(
                    key as 'inflation_rate' | 'market_return' | 'savings_rate'
                  )
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.contextButtonText,
                    { color: getConfidenceColor(guidance!.confidence) },
                  ]}
                >
                  📊
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text variant='h6' style={styles.sliderValue}>
            {formatter(assumptions[key] as number)}
          </Text>
        </View>

        {hasGuidance && (
          <View style={styles.guidancePreview}>
            <Text
              variant='caption'
              style={[
                styles.confidenceText,
                { color: getConfidenceColor(guidance!.confidence) },
              ]}
            >
              Confidence: {guidance!.confidence.toUpperCase()}
            </Text>
            <Text
              variant='caption'
              color='text.secondary'
              style={styles.guidanceText}
            >
              Historical avg: {formatter(guidance!.historicalAverage)}
            </Text>
          </View>
        )}

        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={assumptions[key] as number}
          onValueChange={value => updateAssumption(key, value)}
          minimumTrackTintColor='#2196F3'
          maximumTrackTintColor='#E0E0E0'
          thumbStyle={styles.sliderThumb}
        />
        {description && (
          <Text
            variant='caption'
            color='text.secondary'
            style={styles.sliderDescription}
          >
            {description}
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant='h5' style={styles.title}>
          Financial Assumptions
        </Text>
        <Text variant='body1' color='text.secondary' style={styles.subtitle}>
          Adjust the key assumptions for your scenario. These will be used to
          calculate projections.
        </Text>
      </View>

      {/* Real-time Projections */}
      {realTimeProjections && showProjections && (
        <Card style={styles.section}>
          <View style={styles.projectionsHeader}>
            <Text variant='h6' style={styles.sectionTitle}>
              📊 Live Projections
            </Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                buttonTap();
                setShowProjections(!showProjections);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleButtonText}>
                {showProjections ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.projectionsGrid}>
            <View style={styles.projectionCard}>
              <Text
                variant='h4'
                style={[styles.projectionValue, { color: '#2196F3' }]}
              >
                {Math.ceil(realTimeProjections.yearsToFire)}
              </Text>
              <Text
                variant='caption'
                color='text.secondary'
                style={styles.projectionLabel}
              >
                Years to FIRE
              </Text>
            </View>
            <View style={styles.projectionCard}>
              <Text
                variant='h4'
                style={[styles.projectionValue, { color: '#4CAF50' }]}
              >
                ${Math.round(realTimeProjections.fireNumber / 1000)}K
              </Text>
              <Text
                variant='caption'
                color='text.secondary'
                style={styles.projectionLabel}
              >
                FIRE Number
              </Text>
            </View>
            <View style={styles.projectionCard}>
              <Text
                variant='h4'
                style={[styles.projectionValue, { color: '#FF9800' }]}
              >
                {(realTimeProjections.successProbability * 100).toFixed(0)}%
              </Text>
              <Text
                variant='caption'
                color='text.secondary'
                style={styles.projectionLabel}
              >
                Success Rate
              </Text>
            </View>
          </View>

          {/* Key Insights */}
          {realTimeProjections.keyInsights.length > 0 && (
            <View style={styles.insightsContainer}>
              <Text variant='body2' style={styles.insightsTitle}>
                💡 Key Insights
              </Text>
              {realTimeProjections.keyInsights
                .slice(0, 2)
                .map((insight, index) => (
                  <Text
                    key={index}
                    variant='caption'
                    style={styles.insightText}
                  >
                    {insight}
                  </Text>
                ))}
            </View>
          )}

          {/* Warnings */}
          {realTimeProjections.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              <Text variant='body2' style={styles.warningsTitle}>
                ⚠️ Warnings
              </Text>
              {realTimeProjections.warnings
                .slice(0, 2)
                .map((warning, index) => (
                  <Text
                    key={index}
                    variant='caption'
                    style={styles.warningText}
                  >
                    {warning}
                  </Text>
                ))}
            </View>
          )}
        </Card>
      )}

      {/* Core Assumptions */}
      <Card style={styles.section}>
        <Text variant='h6' style={styles.sectionTitle}>
          Core Assumptions
        </Text>

        {renderSlider(
          'Annual Inflation Rate',
          'inflation_rate',
          0.01,
          0.1,
          0.001,
          formatPercentage,
          'Expected annual inflation rate affecting purchasing power',
          true
        )}

        {renderSlider(
          'Expected Market Return',
          'market_return',
          0.02,
          0.15,
          0.001,
          formatPercentage,
          'Expected annual return on investments',
          true
        )}

        {renderSlider(
          'Savings Rate',
          'savings_rate',
          0.05,
          0.7,
          0.01,
          formatPercentage,
          'Percentage of income saved for retirement',
          true
        )}

        {renderSlider(
          'Retirement Age',
          'retirement_age',
          50,
          75,
          1,
          formatYears,
          'Target age for retirement'
        )}

        {renderSlider(
          'Life Expectancy',
          'life_expectancy',
          75,
          100,
          1,
          formatYears,
          'Expected lifespan for planning purposes'
        )}
      </Card>

      {/* Advanced Assumptions */}
      <Card style={styles.section}>
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => {
            buttonTap();
            setShowAdvanced(!showAdvanced);
          }}
          activeOpacity={0.7}
        >
          <Text variant='h6' style={styles.sectionTitle}>
            Advanced Assumptions
          </Text>
          <Text variant='body2' style={styles.toggleIcon}>
            {showAdvanced ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedContent}>
            {renderSlider(
              'Emergency Fund',
              'emergency_fund_months',
              3,
              24,
              1,
              formatMonths,
              'Months of expenses to keep as emergency fund'
            )}

            {renderSlider(
              'Healthcare Inflation',
              'healthcare_inflation',
              0.02,
              0.12,
              0.001,
              formatPercentage,
              'Expected annual healthcare cost inflation'
            )}

            {renderSlider(
              'Tax Rate',
              'tax_rate',
              0.1,
              0.5,
              0.01,
              formatPercentage,
              'Expected effective tax rate in retirement'
            )}
          </View>
        )}
      </Card>

      {/* Assumption Summary */}
      <Card style={styles.section}>
        <Text variant='h6' style={styles.sectionTitle}>
          Summary
        </Text>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text variant='body2' color='text.secondary'>
              Real Return (after inflation)
            </Text>
            <Text variant='body2' style={styles.summaryValue}>
              {formatPercentage(
                assumptions.market_return - assumptions.inflation_rate
              )}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant='body2' color='text.secondary'>
              Years to Retirement
            </Text>
            <Text variant='body2' style={styles.summaryValue}>
              {formatYears(assumptions.retirement_age - 30)}{' '}
              {/* Assuming current age ~30 */}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant='body2' color='text.secondary'>
              Retirement Duration
            </Text>
            <Text variant='body2' style={styles.summaryValue}>
              {formatYears(
                assumptions.life_expectancy - assumptions.retirement_age
              )}
            </Text>
          </View>
        </View>
      </Card>

      {/* Validation Warnings */}
      {assumptions.market_return > 0.12 && (
        <Card style={[styles.section, styles.warningCard]}>
          <Text variant='body2' style={styles.warningText}>
            ⚠️ High market return assumption. Historical average is around
            7-10%.
          </Text>
        </Card>
      )}

      {assumptions.savings_rate > 0.5 && (
        <Card style={[styles.section, styles.warningCard]}>
          <Text variant='body2' style={styles.warningText}>
            ⚠️ Very high savings rate. Ensure this is sustainable long-term.
          </Text>
        </Card>
      )}

      {assumptions.inflation_rate > 0.06 && (
        <Card style={[styles.section, styles.warningCard]}>
          <Text variant='body2' style={styles.warningText}>
            ⚠️ High inflation assumption. Consider using a more conservative
            rate (2-4%).
          </Text>
        </Card>
      )}

      {/* What-If Analysis */}
      <Card style={styles.section}>
        <View style={styles.projectionsHeader}>
          <Text variant='h6' style={styles.sectionTitle}>
            🔍 What-If Analysis
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              buttonTap();
              setShowWhatIf(!showWhatIf);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleButtonText}>
              {showWhatIf ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
        </View>

        {showWhatIf && (
          <>
            {/* Common What-If Scenarios */}
            {whatIfScenarios.length > 0 && (
              <View style={styles.whatIfSection}>
                <Text variant='body2' style={styles.whatIfSectionTitle}>
                  💡 Quick Scenarios
                </Text>
                {whatIfScenarios.slice(0, 3).map((scenario, index) => (
                  <View key={index} style={styles.whatIfScenario}>
                    <View style={styles.whatIfHeader}>
                      <Text variant='body2' style={styles.whatIfName}>
                        {scenario.name}
                      </Text>
                      <Text
                        variant='caption'
                        style={[
                          styles.whatIfImpact,
                          {
                            color:
                              scenario.impact.impactDirection === 'positive'
                                ? '#4CAF50'
                                : scenario.impact.impactDirection === 'negative'
                                  ? '#F44336'
                                  : '#FF9800',
                          },
                        ]}
                      >
                        {scenario.impact.yearsToFireChange > 0 ? '+' : ''}
                        {scenario.impact.yearsToFireChange.toFixed(1)} years
                      </Text>
                    </View>
                    <Text
                      variant='caption'
                      color='text.secondary'
                      style={styles.whatIfDescription}
                    >
                      {scenario.description}
                    </Text>
                    {scenario.impact.keyInsights.length > 0 && (
                      <Text variant='caption' style={styles.whatIfInsight}>
                        {scenario.impact.keyInsights[0]}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Sensitivity Analysis */}
            {sensitivityAnalysis.length > 0 && (
              <View style={styles.whatIfSection}>
                <Text variant='body2' style={styles.whatIfSectionTitle}>
                  📊 Most Sensitive Parameters
                </Text>
                {sensitivityAnalysis.slice(0, 3).map((analysis, index) => (
                  <View key={index} style={styles.sensitivityItem}>
                    <View style={styles.sensitivityHeader}>
                      <Text variant='body2' style={styles.sensitivityParameter}>
                        {analysis.parameter
                          .replace('_', ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                        {analysis.mostSensitive && (
                          <Text style={styles.mostSensitiveIndicator}> 🎯</Text>
                        )}
                      </Text>
                      <Text
                        variant='caption'
                        style={styles.sensitivityElasticity}
                      >
                        {Math.abs(analysis.elasticity).toFixed(1)}x impact
                      </Text>
                    </View>
                    <Text
                      variant='caption'
                      color='text.secondary'
                      style={styles.sensitivityDescription}
                    >
                      Current:{' '}
                      {analysis.parameter.includes('rate') ||
                      analysis.parameter.includes('inflation')
                        ? `${(analysis.baseValue * 100).toFixed(1)}%`
                        : analysis.baseValue.toString()}
                    </Text>
                  </View>
                ))}
                <Text
                  variant='caption'
                  color='text.secondary'
                  style={styles.sensitivityNote}
                >
                  🎯 = Most sensitive to changes
                </Text>
              </View>
            )}
          </>
        )}
      </Card>

      {/* Historical Context Modal */}
      <Modal
        visible={showHistoricalContext}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowHistoricalContext(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant='h5' style={styles.modalTitle}>
              Historical Context
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHistoricalContext(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedGuidance && (
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Current vs Historical */}
              <Card style={styles.modalSection}>
                <Text variant='h6' style={styles.modalSectionTitle}>
                  Your Assumption vs History
                </Text>
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonItem}>
                    <Text variant='caption' color='text.secondary'>
                      Your Value
                    </Text>
                    <Text variant='h6' style={styles.comparisonValue}>
                      {selectedGuidance.parameter === 'inflation_rate' ||
                      selectedGuidance.parameter === 'market_return'
                        ? formatPercentage(selectedGuidance.currentValue)
                        : formatPercentage(selectedGuidance.currentValue)}
                    </Text>
                  </View>
                  <View style={styles.comparisonItem}>
                    <Text variant='caption' color='text.secondary'>
                      Historical Average
                    </Text>
                    <Text variant='h6' style={styles.comparisonValue}>
                      {selectedGuidance.parameter === 'inflation_rate' ||
                      selectedGuidance.parameter === 'market_return'
                        ? formatPercentage(selectedGuidance.historicalAverage)
                        : formatPercentage(selectedGuidance.historicalAverage)}
                    </Text>
                  </View>
                  <View style={styles.comparisonItem}>
                    <Text variant='caption' color='text.secondary'>
                      Confidence
                    </Text>
                    <Text
                      variant='h6'
                      style={[
                        styles.comparisonValue,
                        {
                          color: getConfidenceColor(
                            selectedGuidance.confidence
                          ),
                        },
                      ]}
                    >
                      {selectedGuidance.confidence.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Reasoning */}
              <Card style={styles.modalSection}>
                <Text variant='h6' style={styles.modalSectionTitle}>
                  Analysis
                </Text>
                <Text variant='body2' style={styles.reasoningText}>
                  {selectedGuidance.reasoning}
                </Text>
              </Card>

              {/* Warnings */}
              {selectedGuidance.warnings &&
                selectedGuidance.warnings.length > 0 && (
                  <Card style={[styles.modalSection, styles.warningSection]}>
                    <Text variant='h6' style={styles.modalSectionTitle}>
                      ⚠️ Warnings
                    </Text>
                    {selectedGuidance.warnings.map((warning, index) => (
                      <Text
                        key={index}
                        variant='body2'
                        style={styles.warningText}
                      >
                        • {warning}
                      </Text>
                    ))}
                  </Card>
                )}

              {/* Tips */}
              <Card style={styles.modalSection}>
                <Text variant='h6' style={styles.modalSectionTitle}>
                  💡 Tips
                </Text>
                {selectedGuidance.tips.map((tip, index) => (
                  <Text key={index} variant='body2' style={styles.tipText}>
                    • {tip}
                  </Text>
                ))}
              </Card>

              {/* Historical Data */}
              <Card style={styles.modalSection}>
                <Text variant='h6' style={styles.modalSectionTitle}>
                  📈 Historical Periods
                </Text>
                {historicalMarketDataService
                  .getHistoricalData()
                  .slice(0, 3)
                  .map((period, index) => (
                    <View key={index} style={styles.historicalPeriod}>
                      <Text variant='body2' style={styles.periodTitle}>
                        {period.period}
                      </Text>
                      <Text
                        variant='caption'
                        color='text.secondary'
                        style={styles.periodDescription}
                      >
                        {period.description}
                      </Text>
                      <View style={styles.periodStats}>
                        <Text variant='caption' style={styles.periodStat}>
                          Inflation:{' '}
                          {formatPercentage(period.inflationRate.average)}
                        </Text>
                        <Text variant='caption' style={styles.periodStat}>
                          Returns:{' '}
                          {formatPercentage(period.marketReturn.average)}
                        </Text>
                      </View>
                    </View>
                  ))}
              </Card>
            </ScrollView>
          )}
        </View>
      </Modal>
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
  sliderContainer: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sliderLabel: {
    fontWeight: '600',
    marginRight: 8,
  },
  sliderValue: {
    color: '#2196F3',
  },
  contextButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  contextButtonText: {
    fontSize: 12,
  },
  guidancePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  guidanceText: {
    fontSize: 10,
  },
  // Real-time projections styles
  projectionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  projectionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  projectionValue: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  projectionLabel: {
    textAlign: 'center',
    lineHeight: 14,
  },
  insightsContainer: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightsTitle: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#2E7D32',
  },
  insightText: {
    color: '#2E7D32',
    lineHeight: 16,
    marginBottom: 2,
  },
  warningsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningsTitle: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#E65100',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#2196F3',
    width: 20,
    height: 20,
  },
  sliderDescription: {
    marginTop: 4,
    lineHeight: 16,
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleIcon: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  advancedContent: {
    marginTop: 8,
  },
  summary: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    color: '#E65100',
    lineHeight: 18,
  },
  // What-If Analysis styles
  whatIfSection: {
    marginBottom: 16,
  },
  whatIfSectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#2196F3',
  },
  whatIfScenario: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  whatIfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  whatIfName: {
    fontWeight: '600',
    flex: 1,
  },
  whatIfImpact: {
    fontWeight: '600',
    fontSize: 12,
  },
  whatIfDescription: {
    lineHeight: 16,
    marginBottom: 4,
  },
  whatIfInsight: {
    color: '#2196F3',
    fontSize: 11,
    fontStyle: 'italic',
  },
  sensitivityItem: {
    backgroundColor: '#F0F8FF',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  sensitivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sensitivityParameter: {
    fontWeight: '600',
    flex: 1,
  },
  mostSensitiveIndicator: {
    fontSize: 12,
  },
  sensitivityElasticity: {
    color: '#FF9800',
    fontWeight: '600',
    fontSize: 11,
  },
  sensitivityDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  sensitivityNote: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    padding: 16,
    marginBottom: 16,
  },
  modalSectionTitle: {
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonValue: {
    marginTop: 4,
    fontWeight: '600',
  },
  reasoningText: {
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipText: {
    lineHeight: 18,
    marginBottom: 4,
  },
  historicalPeriod: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  periodTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  periodDescription: {
    marginBottom: 8,
    lineHeight: 16,
  },
  periodStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodStat: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
});

export default AssumptionsStep;
