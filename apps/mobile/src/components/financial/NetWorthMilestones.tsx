/**
 * NetWorthMilestones Component
 * Interactive milestones tracking with achievement celebrations
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
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Icon, Flex, Badge } from '../ui';
import { netWorthService, NetWorthMilestone } from '../../services/financial/NetWorthService';
import { useFormHaptic } from '../../hooks/useHaptic';

interface NetWorthMilestonesProps {
  onMilestonePress?: (milestone: NetWorthMilestone) => void;
  showCelebration?: boolean;
}

const NetWorthMilestones: React.FC<NetWorthMilestonesProps> = ({
  onMilestonePress,
  showCelebration = true,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [milestones, setMilestones] = useState<NetWorthMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentNetWorth, setCurrentNetWorth] = useState(0);
  const [showAchieved, setShowAchieved] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadMilestones();
    }
  }, [user?.id]);

  const loadMilestones = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const [milestonesData, netWorthData] = await Promise.all([
        netWorthService.getNetWorthMilestones(user.id),
        netWorthService.calculateNetWorth(user.id),
      ]);

      setMilestones(milestonesData);
      setCurrentNetWorth(netWorthData.totalNetWorth);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getNextMilestone = () => {
    return milestones.find(milestone => !milestone.achieved);
  };

  const getAchievedMilestones = () => {
    return milestones.filter(milestone => milestone.achieved);
  };

  const getUpcomingMilestones = () => {
    return milestones.filter(milestone => !milestone.achieved);
  };

  const getMilestoneIcon = (milestone: NetWorthMilestone) => {
    if (milestone.achieved) {
      return 'checkmark-circle';
    }
    
    if (milestone.progress > 0.5) {
      return 'radio-button-on-outline';
    }
    
    return 'radio-button-off-outline';
  };

  const getMilestoneColor = (milestone: NetWorthMilestone) => {
    if (milestone.achieved) {
      return theme.colors.success;
    }
    
    if (milestone.progress > 0.75) {
      return theme.colors.warning;
    }
    
    if (milestone.progress > 0.25) {
      return theme.colors.info;
    }
    
    return theme.colors.textSecondary;
  };

  const handleMilestonePress = (milestone: NetWorthMilestone) => {
    haptic.light();
    
    if (milestone.achieved && showCelebration) {
      showCelebrationAlert(milestone);
    } else {
      onMilestonePress?.(milestone);
    }
  };

  const showCelebrationAlert = (milestone: NetWorthMilestone) => {
    Alert.alert(
      '🎉 Milestone Achieved!',
      `Congratulations on reaching ${milestone.label}!\n\nYou've achieved a net worth of ${formatCurrency(milestone.amount)}.`,
      [
        { text: 'Share Achievement', onPress: () => shareAchievement(milestone) },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const shareAchievement = (milestone: NetWorthMilestone) => {
    // In a real app, this would integrate with native sharing
    console.log(`Sharing achievement: ${milestone.label}`);
  };

  const renderFilterButtons = () => {
    return (
      <Card variant="outlined" padding="sm" style={styles.filterCard}>
        <Flex direction="row" gap="xs">
          <TouchableOpacity
            style={[
              styles.filterButton,
              showAchieved && { backgroundColor: theme.colors.success },
            ]}
            onPress={() => {
              haptic.light();
              setShowAchieved(!showAchieved);
            }}
          >
            <Icon
              name="checkmark-circle"
              size="sm"
              color={showAchieved ? 'white' : 'textSecondary'}
            />
            <Text
              style={[
                styles.filterButtonText,
                { color: showAchieved ? 'white' : theme.colors.textSecondary },
              ]}
            >
              Achieved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              showUpcoming && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => {
              haptic.light();
              setShowUpcoming(!showUpcoming);
            }}
          >
            <Icon
              name="flag-outline"
              size="sm"
              color={showUpcoming ? 'white' : 'textSecondary'}
            />
            <Text
              style={[
                styles.filterButtonText,
                { color: showUpcoming ? 'white' : theme.colors.textSecondary },
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
        </Flex>
      </Card>
    );
  };

  const renderProgressSummary = () => {
    const achievedCount = getAchievedMilestones().length;
    const totalCount = milestones.length;
    const nextMilestone = getNextMilestone();

    return (
      <Card variant="filled" padding="lg" style={styles.summaryCard}>
        <Flex direction="column" align="center" gap="sm">
          <Text style={[styles.summaryTitle, { color: theme.colors.onPrimary }]}>
            Milestone Progress
          </Text>
          
          <Text style={[styles.summaryProgress, { color: theme.colors.onPrimary }]}>
            {achievedCount} of {totalCount} Achieved
          </Text>

          <View style={styles.overallProgressBar}>
            <View
              style={[
                styles.overallProgressFill,
                {
                  backgroundColor: theme.colors.success,
                  width: `${(achievedCount / totalCount) * 100}%`,
                },
              ]}
            />
          </View>

          {nextMilestone && (
            <View style={styles.nextMilestoneInfo}>
              <Text style={[styles.nextMilestoneLabel, { color: theme.colors.onPrimary }]}>
                Next: {nextMilestone.label}
              </Text>
              <Text style={[styles.nextMilestoneAmount, { color: theme.colors.onPrimary }]}>
                {formatCurrency(nextMilestone.amount)}
              </Text>
              <Text style={[styles.nextMilestoneProgress, { color: theme.colors.onPrimary }]}>
                {Math.round(nextMilestone.progress * 100)}% Complete
              </Text>
            </View>
          )}
        </Flex>
      </Card>
    );
  };

  const renderMilestoneItem = (milestone: NetWorthMilestone) => {
    const remaining = milestone.amount - currentNetWorth;
    
    return (
      <TouchableOpacity
        key={milestone.id}
        style={[
          styles.milestoneItem,
          milestone.achieved && styles.achievedMilestone,
        ]}
        onPress={() => handleMilestonePress(milestone)}
      >
        <Flex direction="row" align="center" gap="sm">
          <View style={styles.milestoneIconContainer}>
            <Icon
              name={getMilestoneIcon(milestone)}
              size="md"
              color={getMilestoneColor(milestone)}
            />
          </View>

          <View style={styles.milestoneInfo}>
            <Text style={[styles.milestoneLabel, { color: theme.colors.text }]}>
              {milestone.label}
            </Text>
            <Text style={[styles.milestoneAmount, { color: theme.colors.textSecondary }]}>
              {formatCurrency(milestone.amount)}
            </Text>
            
            {milestone.achieved ? (
              <Flex direction="row" align="center" gap="xs">
                <Icon name="trophy" size="sm" color="success" />
                <Text style={[styles.achievedText, { color: theme.colors.success }]}>
                  Achieved!
                </Text>
                {milestone.achievedDate && (
                  <Text style={[styles.achievedDate, { color: theme.colors.textSecondary }]}>
                    {milestone.achievedDate.toLocaleDateString()}
                  </Text>
                )}
              </Flex>
            ) : (
              <View>
                <Text style={[styles.remainingText, { color: theme.colors.textSecondary }]}>
                  {formatCurrency(remaining)} remaining
                </Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: getMilestoneColor(milestone),
                          width: `${milestone.progress * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                    {Math.round(milestone.progress * 100)}%
                  </Text>
                </View>
              </View>
            )}
          </View>

          <Icon name="chevron-forward" size="sm" color="textSecondary" />
        </Flex>
      </TouchableOpacity>
    );
  };

  const renderMilestonesList = () => {
    const achievedMilestones = getAchievedMilestones();
    const upcomingMilestones = getUpcomingMilestones();

    return (
      <Card variant="outlined" padding="lg" style={styles.milestonesCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Net Worth Milestones
        </Text>

        {showAchieved && achievedMilestones.length > 0 && (
          <View style={styles.milestoneSection}>
            <Text style={[styles.subsectionTitle, { color: theme.colors.success }]}>
              🏆 Achieved ({achievedMilestones.length})
            </Text>
            {achievedMilestones.map(renderMilestoneItem)}
          </View>
        )}

        {showUpcoming && upcomingMilestones.length > 0 && (
          <View style={styles.milestoneSection}>
            <Text style={[styles.subsectionTitle, { color: theme.colors.primary }]}>
              🎯 Upcoming ({upcomingMilestones.length})
            </Text>
            {upcomingMilestones.map(renderMilestoneItem)}
          </View>
        )}

        {(!showAchieved && !showUpcoming) || milestones.length === 0 && (
          <Flex direction="column" align="center" gap="base" style={styles.emptyState}>
            <Icon name="flag-outline" size="lg" color="textSecondary" />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No milestones to display
            </Text>
          </Flex>
        )}
      </Card>
    );
  };

  const renderActionButtons = () => {
    return (
      <Card variant="outlined" padding="lg" style={styles.actionsCard}>
        <Flex direction="row" gap="sm">
          <Button
            variant="outline"
            onPress={() => {
              // Navigate to goal setting
              console.log('Navigate to goal setting');
            }}
            leftIcon={<Icon name="add-circle-outline" size="sm" />}
            style={styles.actionButton}
          >
            Set Custom Goal
          </Button>
          
          <Button
            variant="outline"
            onPress={() => {
              // Share progress
              console.log('Share progress');
            }}
            leftIcon={<Icon name="share-outline" size="sm" />}
            style={styles.actionButton}
          >
            Share Progress
          </Button>
        </Flex>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading milestones...
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderProgressSummary()}
      {renderFilterButtons()}
      {renderMilestonesList()}
      {renderActionButtons()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryProgress: {
    fontSize: 16,
    fontWeight: '500',
  },
  overallProgressBar: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginVertical: 8,
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextMilestoneInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  nextMilestoneLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextMilestoneAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextMilestoneProgress: {
    fontSize: 12,
  },
  filterCard: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  milestonesCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  milestoneSection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  milestoneItem: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    marginBottom: 8,
  },
  achievedMilestone: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  milestoneIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  milestoneAmount: {
    fontSize: 14,
    marginBottom: 8,
  },
  achievedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  achievedDate: {
    fontSize: 10,
  },
  remainingText: {
    fontSize: 12,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    minWidth: 30,
  },
  emptyState: {
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default NetWorthMilestones;
