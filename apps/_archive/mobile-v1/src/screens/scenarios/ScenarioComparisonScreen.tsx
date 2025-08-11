/**
 * Scenario Comparison Screen
 * Epic 9, Story 2: Side-by-side scenario comparison with analysis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
} from 'react-native';
import { Text, Card, Button } from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';
import { useScenarios } from '../../hooks/useScenarios';
import {
  scenarioComparisonService,
  ScenarioComparison,
  KeyDifference,
} from '../../services/scenario/ScenarioComparisonService';
import { EnhancedScenario } from '@drishti/shared/types/financial';
import { ScenariosStackScreenProps } from '../../types/navigation';

type Props = ScenariosStackScreenProps<'ScenarioComparison'>;

const ScenarioComparisonScreen: React.FC<Props> = ({ route, navigation }) => {
  const { buttonTap } = useHaptic();
  const { scenarios, loading } = useScenarios();
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<
    EnhancedScenario[]
  >([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'details' | 'analysis'
  >('overview');

  useEffect(() => {
    initializeComparison();
  }, [route.params]);

  /**
   * Initialize comparison from route params
   */
  const initializeComparison = async () => {
    const { scenarioIds, comparisonId } = route.params || {};

    if (comparisonId) {
      // Load existing comparison
      const existingComparison =
        scenarioComparisonService.getComparison(comparisonId);
      if (existingComparison) {
        setComparison(existingComparison);
        setSelectedScenarios(existingComparison.scenarios);
      }
    } else if (scenarioIds && scenarioIds.length >= 2) {
      // Create new comparison from selected scenarios
      const scenariosToCompare = scenarios.filter(s =>
        scenarioIds.includes(s.id)
      );
      if (scenariosToCompare.length >= 2) {
        setSelectedScenarios(scenariosToCompare);
        await createComparison(scenariosToCompare);
      }
    }
  };

  /**
   * Create new comparison
   */
  const createComparison = async (scenariosToCompare: EnhancedScenario[]) => {
    setIsCreating(true);
    try {
      const comparisonName = `Comparison ${new Date().toLocaleDateString()}`;
      const newComparison = await scenarioComparisonService.createComparison(
        comparisonName,
        scenariosToCompare
      );
      setComparison(newComparison);
    } catch (error) {
      console.error('Error creating comparison:', error);
      Alert.alert('Error', 'Failed to create scenario comparison');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Export comparison
   */
  const exportComparison = async () => {
    if (!comparison) return;

    buttonTap();
    try {
      const exportData = await scenarioComparisonService.exportComparison(
        comparison.id,
        'csv'
      );

      // Share the comparison summary
      const shareText =
        `Scenario Comparison: ${comparison.name}\n\n` +
        `Scenarios: ${comparison.scenarios.map(s => s.name).join(', ')}\n\n` +
        `Key Findings:\n${comparison.analysis.recommendations.join('\n')}`;

      await Share.share({
        message: shareText,
        title: 'Scenario Comparison Report',
      });
    } catch (error) {
      console.error('Error exporting comparison:', error);
      Alert.alert('Error', 'Failed to export comparison');
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
   * Get significance color
   */
  const getSignificanceColor = (significance: string): string => {
    switch (significance) {
      case 'dramatic':
        return '#F44336';
      case 'significant':
        return '#FF9800';
      case 'moderate':
        return '#2196F3';
      case 'minimal':
        return '#4CAF50';
      default:
        return '#666666';
    }
  };

  /**
   * Get risk color
   */
  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#F44336';
      case 'extreme':
        return '#9C27B0';
      default:
        return '#666666';
    }
  };

  /**
   * Render comparison overview
   */
  const renderOverview = () => {
    if (!comparison) return null;

    return (
      <View style={styles.tabContent}>
        {/* Key Metrics Comparison */}
        <Card style={styles.section}>
          <Text variant='h6' style={styles.sectionTitle}>
            📊 Key Metrics Comparison
          </Text>

          <View style={styles.metricsGrid}>
            {comparison.scenarios.map((scenario, index) => (
              <View key={index} style={styles.metricColumn}>
                <Text variant='body2' style={styles.scenarioName}>
                  {scenario.emoji} {scenario.name}
                </Text>

                <View style={styles.metricItem}>
                  <Text variant='caption' color='text.secondary'>
                    Years to FIRE
                  </Text>
                  <Text variant='h6' style={styles.metricValue}>
                    {Math.ceil(comparison.projections[index].yearsToFire)}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text variant='caption' color='text.secondary'>
                    FIRE Number
                  </Text>
                  <Text variant='body2' style={styles.metricValue}>
                    {formatCurrency(comparison.projections[index].fireNumber)}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text variant='caption' color='text.secondary'>
                    Success Rate
                  </Text>
                  <Text variant='body2' style={styles.metricValue}>
                    {formatPercentage(
                      comparison.projections[index].successProbability
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Best Scenarios */}
        <Card style={styles.section}>
          <Text variant='h6' style={styles.sectionTitle}>
            🏆 Best Scenarios
          </Text>

          <View style={styles.bestScenarios}>
            <View style={styles.bestScenarioItem}>
              <Text variant='body2' style={styles.bestScenarioLabel}>
                🚀 Fastest to FIRE
              </Text>
              <Text variant='body2' style={styles.bestScenarioValue}>
                {
                  comparison.scenarios[
                    comparison.analysis.bestScenario.fastest.index
                  ].name
                }
              </Text>
              <Text variant='caption' color='text.secondary'>
                {Math.ceil(
                  comparison.analysis.bestScenario.fastest.yearsToFire
                )}{' '}
                years
              </Text>
            </View>

            <View style={styles.bestScenarioItem}>
              <Text variant='body2' style={styles.bestScenarioLabel}>
                🛡️ Safest Plan
              </Text>
              <Text variant='body2' style={styles.bestScenarioValue}>
                {
                  comparison.scenarios[
                    comparison.analysis.bestScenario.safest.index
                  ].name
                }
              </Text>
              <Text variant='caption' color='text.secondary'>
                {formatPercentage(
                  comparison.analysis.bestScenario.safest.successProbability
                )}{' '}
                success
              </Text>
            </View>

            <View style={styles.bestScenarioItem}>
              <Text variant='body2' style={styles.bestScenarioLabel}>
                ⭐ Overall Best
              </Text>
              <Text variant='body2' style={styles.bestScenarioValue}>
                {
                  comparison.scenarios[
                    comparison.analysis.bestScenario.overall.index
                  ].name
                }
              </Text>
              <Text variant='caption' color='text.secondary'>
                Balanced approach
              </Text>
            </View>
          </View>
        </Card>

        {/* Key Differences */}
        {comparison.analysis.keyDifferences.length > 0 && (
          <Card style={styles.section}>
            <Text variant='h6' style={styles.sectionTitle}>
              🔍 Key Differences
            </Text>

            {comparison.analysis.keyDifferences
              .slice(0, 3)
              .map((diff, index) => (
                <View key={index} style={styles.differenceItem}>
                  <View style={styles.differenceHeader}>
                    <Text variant='body2' style={styles.differenceMetric}>
                      {diff.metric
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())}
                    </Text>
                    <View
                      style={[
                        styles.significanceBadge,
                        {
                          backgroundColor: getSignificanceColor(
                            diff.significance
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.significanceText}>
                        {diff.significance.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    variant='caption'
                    color='text.secondary'
                    style={styles.differenceDescription}
                  >
                    {diff.percentageDifference.toFixed(1)}% difference between
                    scenarios
                  </Text>
                </View>
              ))}
          </Card>
        )}
      </View>
    );
  };

  /**
   * Render detailed analysis
   */
  const renderAnalysis = () => {
    if (!comparison) return null;

    return (
      <View style={styles.tabContent}>
        {/* Risk Analysis */}
        <Card style={styles.section}>
          <Text variant='h6' style={styles.sectionTitle}>
            ⚠️ Risk Analysis
          </Text>

          <View style={styles.riskGrid}>
            {comparison.scenarios.map((scenario, index) => (
              <View key={index} style={styles.riskItem}>
                <Text variant='body2' style={styles.riskScenarioName}>
                  {scenario.name}
                </Text>
                <View
                  style={[
                    styles.riskBadge,
                    {
                      backgroundColor: getRiskColor(
                        comparison.projections[index].riskLevel
                      ),
                    },
                  ]}
                >
                  <Text style={styles.riskText}>
                    {comparison.projections[index].riskLevel.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text variant='body2' style={styles.diversificationScore}>
            Diversification Score:{' '}
            {comparison.analysis.riskAnalysis.diversificationScore.toFixed(0)}%
          </Text>
        </Card>

        {/* Recommendations */}
        {comparison.analysis.recommendations.length > 0 && (
          <Card style={styles.section}>
            <Text variant='h6' style={styles.sectionTitle}>
              💡 Recommendations
            </Text>

            {comparison.analysis.recommendations.map(
              (recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text variant='body2' style={styles.recommendationText}>
                    • {recommendation}
                  </Text>
                </View>
              )
            )}
          </Card>
        )}

        {/* Probability Analysis */}
        <Card style={styles.section}>
          <Text variant='h6' style={styles.sectionTitle}>
            📈 Probability Analysis
          </Text>

          <Text variant='body2' style={styles.probabilityAverage}>
            Average Success Probability:{' '}
            {formatPercentage(
              comparison.analysis.probabilityAnalysis.averageProbability
            )}
          </Text>

          <Text
            variant='caption'
            color='text.secondary'
            style={styles.probabilitySpread}
          >
            Probability Spread:{' '}
            {formatPercentage(
              comparison.analysis.probabilityAnalysis.probabilitySpread
            )}
          </Text>
        </Card>
      </View>
    );
  };

  if (loading || isCreating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant='h6'>Creating Comparison...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!comparison) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text variant='h6'>No Comparison Available</Text>
          <Text
            variant='body2'
            color='text.secondary'
            style={styles.emptyDescription}
          >
            Select 2-5 scenarios to create a comparison
          </Text>
          <Button
            title='Back to Scenarios'
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
          <Text variant='h5' style={styles.title}>
            Scenario Comparison
          </Text>
          <Text variant='caption' color='text.secondary'>
            {comparison.scenarios.length} scenarios • {comparison.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportComparison}
          activeOpacity={0.7}
        >
          <Text style={styles.exportButtonText}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'analysis', label: 'Analysis' },
        ].map(tab => (
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'analysis' && renderAnalysis()}
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyDescription: {
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 20,
  },
  backButton: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: 18,
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
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricColumn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  scenarioName: {
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  metricItem: {
    marginBottom: 8,
    alignItems: 'center',
  },
  metricValue: {
    marginTop: 2,
    fontWeight: '600',
  },
  bestScenarios: {
    gap: 12,
  },
  bestScenarioItem: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  bestScenarioLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  bestScenarioValue: {
    color: '#2196F3',
    marginBottom: 2,
  },
  differenceItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  differenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  differenceMetric: {
    fontWeight: '600',
    flex: 1,
  },
  significanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  significanceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  differenceDescription: {
    lineHeight: 16,
  },
  riskGrid: {
    gap: 8,
    marginBottom: 12,
  },
  riskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 6,
  },
  riskScenarioName: {
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  diversificationScore: {
    textAlign: 'center',
    color: '#2196F3',
    fontWeight: '600',
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    lineHeight: 20,
  },
  probabilityAverage: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  probabilitySpread: {
    textAlign: 'center',
  },
});

export default ScenarioComparisonScreen;
