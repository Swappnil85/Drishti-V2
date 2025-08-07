/**
 * GoalDetailsScreen Component
 * Enhanced FIRE Goal Details Screen
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
  TouchableOpacity,
} from 'react-native';
import { GoalsStackScreenProps } from '../../types/navigation';
import {
  FinancialGoal,
  FIREGoalMetadata,
  FIREGoalProgress,
  FIREGoalFeasibility,
} from '@drishti/shared/types/financial';
import { FIREGoalService } from '../../services/financial/FIREGoalService';
import { Button, Card, Container, Icon } from '../../components/ui';
import { HapticService } from '../../services/HapticService';
import ProgressVisualization from '../../components/goals/ProgressVisualization';
import MilestoneCelebration from '../../components/goals/MilestoneCelebration';
import GoalAdjustmentWizard from '../../components/goals/GoalAdjustmentWizard';
import GoalSplittingWizard from '../../components/goals/GoalSplittingWizard';
import AutomatedSuggestionsPanel from '../../components/goals/AutomatedSuggestionsPanel';
import EnhancedFeasibilityPanel from '../../components/goals/EnhancedFeasibilityPanel';
import GoalAdjustmentHistoryPanel from '../../components/goals/GoalAdjustmentHistoryPanel';
import { GoalSuspensionService } from '../../services/financial/GoalSuspensionService';
import { UserProfile } from '../../services/financial/LifeEventImpactModelingService';

type Props = GoalsStackScreenProps<'GoalDetails'>;

const GoalDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { goalId } = route.params;
  const [goal, setGoal] = useState<FinancialGoal | null>(null);
  const [progress, setProgress] = useState<FIREGoalProgress | null>(null);
  const [feasibility, setFeasibility] = useState<FIREGoalFeasibility | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'progress' | 'feasibility' | 'suggestions' | 'history'
  >('overview');
  const [showAdjustmentWizard, setShowAdjustmentWizard] = useState(false);
  const [showSplittingWizard, setShowSplittingWizard] = useState(false);

  const fireGoalService = FIREGoalService.getInstance();
  const hapticService = HapticService.getInstance();
  const goalSuspensionService = GoalSuspensionService.getInstance();

  // Mock user profile and spending data (would come from user data in real app)
  const mockUserProfile: UserProfile = {
    age: 32,
    income: 85000,
    expenses: 4500,
    savingsRate: 0.25,
    dependents: 0,
    jobSecurity: 'high',
    industryType: 'technology',
    geographicLocation: 'US',
    riskTolerance: 'moderate',
    previousLifeEvents: [],
  };

  const mockSpendingHistory = [
    {
      date: '2024-01-01',
      category: 'housing',
      amount: 1800,
      isRecurring: true,
    },
    { date: '2024-01-01', category: 'food', amount: 600, isRecurring: false },
    {
      date: '2024-01-01',
      category: 'transportation',
      amount: 400,
      isRecurring: true,
    },
    {
      date: '2024-01-01',
      category: 'entertainment',
      amount: 300,
      isRecurring: false,
    },
    {
      date: '2024-01-01',
      category: 'utilities',
      amount: 200,
      isRecurring: true,
    },
    // More mock data would be here in a real app
  ];

  useEffect(() => {
    loadGoalDetails();
  }, [goalId]);

  const loadGoalDetails = async () => {
    try {
      setIsLoading(true);

      // Load goal from storage
      const goals = await fireGoalService.getGoalsFromStorage();
      const foundGoal = goals.find(g => g.id === goalId);

      if (!foundGoal) {
        Alert.alert('Error', 'Goal not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      setGoal(foundGoal);

      // Calculate progress and feasibility
      const [goalProgress, goalFeasibility] = await Promise.all([
        fireGoalService.calculateGoalProgress(foundGoal),
        fireGoalService.analyzeFeasibility(foundGoal),
      ]);

      setProgress(goalProgress);
      setFeasibility(goalFeasibility);
    } catch (error) {
      console.error('Failed to load goal details:', error);
      Alert.alert('Error', 'Failed to load goal details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGoal = async () => {
    await hapticService.impact('light');
    navigation.navigate('EditGoal', { goalId });
  };

  const handleAdjustGoal = async () => {
    await hapticService.impact('light');
    setShowAdjustmentWizard(true);
  };

  const handleSplitGoal = async () => {
    await hapticService.impact('light');
    setShowSplittingWizard(true);
  };

  const handleAdjustmentComplete = async (
    adjustedGoal: FinancialGoal,
    reason: string
  ) => {
    try {
      // Update the goal with adjustments
      setGoal(adjustedGoal);

      // Recalculate progress and feasibility
      const [updatedProgress, updatedFeasibility] = await Promise.all([
        fireGoalService.calculateGoalProgress(adjustedGoal),
        fireGoalService.analyzeFeasibility(adjustedGoal),
      ]);

      setProgress(updatedProgress);
      setFeasibility(updatedFeasibility);

      Alert.alert(
        'Goal Adjusted',
        `Your goal has been successfully adjusted. Reason: ${reason}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to update adjusted goal:', error);
      Alert.alert('Error', 'Failed to save goal adjustments.');
    }
  };

  const handleSplitComplete = async (
    newGoals: FinancialGoal[],
    splitStrategy: string
  ) => {
    try {
      // In a real implementation, these would be saved to the backend
      Alert.alert(
        'Goal Split Complete',
        `Your goal has been split into ${newGoals.length} new goals using ${splitStrategy} strategy.`,
        [
          {
            text: 'View Goals',
            onPress: () => navigation.navigate('GoalsList'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save split goals:', error);
      Alert.alert('Error', 'Failed to save split goals.');
    }
  };

  const handleTabPress = async (tab: typeof activeTab) => {
    await hapticService.impact('light');
    setActiveTab(tab);
  };

  if (isLoading || !goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading goal details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const metadata = goal.metadata as FIREGoalMetadata;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <View style={styles.goalTypeContainer}>
              <Text style={styles.goalType}>
                {getFIRETypeDisplayName(metadata.fireType)}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAdjustGoal}
            >
              <Icon name='settings' size={20} color='#007AFF' />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSplitGoal}
            >
              <Icon name='git-branch' size={20} color='#007AFF' />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditGoal}
            >
              <Icon name='edit' size={20} color='#007AFF' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Overview */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress Overview</Text>
            {progress && (
              <Text style={styles.progressPercentage}>
                {progress.progressPercentage.toFixed(1)}%
              </Text>
            )}
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currentAmount}>
              ${goal.current_amount.toLocaleString()}
            </Text>
            <Text style={styles.targetAmount}>
              of ${goal.target_amount.toLocaleString()}
            </Text>
          </View>

          {progress && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress.progressPercentage, 100)}%` },
                ]}
              />
            </View>
          )}
        </Card>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => handleTabPress('overview')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'overview' && styles.activeTabText,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
            onPress={() => handleTabPress('progress')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'progress' && styles.activeTabText,
              ]}
            >
              Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'feasibility' && styles.activeTab,
            ]}
            onPress={() => handleTabPress('feasibility')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'feasibility' && styles.activeTabText,
              ]}
            >
              Feasibility
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'suggestions' && styles.activeTab,
            ]}
            onPress={() => handleTabPress('suggestions')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'suggestions' && styles.activeTabText,
              ]}
            >
              Suggestions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => handleTabPress('history')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.activeTabText,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <Container style={styles.tabContent}>
          {activeTab === 'overview' && (
            <OverviewTab goal={goal} metadata={metadata} />
          )}
          {activeTab === 'progress' && progress && (
            <ProgressTab goal={goal} progress={progress} />
          )}
          {activeTab === 'feasibility' && feasibility && (
            <FeasibilityTab goal={goal} feasibility={feasibility} />
          )}
          {activeTab === 'suggestions' && (
            <AutomatedSuggestionsPanel
              goal={goal}
              progress={progress!}
              userProfile={mockUserProfile}
              spendingHistory={mockSpendingHistory}
              onSuggestionApplied={suggestion => {
                console.log('Suggestion applied:', suggestion);
                // Would trigger goal refresh in real implementation
              }}
              onSuggestionDismissed={suggestionId => {
                console.log('Suggestion dismissed:', suggestionId);
              }}
            />
          )}
          {activeTab === 'history' && (
            <GoalAdjustmentHistoryPanel
              goal={goal}
              onRollback={adjustmentId => {
                console.log('Adjustment rolled back:', adjustmentId);
                // Would trigger goal refresh in real implementation
                loadGoalDetails();
              }}
            />
          )}
        </Container>
      </ScrollView>

      {/* Goal Adjustment Wizard */}
      {goal && progress && (
        <GoalAdjustmentWizard
          visible={showAdjustmentWizard}
          goal={goal}
          progress={progress}
          onClose={() => setShowAdjustmentWizard(false)}
          onAdjustmentComplete={handleAdjustmentComplete}
        />
      )}

      {/* Goal Splitting Wizard */}
      {goal && (
        <GoalSplittingWizard
          visible={showSplittingWizard}
          originalGoal={goal}
          onClose={() => setShowSplittingWizard(false)}
          onSplitComplete={handleSplitComplete}
        />
      )}
    </SafeAreaView>
  );

  function getFIRETypeDisplayName(fireType: string): string {
    const typeMap: Record<string, string> = {
      fire_traditional: 'Traditional FIRE',
      fire_lean: 'Lean FIRE',
      fire_fat: 'Fat FIRE',
      fire_coast: 'Coast FIRE',
      fire_barista: 'Barista FIRE',
    };
    return typeMap[fireType] || fireType;
  }
};

// Tab Components

const OverviewTab: React.FC<{
  goal: FinancialGoal;
  metadata: FIREGoalMetadata;
}> = ({ goal, metadata }) => {
  return (
    <View style={styles.tabContentContainer}>
      <Card style={styles.detailCard}>
        <Text style={styles.cardTitle}>Goal Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Target Amount:</Text>
          <Text style={styles.detailValue}>
            ${goal.target_amount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Amount:</Text>
          <Text style={styles.detailValue}>
            ${goal.current_amount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Expenses:</Text>
          <Text style={styles.detailValue}>
            ${metadata.monthlyExpenses.toLocaleString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Annual Expenses:</Text>
          <Text style={styles.detailValue}>
            ${metadata.annualExpenses.toLocaleString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Withdrawal Rate:</Text>
          <Text style={styles.detailValue}>
            {(metadata.withdrawalRate * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expected Return:</Text>
          <Text style={styles.detailValue}>
            {(metadata.expectedReturn * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Age:</Text>
          <Text style={styles.detailValue}>{metadata.currentAge}</Text>
        </View>

        {metadata.targetRetirementAge && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target Retirement Age:</Text>
            <Text style={styles.detailValue}>
              {metadata.targetRetirementAge}
            </Text>
          </View>
        )}
      </Card>

      {goal.description && (
        <Card style={styles.detailCard}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.description}>{goal.description}</Text>
        </Card>
      )}

      <Card style={styles.detailCard}>
        <Text style={styles.cardTitle}>Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto-adjust for inflation</Text>
          <Text style={styles.settingValue}>
            {metadata.autoAdjustForInflation ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Include healthcare buffer</Text>
          <Text style={styles.settingValue}>
            {metadata.includeHealthcareBuffer ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Include tax considerations</Text>
          <Text style={styles.settingValue}>
            {metadata.includeTaxConsiderations ? 'Yes' : 'No'}
          </Text>
        </View>
      </Card>
    </View>
  );
};

const ProgressTab: React.FC<{
  goal: FinancialGoal;
  progress: FIREGoalProgress;
}> = ({ goal, progress }) => {
  return (
    <View style={styles.tabContentContainer}>
      {/* Enhanced Progress Visualization */}
      <ProgressVisualization
        goal={goal}
        progress={progress}
        onViewChange={view => console.log('View changed to:', view)}
      />

      {/* Milestone Celebration System */}
      <MilestoneCelebration
        goal={goal}
        progress={progress}
        onMilestoneAcknowledged={milestone =>
          console.log('Milestone acknowledged:', milestone)
        }
      />

      {/* Additional Progress Details */}
      <Card style={styles.detailCard}>
        <Text style={styles.cardTitle}>Timeline Analysis</Text>

        <View style={styles.timelineRow}>
          <Text style={styles.timelineLabel}>Time Elapsed:</Text>
          <Text style={styles.timelineValue}>
            {formatTimeRemaining(progress.timeElapsed)}
          </Text>
        </View>

        <View style={styles.timelineRow}>
          <Text style={styles.timelineLabel}>Projected Completion:</Text>
          <Text style={styles.timelineValue}>
            {new Date(progress.projectedCompletionDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.timelineRow}>
          <Text style={styles.timelineLabel}>Confidence Level:</Text>
          <Text style={styles.timelineValue}>{progress.confidenceLevel}%</Text>
        </View>

        <View style={styles.timelineRow}>
          <Text style={styles.timelineLabel}>Velocity Trend:</Text>
          <Text
            style={[
              styles.timelineValue,
              getVelocityColor(progress.progressVelocity),
            ]}
          >
            {progress.velocityTrend > 0 ? '+' : ''}
            {progress.velocityTrend.toFixed(1)}%
          </Text>
        </View>
      </Card>
    </View>
  );
};

const FeasibilityTab: React.FC<{
  goal: FinancialGoal;
  feasibility: FIREGoalFeasibility;
}> = ({ goal, feasibility }) => {
  const handleTimelineAdjustment = (newTimeline: any) => {
    console.log('Timeline adjustment requested:', newTimeline);
    // Would trigger goal update in real implementation
  };

  return (
    <View style={styles.tabContentContainer}>
      <EnhancedFeasibilityPanel
        goal={goal}
        baseFeasibility={feasibility}
        onTimelineAdjustment={handleTimelineAdjustment}
      />
    </View>
  );
};

// Helper functions
const formatTimeRemaining = (months: number): string => {
  if (months === Infinity || months > 1200) return '∞';
  if (months < 1) return '< 1 month';

  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);

  if (years === 0) return `${remainingMonths} months`;
  if (remainingMonths === 0) return `${years} years`;
  return `${years}y ${remainingMonths}m`;
};

const getVelocityColor = (velocity: string) => {
  switch (velocity) {
    case 'accelerating':
      return { color: '#28A745' };
    case 'steady':
      return { color: '#007AFF' };
    case 'decelerating':
      return { color: '#FFC107' };
    case 'stalled':
      return { color: '#DC3545' };
    default:
      return { color: '#6C757D' };
  }
};

const getFeasibilityColor = (rating: string) => {
  switch (rating) {
    case 'excellent':
      return { color: '#28A745' };
    case 'good':
      return { color: '#007AFF' };
    case 'challenging':
      return { color: '#FFC107' };
    case 'unrealistic':
      return { color: '#DC3545' };
    default:
      return { color: '#6C757D' };
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return { color: '#DC3545' };
    case 'medium':
      return { color: '#FFC107' };
    case 'low':
      return { color: '#28A745' };
    default:
      return { color: '#6C757D' };
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return { color: '#DC3545' };
    case 'medium':
      return { color: '#FFC107' };
    case 'low':
      return { color: '#28A745' };
    default:
      return { color: '#6C757D' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  goalName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  goalTypeContainer: {
    alignSelf: 'flex-start',
  },
  goalType: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  progressCard: {
    margin: 20,
    marginBottom: 0,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  amountContainer: {
    marginBottom: 16,
  },
  currentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 4,
  },
  targetAmount: {
    fontSize: 16,
    color: '#6C757D',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    padding: 0,
  },
  tabContentContainer: {
    padding: 20,
    gap: 16,
  },
  detailCard: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  description: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 22,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  settingLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
});

export default GoalDetailsScreen;
