/**
 * MilestoneCelebration Component
 * Milestone tracking and celebration system for FIRE goals
 * Epic 8, Story 2: Advanced Progress Tracking & Visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FIREGoalProgress, FinancialGoal } from '@drishti/shared/types/financial';
import { Card, Button, Icon } from '../ui';
import { HapticService } from '../../services/HapticService';

interface MilestoneCelebrationProps {
  goal: FinancialGoal;
  progress: FIREGoalProgress;
  onMilestoneAcknowledged?: (milestone: Milestone) => void;
}

export interface Milestone {
  id: string;
  goalId: string;
  percentage: number;
  amount: number;
  achievedDate: string;
  title: string;
  description: string;
  celebrationType: 'major' | 'minor' | 'custom';
  isAchieved: boolean;
  isAcknowledged: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MILESTONE_THRESHOLDS = [10, 25, 50, 75, 90, 100];

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  goal,
  progress,
  onMilestoneAcknowledged,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  
  const celebrationAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  
  const hapticService = HapticService.getInstance();

  useEffect(() => {
    initializeMilestones();
  }, [goal.id]);

  useEffect(() => {
    checkForNewMilestones();
  }, [progress.progressPercentage, milestones]);

  const initializeMilestones = () => {
    const initialMilestones: Milestone[] = MILESTONE_THRESHOLDS.map((threshold, index) => ({
      id: `${goal.id}_milestone_${threshold}`,
      goalId: goal.id,
      percentage: threshold,
      amount: (goal.target_amount * threshold) / 100,
      achievedDate: '',
      title: getMilestoneTitle(threshold),
      description: getMilestoneDescription(threshold, goal.target_amount),
      celebrationType: getCelebrationType(threshold),
      isAchieved: progress.progressPercentage >= threshold,
      isAcknowledged: false, // Would be loaded from storage in real implementation
    }));

    setMilestones(initialMilestones);
  };

  const checkForNewMilestones = () => {
    const newlyAchievedMilestone = milestones.find(
      milestone => 
        !milestone.isAchieved && 
        progress.progressPercentage >= milestone.percentage
    );

    if (newlyAchievedMilestone) {
      const updatedMilestone = {
        ...newlyAchievedMilestone,
        isAchieved: true,
        achievedDate: new Date().toISOString(),
      };

      setMilestones(prev => 
        prev.map(m => m.id === updatedMilestone.id ? updatedMilestone : m)
      );

      triggerCelebration(updatedMilestone);
    }
  };

  const triggerCelebration = async (milestone: Milestone) => {
    setCurrentMilestone(milestone);
    setShowCelebration(true);
    
    // Haptic feedback
    await hapticService.success();
    
    // Start animations
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
    ]).start();
  };

  const handleCelebrationClose = async () => {
    if (currentMilestone) {
      const acknowledgedMilestone = {
        ...currentMilestone,
        isAcknowledged: true,
      };

      setMilestones(prev => 
        prev.map(m => m.id === acknowledgedMilestone.id ? acknowledgedMilestone : m)
      );

      onMilestoneAcknowledged?.(acknowledgedMilestone);
    }

    // Reset animations
    scaleAnimation.setValue(0);
    celebrationAnimation.setValue(0);
    confettiAnimation.setValue(0);
    
    setShowCelebration(false);
    setCurrentMilestone(null);
  };

  const getMilestoneTitle = (percentage: number): string => {
    switch (percentage) {
      case 10: return '🎯 First Steps!';
      case 25: return '🚀 Quarter Way There!';
      case 50: return '🎉 Halfway Hero!';
      case 75: return '⭐ Three Quarters Strong!';
      case 90: return '🔥 Almost FIRE!';
      case 100: return '🏆 FIRE Achieved!';
      default: return `${percentage}% Complete!`;
    }
  };

  const getMilestoneDescription = (percentage: number, targetAmount: number): string => {
    const amount = (targetAmount * percentage) / 100;
    const formattedAmount = amount >= 1000000 
      ? `$${(amount / 1000000).toFixed(1)}M`
      : `$${(amount / 1000).toFixed(0)}K`;

    switch (percentage) {
      case 10:
        return `You've saved your first ${formattedAmount}! Every journey begins with a single step.`;
      case 25:
        return `${formattedAmount} saved! You're building serious momentum toward FIRE.`;
      case 50:
        return `Incredible! You're halfway to FIRE with ${formattedAmount} saved!`;
      case 75:
        return `${formattedAmount} saved! FIRE is within reach - keep pushing!`;
      case 90:
        return `So close! ${formattedAmount} saved - FIRE is just around the corner!`;
      case 100:
        return `🎊 CONGRATULATIONS! You've achieved FIRE with ${formattedAmount}!`;
      default:
        return `${formattedAmount} saved toward your FIRE goal!`;
    }
  };

  const getCelebrationType = (percentage: number): Milestone['celebrationType'] => {
    if (percentage === 100) return 'major';
    if (percentage >= 50) return 'major';
    return 'minor';
  };

  const renderMilestoneList = () => {
    return (
      <View style={styles.milestoneList}>
        <Text style={styles.milestoneListTitle}>Milestones</Text>
        {milestones.map((milestone) => (
          <View
            key={milestone.id}
            style={[
              styles.milestoneItem,
              milestone.isAchieved && styles.achievedMilestone,
            ]}
          >
            <View style={styles.milestoneIcon}>
              {milestone.isAchieved ? (
                <Icon name="check-circle" size={20} color="#28A745" />
              ) : (
                <Icon name="circle" size={20} color="#E9ECEF" />
              )}
            </View>
            
            <View style={styles.milestoneContent}>
              <Text style={[
                styles.milestoneTitle,
                milestone.isAchieved && styles.achievedMilestoneText,
              ]}>
                {milestone.percentage}% - ${(milestone.amount / 1000).toFixed(0)}K
              </Text>
              
              {milestone.isAchieved && milestone.achievedDate && (
                <Text style={styles.achievedDate}>
                  Achieved {new Date(milestone.achievedDate).toLocaleDateString()}
                </Text>
              )}
            </View>
            
            {milestone.isAchieved && !milestone.isAcknowledged && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCelebrationModal = () => {
    if (!currentMilestone) return null;

    const isMajorMilestone = currentMilestone.celebrationType === 'major';

    return (
      <Modal
        visible={showCelebration}
        transparent
        animationType="none"
        onRequestClose={handleCelebrationClose}
      >
        <View style={styles.celebrationOverlay}>
          {/* Confetti Animation */}
          <Animated.View
            style={[
              styles.confettiContainer,
              {
                opacity: confettiAnimation,
                transform: [
                  {
                    translateY: confettiAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, screenHeight],
                    }),
                  },
                ],
              },
            ]}
          >
            {Array.from({ length: 20 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.confettiPiece,
                  {
                    left: Math.random() * screenWidth,
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][
                      Math.floor(Math.random() * 5)
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Celebration Card */}
          <Animated.View
            style={[
              styles.celebrationCard,
              {
                transform: [{ scale: scaleAnimation }],
                opacity: celebrationAnimation,
              },
            ]}
          >
            <View style={styles.celebrationHeader}>
              <Text style={[
                styles.celebrationTitle,
                isMajorMilestone && styles.majorCelebrationTitle,
              ]}>
                {currentMilestone.title}
              </Text>
            </View>

            <View style={styles.celebrationContent}>
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementPercentage}>
                  {currentMilestone.percentage}%
                </Text>
                <Text style={styles.achievementLabel}>Complete</Text>
              </View>

              <Text style={styles.celebrationDescription}>
                {currentMilestone.description}
              </Text>

              <View style={styles.celebrationStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${(currentMilestone.amount / 1000).toFixed(0)}K
                  </Text>
                  <Text style={styles.statLabel}>Saved</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${((goal.target_amount - currentMilestone.amount) / 1000).toFixed(0)}K
                  </Text>
                  <Text style={styles.statLabel}>Remaining</Text>
                </View>
              </View>
            </View>

            <View style={styles.celebrationActions}>
              <Button
                title="Continue Journey"
                onPress={handleCelebrationClose}
                style={styles.continueButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <Card style={styles.container}>
      {renderMilestoneList()}
      {renderCelebrationModal()}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  milestoneList: {
    gap: 12,
  },
  milestoneListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 12,
  },
  achievedMilestone: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#28A745',
  },
  milestoneIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C757D',
  },
  achievedMilestoneText: {
    color: '#28A745',
    fontWeight: '600',
  },
  achievedDate: {
    fontSize: 12,
    color: '#28A745',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  celebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  majorCelebrationTitle: {
    fontSize: 28,
    color: '#28A745',
  },
  celebrationContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  achievementBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  achievementPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  achievementLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  celebrationDescription: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  celebrationStats: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  celebrationActions: {
    width: '100%',
  },
  continueButton: {
    backgroundColor: '#28A745',
  },
});

export default MilestoneCelebration;
