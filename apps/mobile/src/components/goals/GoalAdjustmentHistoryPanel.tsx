/**
 * GoalAdjustmentHistoryPanel Component
 * Comprehensive goal adjustment history with timeline visualization and pattern analysis
 * Epic 8, Story: Goal Adjustment History Tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FinancialGoal } from '@drishti/shared/types/financial';
import { Button, Card, Icon } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import {
  GoalAdjustmentHistoryService,
  GoalAdjustment,
  AdjustmentTimeline,
  AdjustmentPattern,
  GoalStabilityScore,
  SeasonalRecommendation,
} from '../../services/financial/GoalAdjustmentHistoryService';

interface GoalAdjustmentHistoryPanelProps {
  goal: FinancialGoal;
  onRollback?: (adjustmentId: string) => void;
}

export const GoalAdjustmentHistoryPanel: React.FC<
  GoalAdjustmentHistoryPanelProps
> = ({ goal, onRollback }) => {
  const [timeline, setTimeline] = useState<AdjustmentTimeline | null>(null);
  const [patterns, setPatterns] = useState<AdjustmentPattern[]>([]);
  const [stabilityScore, setStabilityScore] =
    useState<GoalStabilityScore | null>(null);
  const [seasonalRecs, setSeasonalRecs] = useState<SeasonalRecommendation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'timeline' | 'patterns' | 'stability' | 'seasonal'
  >('timeline');

  const historyService = GoalAdjustmentHistoryService.getInstance();
  const { buttonTap } = useHaptic();

  useEffect(() => {
    loadHistoryData();
  }, [goal.id]);

  const loadHistoryData = async () => {
    try {
      setIsLoading(true);

      const [timelineData, patternsData, stabilityData, seasonalData] =
        await Promise.all([
          historyService.generateAdjustmentTimeline(goal.id, goal),
          historyService.analyzeAdjustmentPatterns(goal.id),
          historyService.calculateStabilityScore(goal.id),
          historyService.getSeasonalRecommendations(goal.id),
        ]);

      setTimeline(timelineData);
      setPatterns(patternsData);
      setStabilityScore(stabilityData);
      setSeasonalRecs(seasonalData);
    } catch (error) {
      console.error('Failed to load adjustment history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabPress = async (tab: typeof activeTab) => {
    await buttonTap();
    setActiveTab(tab);
  };

  const handleRollback = async (adjustmentId: string) => {
    const canRollback = await historyService.canRollback(adjustmentId);

    if (!canRollback) {
      Alert.alert(
        'Cannot Rollback',
        'This adjustment cannot be rolled back. It may be too old or not reversible.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Rollback Adjustment',
      'Are you sure you want to rollback this adjustment? This will restore the previous values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback',
          style: 'destructive',
          onPress: async () => {
            await buttonTap();
            const success =
              await historyService.rollbackAdjustment(adjustmentId);

            if (success) {
              onRollback?.(adjustmentId);
              await loadHistoryData(); // Refresh data
              Alert.alert('Success', 'Adjustment has been rolled back.');
            } else {
              Alert.alert('Error', 'Failed to rollback adjustment.');
            }
          },
        },
      ]
    );
  };

  const getSeverityColor = (severity: GoalAdjustment['severity']): string => {
    switch (severity) {
      case 'critical':
        return '#DC3545';
      case 'major':
        return '#FD7E14';
      case 'moderate':
        return '#FFC107';
      case 'minor':
        return '#28A745';
      default:
        return '#6C757D';
    }
  };

  const getStabilityColor = (rating: GoalStabilityScore['rating']): string => {
    switch (rating) {
      case 'very_stable':
        return '#28A745';
      case 'stable':
        return '#20C997';
      case 'moderate':
        return '#FFC107';
      case 'unstable':
        return '#FD7E14';
      case 'very_unstable':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const renderTimelineTab = () => {
    if (!timeline) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trend Analysis */}
        <Card style={styles.trendCard}>
          <Text style={styles.cardTitle}>Goal Evolution Trend</Text>

          <View style={styles.trendHeader}>
            <View style={styles.trendDirection}>
              <Icon
                name={
                  timeline.trendAnalysis.direction === 'improving'
                    ? 'trending-up'
                    : timeline.trendAnalysis.direction === 'declining'
                      ? 'trending-down'
                      : 'minus'
                }
                size={24}
                color={
                  timeline.trendAnalysis.direction === 'improving'
                    ? '#28A745'
                    : timeline.trendAnalysis.direction === 'declining'
                      ? '#DC3545'
                      : '#6C757D'
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      timeline.trendAnalysis.direction === 'improving'
                        ? '#28A745'
                        : timeline.trendAnalysis.direction === 'declining'
                          ? '#DC3545'
                          : '#6C757D',
                  },
                ]}
              >
                {timeline.trendAnalysis.direction.charAt(0).toUpperCase() +
                  timeline.trendAnalysis.direction.slice(1)}
              </Text>
            </View>

            <Text style={styles.confidenceText}>
              {timeline.trendAnalysis.confidence}% confidence
            </Text>
          </View>

          <Text style={styles.trendDescription}>
            Velocity: {timeline.trendAnalysis.velocity.toFixed(1)}{' '}
            months/adjustment
          </Text>
        </Card>

        {/* Timeline */}
        <Card style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Adjustment Timeline</Text>

          <View style={styles.timelineContainer}>
            {timeline.milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneItem}>
                <View style={styles.milestoneMarker}>
                  <View
                    style={[
                      styles.milestoneIcon,
                      {
                        backgroundColor:
                          milestone.type === 'creation'
                            ? '#007AFF'
                            : milestone.type === 'major_adjustment'
                              ? '#FD7E14'
                              : '#28A745',
                      },
                    ]}
                  />
                  {index < timeline.milestones.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <Text style={styles.milestoneDate}>
                    {new Date(milestone.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.milestoneDescription}>
                    {milestone.description}
                  </Text>
                  {milestone.impact && (
                    <Text style={styles.milestoneImpact}>
                      {milestone.impact}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Recent Adjustments */}
        {timeline.adjustments.length > 0 && (
          <Card style={styles.adjustmentsCard}>
            <Text style={styles.cardTitle}>Recent Adjustments</Text>

            {timeline.adjustments.slice(0, 5).map((adjustment, index) => (
              <View key={adjustment.id} style={styles.adjustmentItem}>
                <View style={styles.adjustmentHeader}>
                  <View style={styles.adjustmentInfo}>
                    <Text style={styles.adjustmentType}>
                      {adjustment.adjustmentType
                        .replace('_', ' ')
                        .toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: getSeverityColor(
                            adjustment.severity
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.severityText}>
                        {adjustment.severity}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.adjustmentDate}>
                    {new Date(adjustment.timestamp).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.adjustmentReason}>{adjustment.reason}</Text>

                <View style={styles.adjustmentImpact}>
                  <Text style={styles.impactText}>
                    Timeline:{' '}
                    {adjustment.impactAnalysis.timelineChange > 0 ? '+' : ''}
                    {adjustment.impactAnalysis.timelineChange} months
                  </Text>
                  <Text style={styles.impactText}>
                    Feasibility:{' '}
                    {adjustment.impactAnalysis.feasibilityChange > 0 ? '+' : ''}
                    {adjustment.impactAnalysis.feasibilityChange}%
                  </Text>
                </View>

                {adjustment.reversible && (
                  <TouchableOpacity
                    style={styles.rollbackButton}
                    onPress={() => handleRollback(adjustment.id)}
                  >
                    <Icon name='undo' size={16} color='#007AFF' />
                    <Text style={styles.rollbackText}>Rollback</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    );
  };

  const renderPatternsTab = () => {
    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabDescription}>
          Analysis of your adjustment patterns to help improve future planning
        </Text>

        {patterns.length === 0 ? (
          <Card style={styles.noPatternsCard}>
            <Icon
              name='bar-chart'
              size={48}
              color='#6C757D'
              style={styles.noPatternsIcon}
            />
            <Text style={styles.noPatternsTitle}>No Patterns Detected</Text>
            <Text style={styles.noPatternsText}>
              Make a few more adjustments to see pattern analysis. This helps
              identify trends in your goal management.
            </Text>
          </Card>
        ) : (
          patterns.map((pattern, index) => (
            <Card key={index} style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternTitle}>
                  {pattern.patternType.replace('_', ' ').toUpperCase()} Pattern
                </Text>
                <Text
                  style={[
                    styles.patternConfidence,
                    {
                      color:
                        pattern.confidence > 70
                          ? '#28A745'
                          : pattern.confidence > 50
                            ? '#FFC107'
                            : '#DC3545',
                    },
                  ]}
                >
                  {pattern.confidence.toFixed(0)}% confidence
                </Text>
              </View>

              <Text style={styles.patternDescription}>
                {pattern.description}
              </Text>

              <View style={styles.patternMetrics}>
                <View style={styles.patternMetric}>
                  <Text style={styles.metricLabel}>Frequency</Text>
                  <Text style={styles.metricValue}>
                    {pattern.frequency.toFixed(1)}/year
                  </Text>
                </View>
                <View style={styles.patternMetric}>
                  <Text style={styles.metricLabel}>Avg Impact</Text>
                  <Text style={styles.metricValue}>
                    {pattern.averageImpact.toFixed(1)} months
                  </Text>
                </View>
              </View>

              <View style={styles.patternRecommendations}>
                <Text style={styles.recommendationsTitle}>
                  Recommendations:
                </Text>
                {pattern.recommendations.map((rec, recIndex) => (
                  <Text key={recIndex} style={styles.recommendationText}>
                    • {rec}
                  </Text>
                ))}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    );
  };

  const renderStabilityTab = () => {
    if (!stabilityScore) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabDescription}>
          Your goal stability score based on adjustment frequency and
          consistency
        </Text>

        <Card style={styles.stabilityCard}>
          <Text style={styles.cardTitle}>Goal Stability Score</Text>

          <View style={styles.stabilityHeader}>
            <Text
              style={[
                styles.stabilityScore,
                { color: getStabilityColor(stabilityScore.rating) },
              ]}
            >
              {stabilityScore.score}
            </Text>
            <Text
              style={[
                styles.stabilityRating,
                { color: getStabilityColor(stabilityScore.rating) },
              ]}
            >
              {stabilityScore.rating.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          <View style={styles.stabilityBar}>
            <View
              style={[
                styles.stabilityFill,
                {
                  width: `${stabilityScore.score}%`,
                  backgroundColor: getStabilityColor(stabilityScore.rating),
                },
              ]}
            />
          </View>
        </Card>

        {/* Stability Factors */}
        <Card style={styles.factorsCard}>
          <Text style={styles.cardTitle}>Stability Factors</Text>

          {stabilityScore.factors.map((factor, index) => (
            <View key={index} style={styles.factorItem}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>{factor.factor}</Text>
                <Text
                  style={[
                    styles.factorImpact,
                    { color: factor.impact > 0 ? '#28A745' : '#DC3545' },
                  ]}
                >
                  {factor.impact > 0 ? '+' : ''}
                  {factor.impact}
                </Text>
              </View>
              <Text style={styles.factorDescription}>{factor.description}</Text>
            </View>
          ))}
        </Card>

        {/* Improvement Suggestions */}
        {stabilityScore.improvementSuggestions.length > 0 && (
          <Card style={styles.suggestionsCard}>
            <Text style={styles.cardTitle}>Improvement Suggestions</Text>

            {stabilityScore.improvementSuggestions.map((suggestion, index) => (
              <Text key={index} style={styles.suggestionText}>
                💡 {suggestion}
              </Text>
            ))}
          </Card>
        )}
      </ScrollView>
    );
  };

  const renderSeasonalTab = () => {
    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tabDescription}>
          Seasonal recommendations based on historical patterns and optimal
          timing
        </Text>

        {seasonalRecs.length === 0 ? (
          <Card style={styles.noSeasonalCard}>
            <Icon
              name='calendar'
              size={48}
              color='#6C757D'
              style={styles.noSeasonalIcon}
            />
            <Text style={styles.noSeasonalTitle}>
              No Current Recommendations
            </Text>
            <Text style={styles.noSeasonalText}>
              Check back throughout the year for seasonal adjustment
              recommendations.
            </Text>
          </Card>
        ) : (
          seasonalRecs.map((rec, index) => (
            <Card key={index} style={styles.seasonalCard}>
              <View style={styles.seasonalHeader}>
                <Text style={styles.seasonalTitle}>
                  {rec.season.charAt(0).toUpperCase() + rec.season.slice(1)}{' '}
                  Recommendation
                </Text>
                <Text style={styles.seasonalSuccess}>
                  {rec.historicalSuccess}% success rate
                </Text>
              </View>

              <Text style={styles.seasonalType}>
                {rec.recommendationType.replace('_', ' ').toUpperCase()}
              </Text>

              <Text style={styles.seasonalReasoning}>{rec.reasoning}</Text>

              <View style={styles.seasonalImpact}>
                <Text style={styles.impactLabel}>Estimated Impact:</Text>
                <Text
                  style={[
                    styles.impactValue,
                    { color: rec.estimatedImpact < 0 ? '#28A745' : '#DC3545' },
                  ]}
                >
                  {rec.estimatedImpact > 0 ? '+' : ''}
                  {rec.estimatedImpact} months
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <Card style={styles.loadingCard}>
        <Text style={styles.loadingText}>Loading adjustment history...</Text>
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
            { key: 'timeline', label: 'Timeline' },
            { key: 'patterns', label: 'Patterns' },
            { key: 'stability', label: 'Stability' },
            { key: 'seasonal', label: 'Seasonal' },
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
        {activeTab === 'timeline' && renderTimelineTab()}
        {activeTab === 'patterns' && renderPatternsTab()}
        {activeTab === 'stability' && renderStabilityTab()}
        {activeTab === 'seasonal' && renderSeasonalTab()}
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
  trendCard: {
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6C757D',
  },
  trendDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  timelineCard: {
    padding: 20,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  milestoneMarker: {
    alignItems: 'center',
    marginRight: 16,
  },
  milestoneIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E9ECEF',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  milestoneDate: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 4,
  },
  milestoneImpact: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  adjustmentsCard: {
    padding: 20,
  },
  adjustmentItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  adjustmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adjustmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustmentType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  adjustmentDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  adjustmentReason: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    lineHeight: 18,
  },
  adjustmentImpact: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  impactText: {
    fontSize: 12,
    color: '#6C757D',
  },
  rollbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  rollbackText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  noPatternsCard: {
    padding: 40,
    alignItems: 'center',
  },
  noPatternsIcon: {
    marginBottom: 16,
  },
  noPatternsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  noPatternsText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  patternCard: {
    padding: 20,
    marginBottom: 16,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  patternConfidence: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    lineHeight: 18,
  },
  patternMetrics: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  patternMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  patternRecommendations: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 4,
  },
  stabilityCard: {
    padding: 20,
    marginBottom: 16,
  },
  stabilityHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stabilityScore: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stabilityRating: {
    fontSize: 16,
    fontWeight: '600',
  },
  stabilityBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  factorsCard: {
    padding: 20,
    marginBottom: 16,
  },
  factorItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  factorImpact: {
    fontSize: 14,
    fontWeight: '600',
  },
  factorDescription: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
  },
  suggestionsCard: {
    padding: 20,
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  noSeasonalCard: {
    padding: 40,
    alignItems: 'center',
  },
  noSeasonalIcon: {
    marginBottom: 16,
  },
  noSeasonalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  noSeasonalText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  seasonalCard: {
    padding: 20,
    marginBottom: 16,
  },
  seasonalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seasonalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  seasonalSuccess: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '600',
  },
  seasonalType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  seasonalReasoning: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 12,
  },
  seasonalImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  impactLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  impactValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GoalAdjustmentHistoryPanel;
