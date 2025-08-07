/**
 * Stress Testing Screen
 * Epic 9, Story 5: Comprehensive stress testing with market downturns and recovery analysis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Text, Card, Button } from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';
import { useScenarios } from '../../hooks/useScenarios';
import {
  stressTestingService,
  StressTest,
  HistoricalStressEvent,
  StressTestResults,
} from '../../services/stress/StressTestingService';
import { EnhancedScenario } from '@drishti/shared/types/financial';

interface StressTestingScreenProps {
  route: {
    params: {
      scenarioId: string;
    };
  };
  navigation: any;
}

const StressTestingScreen: React.FC<StressTestingScreenProps> = ({
  route,
  navigation,
}) => {
  const { buttonTap } = useHaptic();
  const { scenarios, loading } = useScenarios();
  const [scenario, setScenario] = useState<EnhancedScenario | null>(null);
  const [stressTests, setStressTests] = useState<StressTest[]>([]);
  const [currentTest, setCurrentTest] = useState<StressTest | null>(null);
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalStressEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'history'>('overview');
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    initializeData();
  }, [route.params.scenarioId]);

  /**
   * Initialize data
   */
  const initializeData = async () => {
    const { scenarioId } = route.params;
    
    // Find scenario
    const foundScenario = scenarios.find(s => s.id === scenarioId);
    if (foundScenario) {
      setScenario(foundScenario);
    }

    // Load existing stress tests
    const existingTests = stressTestingService.getStressTests();
    setStressTests(existingTests);

    // Load historical events
    const events = stressTestingService.getHistoricalEvents();
    setHistoricalEvents(events);
  };

  /**
   * Run comprehensive stress test
   */
  const runStressTest = async (testType: 'historical' | 'custom' | 'monte_carlo' = 'historical') => {
    if (!scenario) return;

    setIsRunningTest(true);
    buttonTap();

    try {
      const testName = `${scenario.name} - ${testType.charAt(0).toUpperCase() + testType.slice(1)} Stress Test`;
      const stressTest = await stressTestingService.createStressTest(
        scenario,
        testName,
        testType,
        30
      );

      setCurrentTest(stressTest);
      setStressTests(prev => [stressTest, ...prev]);
      setActiveTab('results');
      
      Alert.alert('Success', 'Stress test completed successfully!');
    } catch (error) {
      console.error('Error running stress test:', error);
      Alert.alert('Error', 'Failed to run stress test');
    } finally {
      setIsRunningTest(false);
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'mild': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'severe': return '#F44336';
      case 'extreme': return '#9C27B0';
      default: return '#666666';
    }
  };

  /**
   * Get risk color
   */
  const getRiskColor = (riskScore: number): string => {
    if (riskScore < 30) return '#4CAF50';
    if (riskScore < 60) return '#FF9800';
    return '#F44336';
  };

  /**
   * Render overview tab
   */
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Scenario Info */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          📊 Scenario Overview
        </Text>
        
        {scenario && (
          <View style={styles.scenarioInfo}>
            <Text variant="h5" style={styles.scenarioName}>
              {scenario.emoji} {scenario.name}
            </Text>
            <Text variant="body2" color="text.secondary" style={styles.scenarioDescription}>
              {scenario.description}
            </Text>
            
            <View style={styles.assumptionsGrid}>
              <View style={styles.assumptionItem}>
                <Text variant="caption" color="text.secondary">Market Return</Text>
                <Text variant="body2" style={styles.assumptionValue}>
                  {formatPercentage(scenario.assumptions.market_return)}
                </Text>
              </View>
              <View style={styles.assumptionItem}>
                <Text variant="caption" color="text.secondary">Savings Rate</Text>
                <Text variant="body2" style={styles.assumptionValue}>
                  {formatPercentage(scenario.assumptions.savings_rate)}
                </Text>
              </View>
              <View style={styles.assumptionItem}>
                <Text variant="caption" color="text.secondary">Inflation Rate</Text>
                <Text variant="body2" style={styles.assumptionValue}>
                  {formatPercentage(scenario.assumptions.inflation_rate)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </Card>

      {/* Stress Test Options */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          🧪 Run Stress Tests
        </Text>
        
        <View style={styles.testOptions}>
          <TouchableOpacity
            style={[styles.testOption, isRunningTest && styles.disabledOption]}
            onPress={() => !isRunningTest && runStressTest('historical')}
            activeOpacity={0.7}
            disabled={isRunningTest}
          >
            <Text variant="h6" style={styles.testOptionTitle}>
              📈 Historical Events
            </Text>
            <Text variant="body2" color="text.secondary" style={styles.testOptionDescription}>
              Test against major historical market events like 2008 crisis, COVID-19, and 1970s stagflation
            </Text>
            <View style={styles.testOptionFooter}>
              <Text variant="caption" style={styles.testOptionDuration}>
                Duration: ~30 years
              </Text>
              <Text variant="caption" style={styles.testOptionScenarios}>
                4 scenarios
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testOption, isRunningTest && styles.disabledOption]}
            onPress={() => !isRunningTest && runStressTest('custom')}
            activeOpacity={0.7}
            disabled={isRunningTest}
          >
            <Text variant="h6" style={styles.testOptionTitle}>
              🎯 Custom Scenarios
            </Text>
            <Text variant="body2" color="text.secondary" style={styles.testOptionDescription}>
              Test against custom stress scenarios tailored to your specific concerns
            </Text>
            <View style={styles.testOptionFooter}>
              <Text variant="caption" style={styles.testOptionDuration}>
                Duration: Configurable
              </Text>
              <Text variant="caption" style={styles.testOptionScenarios}>
                5+ scenarios
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testOption, isRunningTest && styles.disabledOption]}
            onPress={() => !isRunningTest && runStressTest('monte_carlo')}
            activeOpacity={0.7}
            disabled={isRunningTest}
          >
            <Text variant="h6" style={styles.testOptionTitle}>
              🎲 Monte Carlo
            </Text>
            <Text variant="body2" color="text.secondary" style={styles.testOptionDescription}>
              Run thousands of random scenarios to test plan robustness
            </Text>
            <View style={styles.testOptionFooter}>
              <Text variant="caption" style={styles.testOptionDuration}>
                Duration: ~50 years
              </Text>
              <Text variant="caption" style={styles.testOptionScenarios}>
                1000+ scenarios
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {isRunningTest && (
          <View style={styles.loadingContainer}>
            <Text variant="body2" style={styles.loadingText}>
              Running stress test... This may take a moment.
            </Text>
          </View>
        )}
      </Card>

      {/* Previous Tests */}
      {stressTests.length > 0 && (
        <Card style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            📋 Previous Tests
          </Text>
          
          {stressTests.slice(0, 3).map((test, index) => (
            <TouchableOpacity
              key={test.id}
              style={styles.testHistoryItem}
              onPress={() => {
                buttonTap();
                setCurrentTest(test);
                setActiveTab('results');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.testHistoryHeader}>
                <Text variant="body2" style={styles.testHistoryName}>
                  {test.name}
                </Text>
                <Text variant="caption" color="text.secondary">
                  {test.createdAt.toLocaleDateString()}
                </Text>
              </View>
              <Text variant="caption" color="text.secondary" style={styles.testHistoryDescription}>
                {test.type.charAt(0).toUpperCase() + test.type.slice(1)} • {test.stressScenarios.length} scenarios
              </Text>
              <View style={styles.testHistoryMetrics}>
                <Text variant="caption" style={styles.testHistoryMetric}>
                  Survival Rate: {test.results.summary.survivabilityRate.toFixed(0)}%
                </Text>
                <Text variant="caption" style={styles.testHistoryMetric}>
                  Avg Delay: {test.results.summary.averageFireDelay.toFixed(1)} years
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </View>
  );

  /**
   * Render results tab
   */
  const renderResultsTab = () => {
    if (!currentTest) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.emptyState}>
            <Text variant="h6">No Test Results</Text>
            <Text variant="body2" color="text.secondary" style={styles.emptyStateDescription}>
              Run a stress test to see detailed results and analysis
            </Text>
          </View>
        </View>
      );
    }

    const { results } = currentTest;

    return (
      <View style={styles.tabContent}>
        {/* Summary */}
        <Card style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            📊 Test Summary
          </Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text variant="h4" style={[styles.summaryValue, { color: getRiskColor(100 - results.summary.survivabilityRate) }]}>
                {results.summary.survivabilityRate.toFixed(0)}%
              </Text>
              <Text variant="caption" color="text.secondary">Survival Rate</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="h4" style={styles.summaryValue}>
                {results.summary.averageFireDelay.toFixed(1)}
              </Text>
              <Text variant="caption" color="text.secondary">Avg Delay (Years)</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="h4" style={styles.summaryValue}>
                {formatCurrency(Math.abs(results.summary.averageNetWorthImpact))}
              </Text>
              <Text variant="caption" color="text.secondary">Avg Impact</Text>
            </View>
          </View>
        </Card>

        {/* Risk Analysis */}
        <Card style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            ⚠️ Risk Analysis
          </Text>
          
          <View style={styles.riskItem}>
            <Text variant="body2" style={styles.riskLabel}>Overall Risk Score:</Text>
            <View style={[
              styles.riskIndicator,
              { backgroundColor: getRiskColor(results.riskMetrics.overallRiskScore) }
            ]}>
              <Text style={styles.riskText}>
                {results.riskMetrics.overallRiskScore.toFixed(0)}
              </Text>
            </View>
          </View>

          <View style={styles.riskItem}>
            <Text variant="body2" style={styles.riskLabel}>Sequence Risk:</Text>
            <View style={[
              styles.riskIndicator,
              { backgroundColor: getRiskColor(results.riskMetrics.sequenceOfReturnsRisk * 100) }
            ]}>
              <Text style={styles.riskText}>
                {results.riskMetrics.sequenceOfReturnsRisk > 0.5 ? 'High' : 'Moderate'}
              </Text>
            </View>
          </View>

          <View style={styles.riskItem}>
            <Text variant="body2" style={styles.riskLabel}>Emergency Fund:</Text>
            <View style={[
              styles.riskIndicator,
              { backgroundColor: results.riskMetrics.emergencyFundAdequacy > 0.6 ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.riskText}>
                {results.riskMetrics.emergencyFundAdequacy > 0.6 ? 'Adequate' : 'Low'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Recommendations */}
        {results.recommendations.length > 0 && (
          <Card style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>
              💡 Recommendations
            </Text>
            
            {results.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text variant="body2" style={styles.recommendationText}>
                  • {recommendation}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Survivability Analysis */}
        <Card style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            🛡️ Survivability Analysis
          </Text>
          
          {results.survivabilityAnalysis.scenarios.map((scenario, index) => (
            <View key={index} style={styles.survivabilityItem}>
              <View style={styles.survivabilityHeader}>
                <Text variant="body2" style={styles.survivabilityName}>
                  {scenario.scenarioName}
                </Text>
                <View style={[
                  styles.survivabilityIndicator,
                  { backgroundColor: scenario.survives ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.survivabilityText}>
                    {scenario.survives ? '✓' : '✗'}
                  </Text>
                </View>
              </View>
              <Text variant="caption" color="text.secondary" style={styles.survivabilityDetails}>
                Final Net Worth: {formatCurrency(scenario.finalNetWorth)} • 
                FIRE: {scenario.fireAchieved ? 'Yes' : 'No'}
              </Text>
            </View>
          ))}
        </Card>
      </View>
    );
  };

  /**
   * Render history tab
   */
  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          📚 Historical Market Events
        </Text>
        
        {historicalEvents.map((event, index) => (
          <View key={index} style={styles.historicalEvent}>
            <View style={styles.eventHeader}>
              <Text variant="body2" style={styles.eventName}>
                {event.name}
              </Text>
              <Text variant="caption" color="text.secondary">
                {event.period}
              </Text>
            </View>
            
            <Text variant="body2" color="text.secondary" style={styles.eventDescription}>
              {event.description}
            </Text>
            
            <View style={styles.eventMetrics}>
              <View style={styles.eventMetric}>
                <Text variant="caption" color="text.secondary">Market Impact</Text>
                <Text variant="caption" style={[
                  styles.eventMetricValue,
                  { color: event.marketImpact < 0 ? '#F44336' : '#4CAF50' }
                ]}>
                  {formatPercentage(event.marketImpact)}
                </Text>
              </View>
              <View style={styles.eventMetric}>
                <Text variant="caption" color="text.secondary">Duration</Text>
                <Text variant="caption" style={styles.eventMetricValue}>
                  {event.duration} years
                </Text>
              </View>
              <View style={styles.eventMetric}>
                <Text variant="caption" color="text.secondary">Recovery</Text>
                <Text variant="caption" style={styles.eventMetricValue}>
                  {event.recoveryTime} years
                </Text>
              </View>
            </View>
            
            {event.lessons.length > 0 && (
              <View style={styles.eventLessons}>
                <Text variant="caption" style={styles.eventLessonsTitle}>
                  Key Lessons:
                </Text>
                {event.lessons.slice(0, 2).map((lesson, lessonIndex) => (
                  <Text key={lessonIndex} variant="caption" style={styles.eventLesson}>
                    • {lesson}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </Card>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant="h6">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scenario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text variant="h6">Scenario Not Found</Text>
          <Button
            title="Back to Scenarios"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="h5" style={styles.title}>
            🧪 Stress Testing
          </Text>
          <Text variant="caption" color="text.secondary">
            Test your plan against market volatility
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'results', label: 'Results' },
          { key: 'history', label: 'History' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => {
              buttonTap();
              setActiveTab(tab.key as any);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.activeTabButtonText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'results' && renderResultsTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  backButton: {
    marginTop: 24,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  activeTabButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  scenarioInfo: {
    alignItems: 'center',
  },
  scenarioName: {
    marginBottom: 8,
    textAlign: 'center',
  },
  scenarioDescription: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  assumptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  assumptionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  assumptionValue: {
    marginTop: 4,
    fontWeight: '600',
    color: '#2196F3',
  },
  testOptions: {
    gap: 16,
  },
  testOption: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  disabledOption: {
    opacity: 0.5,
  },
  testOptionTitle: {
    marginBottom: 8,
  },
  testOptionDescription: {
    lineHeight: 20,
    marginBottom: 12,
  },
  testOptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testOptionDuration: {
    color: '#2196F3',
    fontWeight: '600',
  },
  testOptionScenarios: {
    color: '#666666',
  },
  loadingText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#2196F3',
  },
  testHistoryItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testHistoryName: {
    fontWeight: '600',
    flex: 1,
  },
  testHistoryDescription: {
    marginBottom: 8,
  },
  testHistoryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testHistoryMetric: {
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateDescription: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryValue: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  riskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  riskLabel: {
    flex: 1,
  },
  riskIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  riskText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    lineHeight: 20,
  },
  survivabilityItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  survivabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  survivabilityName: {
    fontWeight: '600',
    flex: 1,
  },
  survivabilityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  survivabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  survivabilityDetails: {
    lineHeight: 16,
  },
  historicalEvent: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontWeight: '600',
    flex: 1,
  },
  eventDescription: {
    lineHeight: 18,
    marginBottom: 12,
  },
  eventMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventMetric: {
    flex: 1,
    alignItems: 'center',
  },
  eventMetricValue: {
    marginTop: 2,
    fontWeight: '600',
  },
  eventLessons: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 6,
  },
  eventLessonsTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  eventLesson: {
    marginBottom: 2,
    paddingLeft: 8,
    lineHeight: 16,
  },
});

export default StressTestingScreen;
