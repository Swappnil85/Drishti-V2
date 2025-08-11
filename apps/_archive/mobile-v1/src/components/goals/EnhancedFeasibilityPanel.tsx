/**
 * EnhancedFeasibilityPanel Component
 * Comprehensive feasibility visualization with sensitivity analysis and peer comparison
 * Epic 8, Story: Goal Feasibility Analysis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  FinancialGoal,
  FIREGoalFeasibility,
} from '@drishti/shared/types/financial';
import { Button, Card, Icon } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import {
  EnhancedFeasibilityService,
  EnhancedFeasibilityAnalysis,
  SensitivityAnalysis,
  AlternativeTimeline,
} from '../../services/financial/EnhancedFeasibilityService';

interface EnhancedFeasibilityPanelProps {
  goal: FinancialGoal;
  baseFeasibility: FIREGoalFeasibility;
  onTimelineAdjustment?: (newTimeline: AlternativeTimeline) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const EnhancedFeasibilityPanel: React.FC<
  EnhancedFeasibilityPanelProps
> = ({ goal, baseFeasibility, onTimelineAdjustment }) => {
  const [enhancedAnalysis, setEnhancedAnalysis] =
    useState<EnhancedFeasibilityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'sensitivity' | 'alternatives' | 'peers' | 'risks'
  >('overview');
  const [expandedSensitivity, setExpandedSensitivity] = useState<string | null>(
    null
  );

  const enhancedFeasibilityService = EnhancedFeasibilityService.getInstance();
  const { buttonTap } = useHaptic();

  useEffect(() => {
    loadEnhancedAnalysis();
  }, [goal.id, baseFeasibility.feasibilityScore]);

  const loadEnhancedAnalysis = async () => {
    try {
      setIsLoading(true);
      const analysis = await enhancedFeasibilityService.performEnhancedAnalysis(
        goal,
        baseFeasibility
      );
      setEnhancedAnalysis(analysis);
    } catch (error) {
      console.error('Failed to load enhanced feasibility analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabPress = async (tab: typeof activeTab) => {
    await buttonTap();
    setActiveTab(tab);
  };

  const handleTimelineSelection = async (timeline: AlternativeTimeline) => {
    await buttonTap();
    onTimelineAdjustment?.(timeline);
  };

  const getFeasibilityColor = (score: number): string => {
    if (score >= 80) return '#28A745';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FD7E14';
    return '#DC3545';
  };

  const renderOverviewTab = () => {
    if (!enhancedAnalysis) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Risk-Adjusted Feasibility */}
        <Card style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Risk-Adjusted Analysis</Text>

          <View style={styles.feasibilityComparison}>
            <View style={styles.feasibilityItem}>
              <Text style={styles.feasibilityLabel}>Baseline</Text>
              <Text
                style={[
                  styles.feasibilityScore,
                  {
                    color: getFeasibilityColor(
                      enhancedAnalysis.riskAdjustedAnalysis.baselineFeasibility
                    ),
                  },
                ]}
              >
                {enhancedAnalysis.riskAdjustedAnalysis.baselineFeasibility}%
              </Text>
            </View>

            <Icon name='arrow-right' size={20} color='#6C757D' />

            <View style={styles.feasibilityItem}>
              <Text style={styles.feasibilityLabel}>Risk-Adjusted</Text>
              <Text
                style={[
                  styles.feasibilityScore,
                  {
                    color: getFeasibilityColor(
                      enhancedAnalysis.riskAdjustedAnalysis
                        .riskAdjustedFeasibility
                    ),
                  },
                ]}
              >
                {enhancedAnalysis.riskAdjustedAnalysis.riskAdjustedFeasibility}%
              </Text>
            </View>
          </View>

          <View style={styles.confidenceInterval}>
            <Text style={styles.confidenceLabel}>
              95% Confidence Range:{' '}
              {enhancedAnalysis.riskAdjustedAnalysis.confidenceInterval.lower}%
              - {enhancedAnalysis.riskAdjustedAnalysis.confidenceInterval.upper}
              %
            </Text>
          </View>
        </Card>

        {/* Peer Comparison */}
        <Card style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Peer Comparison</Text>

          <View style={styles.peerMetrics}>
            <View style={styles.peerMetric}>
              <Text style={styles.peerLabel}>Your Percentile</Text>
              <Text style={styles.peerValue}>
                {enhancedAnalysis.peerComparison.peerMetrics.percentileRanking.toFixed(
                  0
                )}
                th
              </Text>
            </View>

            <View style={styles.peerMetric}>
              <Text style={styles.peerLabel}>Peer Average</Text>
              <Text style={styles.peerValue}>
                {
                  enhancedAnalysis.peerComparison.peerMetrics
                    .averageFeasibilityScore
                }
                %
              </Text>
            </View>
          </View>

          <View style={styles.peerInsights}>
            {enhancedAnalysis.peerComparison.insights
              .slice(0, 2)
              .map((insight, index) => (
                <Text key={index} style={styles.peerInsight}>
                  • {insight}
                </Text>
              ))}
          </View>
        </Card>

        {/* Quick Wins */}
        <Card style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Quick Improvement Opportunities</Text>

          {enhancedAnalysis.improvementPlan.quickWins
            .slice(0, 3)
            .map((win, index) => (
              <View key={index} style={styles.quickWin}>
                <View style={styles.quickWinHeader}>
                  <Text style={styles.quickWinAction}>{win.action}</Text>
                  <Text
                    style={[
                      styles.quickWinImprovement,
                      {
                        color: getFeasibilityColor(
                          baseFeasibility.feasibilityScore +
                            win.feasibilityImprovement
                        ),
                      },
                    ]}
                  >
                    +{win.feasibilityImprovement}%
                  </Text>
                </View>
                <Text style={styles.quickWinDetails}>
                  {win.timeToImplement} • {win.difficulty} difficulty
                </Text>
              </View>
            ))}
        </Card>
      </ScrollView>
    );
  };

  const renderSensitivityTab = () => {
    if (!enhancedAnalysis) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabDescription}>
          See how changes to key parameters affect your goal feasibility
        </Text>

        {enhancedAnalysis.sensitivityAnalysis.map((analysis, index) => (
          <Card key={index} style={styles.sensitivityCard}>
            <TouchableOpacity
              style={styles.sensitivityHeader}
              onPress={() =>
                setExpandedSensitivity(
                  expandedSensitivity === analysis.parameter
                    ? null
                    : analysis.parameter
                )
              }
            >
              <Text style={styles.sensitivityTitle}>
                {analysis.parameter.charAt(0).toUpperCase() +
                  analysis.parameter.slice(1)}{' '}
                Sensitivity
              </Text>
              <Icon
                name={
                  expandedSensitivity === analysis.parameter
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={20}
                color='#6C757D'
              />
            </TouchableOpacity>

            {expandedSensitivity === analysis.parameter && (
              <View style={styles.sensitivityContent}>
                <Text style={styles.baseValueText}>
                  Base Value:{' '}
                  {analysis.parameter === 'returns'
                    ? `${(analysis.baseValue * 100).toFixed(1)}%`
                    : analysis.parameter === 'timeline'
                      ? `${analysis.baseValue} years`
                      : `$${analysis.baseValue.toLocaleString()}`}
                </Text>

                {analysis.scenarios.map((scenario, scenarioIndex) => (
                  <View key={scenarioIndex} style={styles.scenarioRow}>
                    <Text style={styles.scenarioChange}>
                      {scenario.change > 0 ? '+' : ''}
                      {scenario.change}%
                    </Text>
                    <Text
                      style={[
                        styles.scenarioFeasibility,
                        {
                          color: getFeasibilityColor(scenario.feasibilityScore),
                        },
                      ]}
                    >
                      {scenario.feasibilityScore}%
                    </Text>
                    <Text style={styles.scenarioImpact}>{scenario.impact}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}
      </ScrollView>
    );
  };

  const renderAlternativesTab = () => {
    if (!enhancedAnalysis) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabDescription}>
          Alternative timelines to improve your goal feasibility
        </Text>

        {enhancedAnalysis.alternativeTimelines.length === 0 ? (
          <Card style={styles.noAlternativesCard}>
            <Icon
              name='check-circle'
              size={48}
              color='#28A745'
              style={styles.noAlternativesIcon}
            />
            <Text style={styles.noAlternativesTitle}>
              Your Timeline Looks Good!
            </Text>
            <Text style={styles.noAlternativesText}>
              Your current timeline appears to be well-balanced. No major
              adjustments are recommended at this time.
            </Text>
          </Card>
        ) : (
          enhancedAnalysis.alternativeTimelines.map((timeline, index) => (
            <Card key={index} style={styles.alternativeCard}>
              <View style={styles.alternativeHeader}>
                <Text style={styles.alternativeTitle}>
                  {timeline.suggestedYears > timeline.originalYears
                    ? 'Extended'
                    : 'Accelerated'}{' '}
                  Timeline
                </Text>
                <Text
                  style={[
                    styles.alternativeImprovement,
                    {
                      color: getFeasibilityColor(
                        baseFeasibility.feasibilityScore +
                          timeline.feasibilityImprovement
                      ),
                    },
                  ]}
                >
                  +{timeline.feasibilityImprovement.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.timelineComparison}>
                <View style={styles.timelineItem}>
                  <Text style={styles.timelineLabel}>Current</Text>
                  <Text style={styles.timelineValue}>
                    {timeline.originalYears} years
                  </Text>
                </View>
                <Icon name='arrow-right' size={16} color='#6C757D' />
                <View style={styles.timelineItem}>
                  <Text style={styles.timelineLabel}>Suggested</Text>
                  <Text style={styles.timelineValue}>
                    {timeline.suggestedYears} years
                  </Text>
                </View>
              </View>

              <Text style={styles.alternativeReasoning}>
                {timeline.reasoning}
              </Text>

              <View style={styles.alternativeDetails}>
                <Text style={styles.detailsTitle}>Benefits:</Text>
                {timeline.benefits.slice(0, 2).map((benefit, benefitIndex) => (
                  <Text key={benefitIndex} style={styles.benefitItem}>
                    • {benefit}
                  </Text>
                ))}
              </View>

              <Button
                title='Apply This Timeline'
                onPress={() => handleTimelineSelection(timeline)}
                style={styles.applyTimelineButton}
                size='small'
              />
            </Card>
          ))
        )}
      </ScrollView>
    );
  };

  const renderPeersTab = () => {
    if (!enhancedAnalysis) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabDescription}>
          Compare your progress with similar users in your demographic
        </Text>

        <Card style={styles.peerCard}>
          <Text style={styles.cardTitle}>Your Demographic</Text>
          <View style={styles.demographicInfo}>
            <Text style={styles.demographicItem}>
              Age: {enhancedAnalysis.peerComparison.userDemographic.ageRange}
            </Text>
            <Text style={styles.demographicItem}>
              Income:{' '}
              {enhancedAnalysis.peerComparison.userDemographic.incomeRange}
            </Text>
            <Text style={styles.demographicItem}>
              Status:{' '}
              {enhancedAnalysis.peerComparison.userDemographic.familyStatus.replace(
                '_',
                ' '
              )}
            </Text>
          </View>
        </Card>

        <Card style={styles.peerCard}>
          <Text style={styles.cardTitle}>Peer Metrics</Text>
          <View style={styles.peerMetricsGrid}>
            <View style={styles.peerMetricCard}>
              <Text style={styles.peerMetricValue}>
                {(
                  enhancedAnalysis.peerComparison.peerMetrics
                    .averageSavingsRate * 100
                ).toFixed(1)}
                %
              </Text>
              <Text style={styles.peerMetricLabel}>Avg Savings Rate</Text>
            </View>
            <View style={styles.peerMetricCard}>
              <Text style={styles.peerMetricValue}>
                {enhancedAnalysis.peerComparison.peerMetrics.averageTimeToFIRE}
              </Text>
              <Text style={styles.peerMetricLabel}>Avg Years to FIRE</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.peerCard}>
          <Text style={styles.cardTitle}>Insights & Recommendations</Text>
          {enhancedAnalysis.peerComparison.insights.map((insight, index) => (
            <Text key={index} style={styles.peerInsightItem}>
              • {insight}
            </Text>
          ))}

          {enhancedAnalysis.peerComparison.recommendations.map((rec, index) => (
            <Text key={index} style={styles.peerRecommendation}>
              💡 {rec}
            </Text>
          ))}
        </Card>
      </ScrollView>
    );
  };

  const renderRisksTab = () => {
    if (!enhancedAnalysis) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabDescription}>
          Potential risks and their impact on your goal feasibility
        </Text>

        <Card style={styles.riskCard}>
          <Text style={styles.cardTitle}>Risk Factors</Text>
          {enhancedAnalysis.riskAdjustedAnalysis.riskFactors.map(
            (risk, index) => (
              <View key={index} style={styles.riskItem}>
                <View style={styles.riskHeader}>
                  <Text style={styles.riskFactor}>{risk.factor}</Text>
                  <View style={styles.riskMetrics}>
                    <Text style={styles.riskProbability}>
                      {(risk.probability * 100).toFixed(0)}%
                    </Text>
                    <Text
                      style={[
                        styles.riskImpact,
                        { color: risk.impact < 0 ? '#DC3545' : '#28A745' },
                      ]}
                    >
                      {risk.impact > 0 ? '+' : ''}
                      {risk.impact}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.riskDescription}>{risk.description}</Text>
                <Text style={styles.riskMitigation}>💡 {risk.mitigation}</Text>
              </View>
            )
          )}
        </Card>

        <Card style={styles.scenarioCard}>
          <Text style={styles.cardTitle}>Scenario Analysis</Text>

          <View style={styles.scenarioItem}>
            <Text style={styles.scenarioTitle}>Best Case</Text>
            <Text style={[styles.scenarioScore, { color: '#28A745' }]}>
              {
                enhancedAnalysis.riskAdjustedAnalysis.bestCaseScenario
                  .feasibilityScore
              }
              %
            </Text>
            <Text style={styles.scenarioDescription}>
              {
                enhancedAnalysis.riskAdjustedAnalysis.bestCaseScenario
                  .description
              }
            </Text>
          </View>

          <View style={styles.scenarioItem}>
            <Text style={styles.scenarioTitle}>Worst Case</Text>
            <Text style={[styles.scenarioScore, { color: '#DC3545' }]}>
              {
                enhancedAnalysis.riskAdjustedAnalysis.worstCaseScenario
                  .feasibilityScore
              }
              %
            </Text>
            <Text style={styles.scenarioDescription}>
              {
                enhancedAnalysis.riskAdjustedAnalysis.worstCaseScenario
                  .description
              }
            </Text>
          </View>
        </Card>
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <Card style={styles.loadingCard}>
        <Text style={styles.loadingText}>
          Performing enhanced feasibility analysis...
        </Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
        >
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'sensitivity', label: 'Sensitivity' },
            { key: 'alternatives', label: 'Alternatives' },
            { key: 'peers', label: 'Peers' },
            { key: 'risks', label: 'Risks' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => handleTabPress(tab.key as typeof activeTab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'sensitivity' && renderSensitivityTab()}
        {activeTab === 'alternatives' && renderAlternativesTab()}
        {activeTab === 'peers' && renderPeersTab()}
        {activeTab === 'risks' && renderRisksTab()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    margin: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  tabNavigation: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tabScrollView: {
    paddingHorizontal: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  tabDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 20,
    lineHeight: 20,
  },
  overviewCard: {
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  feasibilityComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  feasibilityItem: {
    alignItems: 'center',
    flex: 1,
  },
  feasibilityLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  feasibilityScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  confidenceInterval: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  peerMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  peerMetric: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  peerLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  peerValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  peerInsights: {
    gap: 8,
  },
  peerInsight: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
  },
  quickWin: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  quickWinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickWinAction: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  quickWinImprovement: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickWinDetails: {
    fontSize: 12,
    color: '#6C757D',
  },
  sensitivityCard: {
    marginBottom: 16,
  },
  sensitivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sensitivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  sensitivityContent: {
    padding: 16,
    paddingTop: 0,
  },
  baseValueText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  scenarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  scenarioChange: {
    width: 60,
    fontSize: 12,
    fontWeight: '500',
    color: '#212529',
  },
  scenarioFeasibility: {
    width: 60,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  scenarioImpact: {
    flex: 1,
    fontSize: 11,
    color: '#6C757D',
    marginLeft: 8,
  },
  alternativeCard: {
    padding: 20,
    marginBottom: 16,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  alternativeImprovement: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timelineComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  timelineItem: {
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  alternativeReasoning: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    lineHeight: 20,
  },
  alternativeDetails: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 13,
    color: '#28A745',
    marginBottom: 4,
    lineHeight: 18,
  },
  applyTimelineButton: {
    backgroundColor: '#007AFF',
  },
  noAlternativesCard: {
    padding: 40,
    alignItems: 'center',
  },
  noAlternativesIcon: {
    marginBottom: 16,
  },
  noAlternativesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  noAlternativesText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  peerCard: {
    padding: 20,
    marginBottom: 16,
  },
  demographicInfo: {
    gap: 8,
  },
  demographicItem: {
    fontSize: 14,
    color: '#6C757D',
  },
  peerMetricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  peerMetricCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  peerMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  peerMetricLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  peerInsightItem: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    lineHeight: 18,
  },
  peerRecommendation: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
    lineHeight: 18,
  },
  riskCard: {
    padding: 20,
    marginBottom: 16,
  },
  riskItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskFactor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  riskMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  riskProbability: {
    fontSize: 12,
    color: '#6C757D',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskImpact: {
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    lineHeight: 18,
  },
  riskMitigation: {
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 18,
  },
  scenarioCard: {
    padding: 20,
  },
  scenarioItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  scenarioScore: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
  },
});

export default EnhancedFeasibilityPanel;
