/**
 * ProgressVisualization Component
 * Advanced progress tracking and visualization for FIRE goals
 * Epic 8, Story 2: Advanced Progress Tracking & Visualization
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
import Svg, { Circle, Path, Text as SvgText, G } from 'react-native-svg';
import { FIREGoalProgress, FinancialGoal } from '@drishti/shared/types/financial';
import { Card, Icon } from '../ui';
import { HapticService } from '../../services/HapticService';

interface ProgressVisualizationProps {
  goal: FinancialGoal;
  progress: FIREGoalProgress;
  onViewChange?: (view: ProgressViewType) => void;
}

export type ProgressViewType = 'percentage' | 'dollar' | 'timeline' | 'velocity';

const { width: screenWidth } = Dimensions.get('window');
const chartSize = Math.min(screenWidth - 80, 280);
const centerX = chartSize / 2;
const centerY = chartSize / 2;
const radius = (chartSize - 40) / 2;

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  goal,
  progress,
  onViewChange,
}) => {
  const [activeView, setActiveView] = useState<ProgressViewType>('percentage');
  const [animatedValue] = useState(new Animated.Value(0));
  const hapticService = HapticService.getInstance();

  useEffect(() => {
    // Animate progress on mount
    Animated.timing(animatedValue, {
      toValue: progress.progressPercentage / 100,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [progress.progressPercentage]);

  const handleViewChange = async (view: ProgressViewType) => {
    await hapticService.impact('light');
    setActiveView(view);
    onViewChange?.(view);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 75) return '#28A745'; // Green
    if (percentage >= 50) return '#007AFF'; // Blue
    if (percentage >= 25) return '#FFC107'; // Yellow
    return '#DC3545'; // Red
  };

  const getVelocityColor = (velocity: string): string => {
    switch (velocity) {
      case 'accelerating': return '#28A745';
      case 'steady': return '#007AFF';
      case 'decelerating': return '#FFC107';
      case 'stalled': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatTimeRemaining = (months: number): string => {
    if (months === Infinity || months > 1200) return '∞';
    if (months < 1) return '< 1 month';
    
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    
    if (years === 0) return `${remainingMonths}mo`;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}mo`;
  };

  const renderCircularProgress = () => {
    const progressPercentage = Math.min(progress.progressPercentage, 100);
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - progressPercentage / 100);
    const progressColor = getProgressColor(progressPercentage);

    return (
      <Svg width={chartSize} height={chartSize} style={styles.progressChart}>
        {/* Background circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke="#E9ECEF"
          strokeWidth="12"
          fill="transparent"
        />
        
        {/* Progress circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke={progressColor}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${centerX} ${centerY})`}
        />
        
        {/* Center content */}
        <G>
          <SvgText
            x={centerX}
            y={centerY - 20}
            textAnchor="middle"
            fontSize="32"
            fontWeight="bold"
            fill={progressColor}
          >
            {activeView === 'percentage' && `${progressPercentage.toFixed(1)}%`}
            {activeView === 'dollar' && formatCurrency(goal.current_amount)}
            {activeView === 'timeline' && formatTimeRemaining(progress.estimatedTimeRemaining)}
            {activeView === 'velocity' && progress.progressVelocity}
          </SvgText>
          
          <SvgText
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            fontSize="14"
            fill="#6C757D"
          >
            {activeView === 'percentage' && 'Complete'}
            {activeView === 'dollar' && `of ${formatCurrency(goal.target_amount)}`}
            {activeView === 'timeline' && 'Remaining'}
            {activeView === 'velocity' && 'Velocity'}
          </SvgText>
        </G>
      </Svg>
    );
  };

  const renderViewSelector = () => {
    const views: Array<{ key: ProgressViewType; label: string; icon: string }> = [
      { key: 'percentage', label: '%', icon: 'percent' },
      { key: 'dollar', label: '$', icon: 'dollar-sign' },
      { key: 'timeline', label: 'Time', icon: 'clock' },
      { key: 'velocity', label: 'Speed', icon: 'trending-up' },
    ];

    return (
      <View style={styles.viewSelector}>
        {views.map((view) => (
          <TouchableOpacity
            key={view.key}
            style={[
              styles.viewButton,
              activeView === view.key && styles.activeViewButton,
            ]}
            onPress={() => handleViewChange(view.key)}
          >
            <Icon 
              name={view.icon} 
              size={16} 
              color={activeView === view.key ? '#FFFFFF' : '#6C757D'} 
            />
            <Text style={[
              styles.viewButtonText,
              activeView === view.key && styles.activeViewButtonText,
            ]}>
              {view.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProgressMetrics = () => {
    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {formatCurrency(progress.monthlyProgress)}
            </Text>
            <Text style={styles.metricLabel}>Monthly Progress</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[
              styles.metricValue,
              { color: getVelocityColor(progress.progressVelocity) }
            ]}>
              {progress.progressVelocity}
            </Text>
            <Text style={styles.metricLabel}>Velocity</Text>
          </View>
        </View>
        
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {progress.confidenceLevel}%
            </Text>
            <Text style={styles.metricLabel}>Confidence</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {formatTimeRemaining(progress.timeElapsed)}
            </Text>
            <Text style={styles.metricLabel}>Time Elapsed</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Overview</Text>
        <TouchableOpacity style={styles.expandButton}>
          <Icon name="maximize-2" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.chartContainer}>
        {renderCircularProgress()}
      </View>
      
      {renderViewSelector()}
      {renderProgressMetrics()}
      
      {/* Next Milestone Preview */}
      <View style={styles.milestonePreview}>
        <View style={styles.milestoneHeader}>
          <Text style={styles.milestoneTitle}>Next Milestone</Text>
          <Text style={styles.milestonePercentage}>
            {progress.nextMilestone.percentage}%
          </Text>
        </View>
        <Text style={styles.milestoneAmount}>
          {formatCurrency(progress.nextMilestone.amount)}
        </Text>
        <Text style={styles.milestoneDate}>
          Est. {new Date(progress.nextMilestone.estimatedDate).toLocaleDateString()}
        </Text>
      </View>
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
    color: '#212529',
  },
  expandButton: {
    padding: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressChart: {
    marginBottom: 10,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  activeViewButton: {
    backgroundColor: '#007AFF',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeViewButtonText: {
    color: '#FFFFFF',
  },
  metricsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  milestonePreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  milestonePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  milestoneAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  milestoneDate: {
    fontSize: 12,
    color: '#6C757D',
  },
});

export default ProgressVisualization;
