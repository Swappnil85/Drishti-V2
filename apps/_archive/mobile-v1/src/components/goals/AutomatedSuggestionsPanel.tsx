/**
 * AutomatedSuggestionsPanel Component
 * Display automated adjustment suggestions with ML predictions
 * Epic 8, Enhanced Story: Goal Adjustment with Automated Suggestions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  FinancialGoal,
  FIREGoalProgress,
} from '@drishti/shared/types/financial';
import { Button, Card, Icon } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import {
  AutomatedAdjustmentService,
  AutomatedAdjustmentSuggestion,
} from '../../services/financial/AutomatedAdjustmentService';
import {
  LifeEventImpactModelingService,
  UserProfile,
} from '../../services/financial/LifeEventImpactModelingService';

interface AutomatedSuggestionsPanelProps {
  goal: FinancialGoal;
  progress: FIREGoalProgress;
  userProfile: UserProfile;
  spendingHistory: Array<{
    date: string;
    category: string;
    amount: number;
    isRecurring: boolean;
  }>;
  onSuggestionApplied?: (suggestion: AutomatedAdjustmentSuggestion) => void;
  onSuggestionDismissed?: (suggestionId: string) => void;
}

export const AutomatedSuggestionsPanel: React.FC<
  AutomatedSuggestionsPanelProps
> = ({
  goal,
  progress,
  userProfile,
  spendingHistory,
  onSuggestionApplied,
  onSuggestionDismissed,
}) => {
  const [suggestions, setSuggestions] = useState<
    AutomatedAdjustmentSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(
    null
  );

  const automatedAdjustmentService = AutomatedAdjustmentService.getInstance();
  const lifeEventService = LifeEventImpactModelingService.getInstance();
  const { buttonTap, successFeedback, errorFeedback } = useHaptic();

  useEffect(() => {
    loadSuggestions();
  }, [goal.id, progress.progressPercentage]);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);

      const newSuggestions =
        await automatedAdjustmentService.generateAdjustmentSuggestions(
          goal,
          progress,
          userProfile,
          spendingHistory
        );

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      Alert.alert('Error', 'Failed to load adjustment suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSuggestions();
    setIsRefreshing(false);
  };

  const handleApplySuggestion = async (
    suggestion: AutomatedAdjustmentSuggestion
  ) => {
    await buttonTap();

    if (suggestion.automationPossible) {
      Alert.alert(
        'Apply Suggestion',
        `This will automatically ${suggestion.title.toLowerCase()}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply',
            style: 'default',
            onPress: async () => {
              try {
                const result =
                  await automatedAdjustmentService.executeAutomatedAdjustment(
                    suggestion.id,
                    goal,
                    true
                  );

                if (result.success) {
                  await successFeedback();
                  onSuggestionApplied?.(suggestion);
                  // Remove applied suggestion
                  setSuggestions(prev =>
                    prev.filter(s => s.id !== suggestion.id)
                  );
                } else {
                  await errorFeedback();
                  Alert.alert(
                    'Error',
                    result.error || 'Failed to apply suggestion'
                  );
                }
              } catch (error) {
                await errorFeedback();
                Alert.alert('Error', 'Failed to apply suggestion');
              }
            },
          },
        ]
      );
    } else {
      // Show manual implementation steps
      Alert.alert(
        suggestion.title,
        'This suggestion requires manual implementation. Would you like to see the steps?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Show Steps',
            onPress: () => setExpandedSuggestion(suggestion.id),
          },
        ]
      );
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    await buttonTap();

    Alert.alert(
      'Dismiss Suggestion',
      'Are you sure you want to dismiss this suggestion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: () => {
            setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
            onSuggestionDismissed?.(suggestionId);
          },
        },
      ]
    );
  };

  const getPriorityColor = (
    priority: AutomatedAdjustmentSuggestion['priority']
  ): string => {
    switch (priority) {
      case 'critical':
        return '#DC3545';
      case 'high':
        return '#FD7E14';
      case 'medium':
        return '#FFC107';
      case 'low':
        return '#28A745';
      default:
        return '#6C757D';
    }
  };

  const getPriorityIcon = (
    priority: AutomatedAdjustmentSuggestion['priority']
  ): string => {
    switch (priority) {
      case 'critical':
        return 'alert-triangle';
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'info';
      case 'low':
        return 'check-circle';
      default:
        return 'help-circle';
    }
  };

  const getTypeIcon = (type: AutomatedAdjustmentSuggestion['type']): string => {
    switch (type) {
      case 'contribution_increase':
        return 'trending-up';
      case 'contribution_decrease':
        return 'trending-down';
      case 'timeline_adjustment':
        return 'clock';
      case 'expense_optimization':
        return 'scissors';
      case 'goal_restructure':
        return 'shuffle';
      default:
        return 'settings';
    }
  };

  const renderSuggestion = (suggestion: AutomatedAdjustmentSuggestion) => {
    const isExpanded = expandedSuggestion === suggestion.id;

    return (
      <Card key={suggestion.id} style={styles.suggestionCard}>
        <View style={styles.suggestionHeader}>
          <View style={styles.suggestionTitleRow}>
            <Icon
              name={getTypeIcon(suggestion.type)}
              size={20}
              color='#007AFF'
              style={styles.typeIcon}
            />
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(suggestion.priority) },
              ]}
            >
              <Icon
                name={getPriorityIcon(suggestion.priority)}
                size={12}
                color='#FFFFFF'
              />
            </View>
          </View>

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence: </Text>
            <Text
              style={[
                styles.confidenceValue,
                {
                  color:
                    suggestion.confidence > 80
                      ? '#28A745'
                      : suggestion.confidence > 60
                        ? '#FFC107'
                        : '#DC3545',
                },
              ]}
            >
              {suggestion.confidence}%
            </Text>
          </View>
        </View>

        <Text style={styles.suggestionDescription}>
          {suggestion.description}
        </Text>

        {/* Expected Impact */}
        <View style={styles.impactSection}>
          <Text style={styles.impactTitle}>Expected Impact:</Text>
          <View style={styles.impactGrid}>
            <View style={styles.impactItem}>
              <Text style={styles.impactLabel}>Timeline</Text>
              <Text
                style={[
                  styles.impactValue,
                  {
                    color:
                      suggestion.expectedImpact.timelineDelta < 0
                        ? '#28A745'
                        : '#DC3545',
                  },
                ]}
              >
                {suggestion.expectedImpact.timelineDelta > 0 ? '+' : ''}
                {suggestion.expectedImpact.timelineDelta} months
              </Text>
            </View>

            <View style={styles.impactItem}>
              <Text style={styles.impactLabel}>Contribution</Text>
              <Text
                style={[
                  styles.impactValue,
                  {
                    color:
                      suggestion.expectedImpact.contributionDelta > 0
                        ? '#28A745'
                        : '#DC3545',
                  },
                ]}
              >
                {suggestion.expectedImpact.contributionDelta > 0 ? '+' : ''}$
                {suggestion.expectedImpact.contributionDelta}/mo
              </Text>
            </View>
          </View>
        </View>

        {/* Reasoning */}
        <View style={styles.reasoningSection}>
          <Text style={styles.reasoningTitle}>Why this suggestion:</Text>
          {suggestion.reasoning.map((reason, index) => (
            <Text key={index} style={styles.reasoningItem}>
              • {reason}
            </Text>
          ))}
        </View>

        {/* Implementation Steps (if expanded) */}
        {isExpanded && (
          <View style={styles.implementationSection}>
            <Text style={styles.implementationTitle}>
              Implementation Steps:
            </Text>
            {suggestion.implementationSteps.map((step, index) => (
              <View key={index} style={styles.implementationStep}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.stepTitle}>{step.step}</Text>
                </View>
                <Text style={styles.stepDetails}>
                  Time: {step.timeRequired} • Difficulty: {step.difficulty}
                </Text>
                {step.prerequisites.length > 0 && (
                  <Text style={styles.stepPrerequisites}>
                    Prerequisites: {step.prerequisites.join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.suggestionActions}>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() =>
              setExpandedSuggestion(isExpanded ? null : suggestion.id)
            }
          >
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color='#6C757D'
            />
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Less' : 'More'} Details
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => handleDismissSuggestion(suggestion.id)}
            >
              <Icon name='x' size={16} color='#6C757D' />
            </TouchableOpacity>

            <Button
              title={suggestion.automationPossible ? 'Apply' : 'View Steps'}
              onPress={() => handleApplySuggestion(suggestion)}
              style={[
                styles.applyButton,
                {
                  backgroundColor: suggestion.automationPossible
                    ? '#28A745'
                    : '#007AFF',
                },
              ]}
              size='small'
            />
          </View>
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card style={styles.loadingCard}>
        <Text style={styles.loadingText}>
          Analyzing your goal and generating suggestions...
        </Text>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Icon
          name='check-circle'
          size={48}
          color='#28A745'
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>All Good!</Text>
        <Text style={styles.emptyDescription}>
          Your FIRE goal is on track. We'll notify you if any adjustments are
          recommended.
        </Text>
        <Button
          title='Refresh Analysis'
          onPress={handleRefresh}
          variant='outline'
          style={styles.refreshButton}
        />
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Suggestions</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered recommendations based on your spending patterns and goal
          progress
        </Text>
      </View>

      <ScrollView
        style={styles.suggestionsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {suggestions.map(renderSuggestion)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
  },
  suggestionsList: {
    flex: 1,
    paddingHorizontal: 20,
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
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    margin: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    minWidth: 120,
  },
  suggestionCard: {
    padding: 20,
    marginBottom: 16,
  },
  suggestionHeader: {
    marginBottom: 12,
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    marginRight: 8,
  },
  suggestionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 16,
  },
  impactSection: {
    marginBottom: 16,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  impactItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasoningSection: {
    marginBottom: 16,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  reasoningItem: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 4,
  },
  implementationSection: {
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  implementationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  implementationStep: {
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 8,
  },
  stepTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#212529',
  },
  stepDetails: {
    fontSize: 11,
    color: '#6C757D',
    marginLeft: 28,
    marginBottom: 2,
  },
  stepPrerequisites: {
    fontSize: 11,
    color: '#6C757D',
    marginLeft: 28,
    fontStyle: 'italic',
  },
  suggestionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#6C757D',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dismissButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  applyButton: {
    minWidth: 80,
  },
});

export default AutomatedSuggestionsPanel;
