/**
 * Recommendations Screen
 * Display and manage personalized FIRE recommendations
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Flex, Icon, LoadingState } from '../../components/ui';
import { useProfile } from '../../contexts/ProfileContext';
import { useHaptic } from '../../hooks/useHaptic';
import { PersonalizedRecommendation } from '../../types/profile';

const RecommendationsScreen: React.FC = () => {
  const {
    recommendations,
    acceptRecommendation,
    dismissRecommendation,
    generateRecommendations,
    loading,
  } = useProfile();
  
  const { buttonTap, successFeedback, achievement } = useHaptic();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter active recommendations
  const activeRecommendations = recommendations.filter(rec => !rec.dismissed && !rec.accepted);
  const acceptedRecommendations = recommendations.filter(rec => rec.accepted);
  const dismissedRecommendations = recommendations.filter(rec => rec.dismissed);

  const handleAcceptRecommendation = async (recommendation: PersonalizedRecommendation) => {
    try {
      setProcessingId(recommendation.id);
      await buttonTap();
      
      await acceptRecommendation(recommendation.id);
      await achievement();
      
      Alert.alert(
        'Recommendation Accepted',
        `Great choice! "${recommendation.title}" has been added to your action plan.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to accept recommendation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissRecommendation = async (recommendation: PersonalizedRecommendation) => {
    Alert.alert(
      'Dismiss Recommendation',
      `Are you sure you want to dismiss "${recommendation.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(recommendation.id);
              await dismissRecommendation(recommendation.id);
              await successFeedback();
            } catch (error) {
              Alert.alert('Error', 'Failed to dismiss recommendation');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRefreshRecommendations = async () => {
    try {
      setRefreshing(true);
      await generateRecommendations();
      await successFeedback();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
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

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'high': return 'alert-circle';
      case 'medium': return 'warning';
      case 'low': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const renderRecommendation = (recommendation: PersonalizedRecommendation, showActions: boolean = true) => (
    <Card key={recommendation.id} variant="outlined" padding="lg" style={styles.recommendationCard}>
      {/* Header */}
      <Flex direction="row" align="flex-start" justify="space-between" style={styles.recommendationHeader}>
        <View style={styles.recommendationInfo}>
          <Flex direction="row" align="center" style={styles.titleRow}>
            <Icon 
              name={getPriorityIcon(recommendation.priority)} 
              size="sm" 
              color={getPriorityColor(recommendation.priority)}
              style={styles.priorityIcon}
            />
            <Text variant="body1" weight="semiBold" style={styles.recommendationTitle}>
              {recommendation.title}
            </Text>
          </Flex>
          
          <Text variant="caption" color={getPriorityColor(recommendation.priority)} style={styles.priority}>
            {recommendation.priority.toUpperCase()} PRIORITY
          </Text>
        </View>
        
        <Text variant="caption" color="text.secondary">
          {Math.round(recommendation.confidence * 100)}% confidence
        </Text>
      </Flex>

      {/* Description */}
      <Text variant="body2" color="text.secondary" style={styles.description}>
        {recommendation.description}
      </Text>

      {/* Rationale */}
      <View style={styles.rationale}>
        <Text variant="caption" color="text.tertiary" weight="medium">WHY THIS MATTERS</Text>
        <Text variant="body2" color="text.secondary" style={styles.rationaleText}>
          {recommendation.rationale}
        </Text>
      </View>

      {/* Impact */}
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
            
            {recommendation.impact.riskReduction && (
              <View style={styles.impactItem}>
                <Text variant="caption" color="text.secondary">Risk Reduction</Text>
                <Text variant="body2" weight="medium" color="info.500">
                  {Math.round(recommendation.impact.riskReduction * 100)}%
                </Text>
              </View>
            )}
          </Flex>
        </View>
      )}

      {/* Action Steps */}
      {recommendation.actionSteps.length > 0 && (
        <View style={styles.actionSteps}>
          <Text variant="caption" color="text.tertiary" weight="medium">ACTION STEPS</Text>
          {recommendation.actionSteps.map((step, index) => (
            <Flex key={index} direction="row" align="flex-start" style={styles.actionStep}>
              <Text variant="body2" color="primary.500" style={styles.stepNumber}>
                {index + 1}.
              </Text>
              <Text variant="body2" color="text.secondary" style={styles.stepText}>
                {step}
              </Text>
            </Flex>
          ))}
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <Flex direction="row" gap="md" style={styles.actions}>
          <Button
            variant="primary"
            size="md"
            onPress={() => handleAcceptRecommendation(recommendation)}
            loading={processingId === recommendation.id}
            disabled={!!processingId}
            style={styles.actionButton}
          >
            Accept
          </Button>
          
          <Button
            variant="outline"
            size="md"
            onPress={() => handleDismissRecommendation(recommendation)}
            loading={processingId === recommendation.id}
            disabled={!!processingId}
            style={styles.actionButton}
          >
            Dismiss
          </Button>
        </Flex>
      )}

      {/* Status for accepted/dismissed */}
      {!showActions && (
        <View style={styles.status}>
          {recommendation.accepted && (
            <Flex direction="row" align="center">
              <Icon name="checkmark-circle" size="sm" color="success.500" />
              <Text variant="caption" color="success.500" style={styles.statusText}>
                Accepted
              </Text>
            </Flex>
          )}
          
          {recommendation.dismissed && (
            <Flex direction="row" align="center">
              <Icon name="close-circle" size="sm" color="text.secondary" />
              <Text variant="caption" color="text.secondary" style={styles.statusText}>
                Dismissed
              </Text>
            </Flex>
          )}
        </View>
      )}
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading recommendations..." size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h5" weight="bold">Personalized Recommendations</Text>
          <Text variant="body2" color="text.secondary" style={styles.subtitle}>
            AI-powered suggestions to optimize your FIRE journey
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
              Refresh
            </Text>
          </Button>
        </View>

        {/* Active Recommendations */}
        {activeRecommendations.length > 0 ? (
          <View style={styles.section}>
            <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
              New Recommendations ({activeRecommendations.length})
            </Text>
            {activeRecommendations.map(rec => renderRecommendation(rec, true))}
          </View>
        ) : (
          <Card variant="filled" padding="lg" style={styles.emptyCard}>
            <Flex direction="column" align="center">
              <Icon name="checkmark-circle" size="xl" color="success.500" />
              <Text variant="h6" weight="semiBold" style={styles.emptyTitle}>
                All Caught Up!
              </Text>
              <Text variant="body2" color="text.secondary" align="center" style={styles.emptyMessage}>
                You've reviewed all current recommendations. Check back later for new suggestions.
              </Text>
            </Flex>
          </Card>
        )}

        {/* Accepted Recommendations */}
        {acceptedRecommendations.length > 0 && (
          <View style={styles.section}>
            <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
              Accepted ({acceptedRecommendations.length})
            </Text>
            {acceptedRecommendations.map(rec => renderRecommendation(rec, false))}
          </View>
        )}

        {/* Dismissed Recommendations */}
        {dismissedRecommendations.length > 0 && (
          <View style={styles.section}>
            <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
              Dismissed ({dismissedRecommendations.length})
            </Text>
            {dismissedRecommendations.slice(0, 3).map(rec => renderRecommendation(rec, false))}
            {dismissedRecommendations.length > 3 && (
              <Text variant="caption" color="text.secondary" align="center" style={styles.moreText}>
                +{dismissedRecommendations.length - 3} more dismissed recommendations
              </Text>
            )}
          </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
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
  titleRow: {
    marginBottom: 4,
  },
  priorityIcon: {
    marginRight: 8,
  },
  recommendationTitle: {
    flex: 1,
  },
  priority: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  rationale: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  rationaleText: {
    marginTop: 4,
    lineHeight: 18,
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
  actionSteps: {
    marginBottom: 16,
  },
  actionStep: {
    marginTop: 8,
  },
  stepNumber: {
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  status: {
    marginTop: 8,
  },
  statusText: {
    marginLeft: 4,
  },
  emptyCard: {
    backgroundColor: '#F0F9FF',
    marginBottom: 24,
  },
  emptyTitle: {
    marginTop: 12,
    marginBottom: 8,
  },
  emptyMessage: {
    lineHeight: 20,
  },
  moreText: {
    marginTop: 8,
  },
});

export default RecommendationsScreen;
