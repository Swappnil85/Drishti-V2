/**
 * AchievementVisualization Component
 * Epic 10, Story 1: Goal Progress Visual Charts - Achievement visualization with milestone markers
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryScatter,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryContainer,
  VictoryLabel,
  VictoryAnimation,
} from 'victory';
import { Card, Icon, Button, Flex } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import { useTheme } from '../../contexts/ThemeContext';

interface AchievementVisualizationProps {
  milestones: Milestone[];
  currentProgress: number;
  onMilestonePress?: (milestone: Milestone) => void;
  height?: number;
  showAnimations?: boolean;
  showCelebrations?: boolean;
}

interface Milestone {
  id: string;
  percentage: number;
  amount: number;
  label: string;
  achieved: boolean;
  achievedDate?: string;
  estimatedDate: string;
  celebration?: {
    type: 'confetti' | 'fireworks' | 'sparkles';
    message: string;
  };
}

const { width: screenWidth } = Dimensions.get('window');

export const AchievementVisualization: React.FC<
  AchievementVisualizationProps
> = ({
  milestones,
  currentProgress,
  onMilestonePress,
  height = 300,
  showAnimations = true,
  showCelebrations = true,
}) => {
  const [animatedProgress] = useState(new Animated.Value(0));
  const [celebratingMilestone, setCelebratingMilestone] = useState<
    string | null
  >(null);
  const { impactMedium, impactHeavy } = useHaptic();
  const { theme } = useTheme();

  useEffect(() => {
    if (showAnimations) {
      Animated.timing(animatedProgress, {
        toValue: currentProgress,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }

    // Check for newly achieved milestones
    const newlyAchieved = milestones.find(
      m => m.achieved && m.percentage <= currentProgress && !m.achievedDate
    );

    if (newlyAchieved && showCelebrations) {
      setCelebratingMilestone(newlyAchieved.id);
      impactHeavy();
      setTimeout(() => setCelebratingMilestone(null), 3000);
    }
  }, [
    currentProgress,
    milestones,
    showAnimations,
    showCelebrations,
    impactHeavy,
  ]);

  const getChartData = () => {
    const progressLine = Array.from({ length: 101 }, (_, i) => ({
      x: i,
      y: Math.min(i, currentProgress),
    }));

    const milestonePoints = milestones.map(milestone => ({
      x: milestone.percentage,
      y: milestone.percentage,
      milestone,
      achieved: milestone.achieved,
    }));

    return { progressLine, milestonePoints };
  };

  const handleMilestonePress = async (milestone: Milestone) => {
    await impactMedium();
    onMilestonePress?.(milestone);
  };

  const renderMilestoneMarkers = () => {
    return milestones.map((milestone, index) => {
      const isAchieved = milestone.achieved;
      const isCelebrating = celebratingMilestone === milestone.id;

      return (
        <TouchableOpacity
          key={milestone.id}
          style={[
            styles.milestoneMarker,
            {
              left: (milestone.percentage / 100) * (screenWidth - 80) - 15,
              backgroundColor: isAchieved
                ? theme.colors.success
                : theme.colors.surface,
              borderColor: isAchieved
                ? theme.colors.success
                : theme.colors.border,
              transform: isCelebrating ? [{ scale: 1.2 }] : [{ scale: 1 }],
            },
          ]}
          onPress={() => handleMilestonePress(milestone)}
        >
          <Icon
            name={isAchieved ? 'check-circle' : 'circle'}
            size={16}
            color={isAchieved ? theme.colors.onSuccess : theme.colors.text}
          />
          <Text style={[styles.milestoneLabel, { color: theme.colors.text }]}>
            {milestone.label}
          </Text>
          {isCelebrating && (
            <View style={styles.celebrationEffect}>
              <Text style={styles.celebrationText}>🎉</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  const renderProgressChart = () => {
    const { progressLine, milestonePoints } = getChartData();

    return (
      <VictoryChart
        theme={VictoryTheme.material}
        height={height}
        width={screenWidth - 40}
        padding={{ left: 60, top: 40, right: 40, bottom: 80 }}
        domain={{ x: [0, 100], y: [0, 100] }}
      >
        <VictoryAxis
          dependentAxis
          tickFormat={t => `${t}%`}
          style={{
            tickLabels: { fontSize: 12, fill: theme.colors.text },
            grid: { stroke: theme.colors.border, strokeWidth: 0.5 },
          }}
        />
        <VictoryAxis
          tickFormat={t => `${t}%`}
          style={{
            tickLabels: { fontSize: 12, fill: theme.colors.text },
            grid: { stroke: theme.colors.border, strokeWidth: 0.5 },
          }}
        />

        {/* Progress area */}
        <VictoryArea
          data={progressLine}
          x='x'
          y='y'
          style={{
            data: {
              fill: theme.colors.primary,
              fillOpacity: 0.3,
              stroke: theme.colors.primary,
              strokeWidth: 2,
            },
          }}
          animate={
            showAnimations
              ? {
                  duration: 2000,
                  onLoad: { duration: 1000 },
                }
              : false
          }
        />

        {/* Milestone points */}
        <VictoryScatter
          data={milestonePoints}
          x='x'
          y='y'
          size={8}
          style={{
            data: {
              fill: ({ datum }) =>
                datum.achieved ? theme.colors.success : theme.colors.surface,
              stroke: ({ datum }) =>
                datum.achieved ? theme.colors.success : theme.colors.border,
              strokeWidth: 2,
            },
          }}
          labelComponent={<VictoryTooltip />}
          animate={
            showAnimations
              ? {
                  duration: 1500,
                  onLoad: { duration: 800 },
                }
              : false
          }
        />
      </VictoryChart>
    );
  };

  const renderMilestoneList = () => {
    return (
      <View style={styles.milestoneList}>
        {milestones.map((milestone, index) => (
          <TouchableOpacity
            key={milestone.id}
            style={[
              styles.milestoneItem,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => handleMilestonePress(milestone)}
          >
            <View style={styles.milestoneIcon}>
              <Icon
                name={milestone.achieved ? 'check-circle' : 'circle'}
                size={20}
                color={
                  milestone.achieved ? theme.colors.success : theme.colors.text
                }
              />
            </View>
            <View style={styles.milestoneContent}>
              <Text
                style={[styles.milestoneTitle, { color: theme.colors.text }]}
              >
                {milestone.label}
              </Text>
              <Text
                style={[styles.milestoneAmount, { color: theme.colors.text }]}
              >
                ${milestone.amount.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.milestoneDate,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {milestone.achieved
                  ? `Achieved ${milestone.achievedDate}`
                  : `Est. ${milestone.estimatedDate}`}
              </Text>
            </View>
            {milestone.achieved && (
              <View style={styles.achievedBadge}>
                <Text style={styles.achievedText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Achievement Progress
        </Text>
        <Text style={[styles.progressText, { color: theme.colors.primary }]}>
          {currentProgress.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.chartContainer}>{renderProgressChart()}</View>

      {renderMilestoneList()}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  milestoneMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    top: -15,
  },
  milestoneLabel: {
    position: 'absolute',
    top: 35,
    fontSize: 10,
    textAlign: 'center',
    width: 60,
    left: -15,
  },
  celebrationEffect: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  celebrationText: {
    fontSize: 20,
  },
  milestoneList: {
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  milestoneAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 12,
  },
  achievedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#28A745',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
