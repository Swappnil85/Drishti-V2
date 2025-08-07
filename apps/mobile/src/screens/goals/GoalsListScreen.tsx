/**
 * GoalsListScreen Component
 * Enhanced FIRE Goals List Screen
 * Epic 8, Story 1: FIRE Goal Creation & Management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GoalsStackScreenProps } from '../../types/navigation';
import {
  FinancialGoal,
  FIREGoalMetadata,
  FIREGoalProgress,
} from '@drishti/shared/types/financial';
import { FIREGoalService } from '../../services/financial/FIREGoalService';
import { Button, Card, Container, Icon } from '../../components/ui';
import { HapticService } from '../../services/HapticService';

type Props = GoalsStackScreenProps<'GoalsList'>;

const GoalsListScreen: React.FC<Props> = ({ navigation }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<
    Record<string, FIREGoalProgress>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fireGoalService = FIREGoalService.getInstance();
  const hapticService = HapticService.getInstance();

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  const loadGoals = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Load goals from storage (in real app, this would be from API)
      const loadedGoals = await fireGoalService.getGoalsFromStorage();
      setGoals(loadedGoals);

      // Calculate progress for each goal
      const progressMap: Record<string, FIREGoalProgress> = {};
      for (const goal of loadedGoals) {
        try {
          const progress = await fireGoalService.calculateGoalProgress(goal);
          progressMap[goal.id] = progress;
        } catch (error) {
          console.error(
            `Failed to calculate progress for goal ${goal.id}:`,
            error
          );
        }
      }
      setGoalProgress(progressMap);
    } catch (error) {
      console.error('Failed to load goals:', error);
      Alert.alert('Error', 'Failed to load goals. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCreateGoal = async () => {
    await hapticService.impact('light');
    navigation.navigate('CreateGoal');
  };

  const handleGoalPress = async (goal: FinancialGoal) => {
    await hapticService.impact('light');
    navigation.navigate('GoalDetails', { goalId: goal.id });
  };

  const handleRefresh = () => {
    loadGoals(true);
  };

  const renderGoalCard = (goal: FinancialGoal) => {
    const metadata = goal.metadata as FIREGoalMetadata;
    const progress = goalProgress[goal.id];
    const progressPercentage = progress?.progressPercentage || 0;

    return (
      <Card
        key={goal.id}
        style={styles.goalCard}
        onPress={() => handleGoalPress(goal)}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <View style={styles.goalTypeContainer}>
              <Text style={styles.goalType}>
                {getFIRETypeDisplayName(metadata.fireType)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              /* Handle more options */
            }}
          >
            <Icon name='more-horizontal' size={20} color='#6C757D' />
          </TouchableOpacity>
        </View>

        <View style={styles.goalAmount}>
          <Text style={styles.currentAmount}>
            ${goal.current_amount.toLocaleString()}
          </Text>
          <Text style={styles.targetAmount}>
            of ${goal.target_amount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercentage, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progressPercentage.toFixed(1)}% complete
          </Text>
        </View>

        {progress && (
          <View style={styles.goalStats}>
            <View style={styles.goalStat}>
              <Text style={styles.goalStatLabel}>Monthly Progress</Text>
              <Text style={styles.goalStatValue}>
                ${progress.monthlyProgress.toLocaleString()}
              </Text>
            </View>
            <View style={styles.goalStat}>
              <Text style={styles.goalStatLabel}>Time Remaining</Text>
              <Text style={styles.goalStatValue}>
                {formatTimeRemaining(progress.estimatedTimeRemaining)}
              </Text>
            </View>
            <View style={styles.goalStat}>
              <Text style={styles.goalStatLabel}>Velocity</Text>
              <Text
                style={[
                  styles.goalStatValue,
                  getVelocityColor(progress.progressVelocity),
                ]}
              >
                {progress.progressVelocity}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.goalFooter}>
          <Text style={styles.goalDate}>
            Created {new Date(goal.created_at).toLocaleDateString()}
          </Text>
          {goal.target_date && (
            <Text style={styles.targetDate}>
              Target: {new Date(goal.target_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const getFIRETypeDisplayName = (fireType: string): string => {
    const typeMap: Record<string, string> = {
      fire_traditional: 'Traditional FIRE',
      fire_lean: 'Lean FIRE',
      fire_fat: 'Fat FIRE',
      fire_coast: 'Coast FIRE',
      fire_barista: 'Barista FIRE',
    };
    return typeMap[fireType] || fireType;
  };

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your FIRE goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor='#007AFF'
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Container style={styles.content}>
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name='target' size={64} color='#6C757D' />
              <Text style={styles.emptyTitle}>No FIRE Goals Yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first FIRE goal to start your journey to financial
                independence.
              </Text>
              <Button
                title='Create Your First Goal'
                onPress={handleCreateGoal}
                style={styles.createFirstGoalButton}
              />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Your FIRE Goals</Text>
                  <Text style={styles.subtitle}>
                    {goals.length} goal{goals.length !== 1 ? 's' : ''} •
                    {goals.filter(g => g.is_active).length} active
                  </Text>
                </View>
                <Button
                  title='New Goal'
                  onPress={handleCreateGoal}
                  style={styles.newGoalButton}
                />
              </View>

              <View style={styles.goalsList}>{goals.map(renderGoalCard)}</View>
            </>
          )}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 0,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createFirstGoalButton: {
    paddingHorizontal: 32,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  newGoalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  goalsList: {
    padding: 20,
    gap: 16,
  },
  goalCard: {
    padding: 20,
    marginBottom: 0,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  goalName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
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
  moreButton: {
    padding: 4,
  },
  goalAmount: {
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
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  goalStat: {
    flex: 1,
    alignItems: 'center',
  },
  goalStatLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    textAlign: 'center',
  },
  goalStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  goalDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  targetDate: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default GoalsListScreen;
