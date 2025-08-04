/**
 * Advanced Recommendations Screen
 * ML-powered recommendations with peer comparisons and implementation tracking
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Flex, Icon, LoadingState, ProgressBar } from '../../components/ui';
import { useProfile } from '../../contexts/ProfileContext';
import { useHaptic } from '../../hooks/useHaptic';
import MLRecommendationsService from '../../services/profile/MLRecommendationsService';
import { PersonalizedRecommendation } from '../../types/profile';

const AdvancedRecommendationsScreen: React.FC = () => {
  const { profile } = useProfile();
  const { buttonTap, successFeedback, achievement } = useHaptic();
  
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const recs = await MLRecommendationsService.generateAdvancedRecommendations(profile);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load advanced recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRecommendations = async () => {
    if (!profile) return;
    
    try {
      setRefreshing(true);
      await buttonTap();
      const recs = await MLRecommendationsService.generateAdvancedRecommendations(profile);
      setRecommendations(recs);
      await successFeedback();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartImplementation = async (recommendation: PersonalizedRecommendation) => {
    try {
      setProcessingId(recommendation.id);
      await buttonTap();
      
      // Update recommendation to mark as started
      const updatedRec = {
        ...recommendation,
        implementationTracking: {
          ...recommendation.implementationTracking!,
          started: true,
          startedAt: Date.now(),
        },
      };
      
      setRecommendations(prev => 
        prev.map(rec => rec.id === recommendation.id ? updatedRec : rec)
      );
      
      await achievement();
      Alert.alert(
        'Implementation Started',
        `You've started implementing "${recommendation.title}". Track your progress in the milestones section.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start implementation');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'error.500';
      case 'medium': return 'warning.500';
      case 'low': return 'info.500';
      default: return 'text.secondary';
    }
  };

  const getMLScoreColor = (score: number): string => {
    if (score >= 0.8) return 'success.500';
    if (score >= 0.6) return 'warning.500';
    return 'error.500';
  };

  const renderRecommendation = (recommendation: PersonalizedRecommendation) => (
    <Card key={recommendation.id} variant="elevated" padding="lg" style={styles.recommendationCard}>
      {/* Header with ML Score */}
      <Flex direction="row" align="flex-start" justify="space-between" style={styles.recommendationHeader}>
        <View style={styles.recommendationInfo}>
          <Text variant="body1" weight="semiBold" style={styles.recommendationTitle}>
            {recommendation.title}
          </Text>
          <Flex direction="row" align="center" style={styles.badges}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) }]}>
              <Text variant="caption" color="white" weight="medium">
                {recommendation.priority.toUpperCase()}
              </Text>
            </View>
            {recommendation.mlScore && (
              <View style={[styles.mlBadge, { backgroundColor: getMLScoreColor(recommendation.mlScore) }]}>
                <Text variant="caption" color="white" weight="medium">
                  ML: {Math.round(recommendation.mlScore * 100)}%
                </Text>
              </View>
            )}
          </Flex>
        </View>
        
        <Text variant="caption" color="text.secondary">
          {Math.round(recommendation.confidence * 100)}% confidence
        </Text>
      </Flex>

      {/* Description */}
      <Text variant="body2" color="text.secondary" style={styles.description}>
        {recommendation.description}
      </Text>

      {/* Peer Comparison */}
      {recommendation.peerComparison && (
        <Card variant="filled" padding="md" style={styles.peerCard}>
          <Text variant="caption" color="text.tertiary" weight="medium">PEER COMPARISON</Text>
          <Flex direction="row" justify="space-between" style={styles.peerMetrics}>
            <View style={styles.peerMetric}>
              <Text variant="body2" weight="bold" color="primary.500">
                {Math.round(recommendation.peerComparison.userPercentile)}th
              </Text>
              <Text variant="caption" color="text.secondary">Your Percentile</Text>
            </View>
            
            <View style={styles.peerMetric}>
              <Text variant="body2" weight="bold">
                {recommendation.peerComparison.category === 'Savings Rate' 
                  ? `${Math.round(recommendation.peerComparison.averageValue * 100)}%`
                  : recommendation.peerComparison.averageValue.toFixed(2)
                }
              </Text>
              <Text variant="caption" color="text.secondary">Peer Average</Text>
            </View>
            
            <View style={styles.peerMetric}>
              <Text variant="body2" weight="bold" color="success.500">
                {recommendation.peerComparison.category === 'Savings Rate' 
                  ? `${Math.round(recommendation.peerComparison.topPercentileValue * 100)}%`
                  : recommendation.peerComparison.topPercentileValue.toFixed(2)
                }
              </Text>
              <Text variant="caption" color="text.secondary">Top 10%</Text>
            </View>
          </Flex>
          <Text variant="caption" color="text.tertiary" style={styles.sampleSize}>
            Based on {recommendation.peerComparison.sampleSize} similar profiles
          </Text>
        </Card>
      )}

      {/* Market Conditions */}
      {recommendation.marketConditions && (
        <Card variant="outlined" padding="md" style={styles.marketCard}>
          <Flex direction="row" align="center" style={styles.marketHeader}>
            <Icon 
              name="trending-up" 
              size="sm" 
              color={recommendation.marketConditions.marketTrend === 'bull' ? 'success.500' : 
                     recommendation.marketConditions.marketTrend === 'bear' ? 'error.500' : 'warning.500'} 
            />
            <Text variant="caption" color="text.tertiary" weight="medium" style={styles.marketTitle}>
              MARKET CONDITIONS
            </Text>
          </Flex>
          <Text variant="body2" color="text.secondary">
            {recommendation.marketConditions.recommendedAdjustment}
          </Text>
          <Text variant="caption" color="text.tertiary">
            Market trend: {recommendation.marketConditions.marketTrend} • 
            Volatility: {Math.round(recommendation.marketConditions.volatilityIndex)}
          </Text>
        </Card>
      )}

      {/* Impact Analysis */}
      {recommendation.impact && (
        <View style={styles.impact}>
          <Text variant="caption" color="text.tertiary" weight="medium">POTENTIAL IMPACT</Text>
          <Flex direction="row" gap="lg" style={styles.impactMetrics}>
            {recommendation.impact.timeToFire && (
              <View style={styles.impactItem}>
                <Text variant="caption" color="text.secondary">Time to FIRE</Text>
                <Text variant="body2" weight="medium" color="success.500">
                  {recommendation.impact.timeToFire.toFixed(1)} years
                </Text>
              </View>
            )}
            
            {recommendation.impact.additionalSavings && (
              <View style={styles.impactItem}>
                <Text variant="caption" color="text.secondary">Additional Savings</Text>
                <Text variant="body2" weight="medium" color="primary.500">
                  {formatCurrency(recommendation.impact.additionalSavings)}
                </Text>
              </View>
            )}
            
            {recommendation.impact.confidenceIncrease && (
              <View style={styles.impactItem}>
                <Text variant="caption" color="text.secondary">Confidence Boost</Text>
                <Text variant="body2" weight="medium" color="info.500">
                  +{Math.round(recommendation.impact.confidenceIncrease * 100)}%
                </Text>
              </View>
            )}
          </Flex>
        </View>
      )}

      {/* Implementation Tracking */}
      {recommendation.implementationTracking && (
        <View style={styles.implementation}>
          <Flex direction="row" align="center" justify="space-between" style={styles.implementationHeader}>
            <Text variant="caption" color="text.tertiary" weight="medium">IMPLEMENTATION PROGRESS</Text>
            <Text variant="caption" color="primary.500">
              {Math.round(recommendation.implementationTracking.progress * 100)}%
            </Text>
          </Flex>
          
          <ProgressBar 
            progress={recommendation.implementationTracking.progress} 
            style={styles.progressBar}
          />
          
          <View style={styles.milestones}>
            {recommendation.implementationTracking.milestones.slice(0, 2).map((milestone, index) => (
              <Flex key={milestone.id} direction="row" align="center" style={styles.milestone}>
                <Icon 
                  name={milestone.completed ? "checkmark-circle" : "ellipse-outline"} 
                  size="sm" 
                  color={milestone.completed ? "success.500" : "text.secondary"}
                  style={styles.milestoneIcon}
                />
                <Text 
                  variant="caption" 
                  color={milestone.completed ? "success.500" : "text.secondary"}
                  style={milestone.completed ? styles.completedMilestone : undefined}
                >
                  {milestone.title}
                </Text>
              </Flex>
            ))}
            {recommendation.implementationTracking.milestones.length > 2 && (
              <Text variant="caption" color="text.tertiary" style={styles.moreMilestones}>
                +{recommendation.implementationTracking.milestones.length - 2} more milestones
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Actions */}
      <Flex direction="row" gap="md" style={styles.actions}>
        {!recommendation.implementationTracking?.started ? (
          <Button
            variant="primary"
            size="md"
            onPress={() => handleStartImplementation(recommendation)}
            loading={processingId === recommendation.id}
            disabled={!!processingId}
            style={styles.actionButton}
          >
            Start Implementation
          </Button>
        ) : (
          <Button
            variant="outline"
            size="md"
            onPress={() => {
              // Navigate to detailed implementation tracking
              Alert.alert('Info', 'Detailed implementation tracking would be implemented here');
            }}
            style={styles.actionButton}
          >
            View Progress
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="md"
          onPress={() => {
            Alert.alert('Info', 'Recommendation details would be shown here');
          }}
          style={styles.actionButton}
        >
          Learn More
        </Button>
      </Flex>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Generating AI recommendations..." size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h5" weight="bold">AI-Powered Recommendations</Text>
          <Text variant="body2" color="text.secondary" style={styles.subtitle}>
            Machine learning insights with peer comparisons and market analysis
          </Text>
          
          <Button
            variant="outline"
            size="sm"
            onPress={handleRefreshRecommendations}
            loading={refreshing}
            style={styles.refreshButton}
          >
            <Icon name="refresh" size="sm" color="primary.500" />
            <Text variant="body2" color="primary.500" style={styles.refreshText}>
              Refresh AI Analysis
            </Text>
          </Button>
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 ? (
          <View style={styles.recommendationsContainer}>
            {recommendations.map(rec => renderRecommendation(rec))}
          </View>
        ) : (
          <Card variant="filled" padding="lg" style={styles.emptyCard}>
            <Flex direction="column" align="center">
              <Icon name="bulb" size="xl" color="primary.500" />
              <Text variant="h6" weight="semiBold" style={styles.emptyTitle}>
                No AI Recommendations Available
              </Text>
              <Text variant="body2" color="text.secondary" align="center" style={styles.emptyMessage}>
                Complete your profile to receive personalized AI-powered recommendations.
              </Text>
            </Flex>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshText: {
    marginLeft: 8,
  },
  recommendationsContainer: {
    gap: 16,
  },
  recommendationCard: {
    marginBottom: 16,
  },
  recommendationHeader: {
    marginBottom: 12,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    marginBottom: 8,
  },
  badges: {
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mlBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  peerCard: {
    backgroundColor: '#F0F9FF',
    marginBottom: 16,
  },
  peerMetrics: {
    marginTop: 8,
    marginBottom: 8,
  },
  peerMetric: {
    alignItems: 'center',
  },
  sampleSize: {
    textAlign: 'center',
  },
  marketCard: {
    marginBottom: 16,
    borderColor: '#E5E7EB',
  },
  marketHeader: {
    marginBottom: 8,
  },
  marketTitle: {
    marginLeft: 8,
  },
  impact: {
    marginBottom: 16,
  },
  impactMetrics: {
    marginTop: 8,
  },
  impactItem: {
    flex: 1,
  },
  implementation: {
    marginBottom: 16,
  },
  implementationHeader: {
    marginBottom: 8,
  },
  progressBar: {
    marginBottom: 12,
  },
  milestones: {
    gap: 4,
  },
  milestone: {
    paddingVertical: 2,
  },
  milestoneIcon: {
    marginRight: 8,
  },
  completedMilestone: {
    textDecorationLine: 'line-through',
  },
  moreMilestones: {
    marginTop: 4,
    textAlign: 'center',
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#F0F9FF',
  },
  emptyTitle: {
    marginTop: 12,
    marginBottom: 8,
  },
  emptyMessage: {
    lineHeight: 20,
  },
});

export default AdvancedRecommendationsScreen;
