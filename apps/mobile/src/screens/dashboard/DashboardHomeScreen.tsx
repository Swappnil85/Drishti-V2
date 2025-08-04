import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptic } from '../../contexts/HapticContext';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Container } from '../../components/ui/Container';

export default function DashboardHomeScreen() {
  const { colors } = useTheme();
  const { triggerHaptic } = useHaptic();

  const handleQuickAction = (action: string) => {
    triggerHaptic('light');
    console.log(`Quick action: ${action}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Container style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text
              variant='h1'
              style={[styles.welcomeTitle, { color: colors.onBackground }]}
            >
              Welcome to Drishti
            </Text>
            <Text
              variant='body'
              style={[
                styles.welcomeSubtitle,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Your personal financial planning companion
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <Text
              variant='h2'
              style={[styles.sectionTitle, { color: colors.onBackground }]}
            >
              Financial Overview
            </Text>

            <View style={styles.statsGrid}>
              <Card
                style={[styles.statCard, { backgroundColor: colors.surface }]}
              >
                <Text
                  variant='caption'
                  style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
                >
                  Total Balance
                </Text>
                <Text
                  variant='h2'
                  style={[styles.statValue, { color: colors.primary }]}
                >
                  $12,450.00
                </Text>
              </Card>

              <Card
                style={[styles.statCard, { backgroundColor: colors.surface }]}
              >
                <Text
                  variant='caption'
                  style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
                >
                  Monthly Savings
                </Text>
                <Text
                  variant='h2'
                  style={[styles.statValue, { color: colors.secondary }]}
                >
                  $1,200.00
                </Text>
              </Card>

              <Card
                style={[styles.statCard, { backgroundColor: colors.surface }]}
              >
                <Text
                  variant='caption'
                  style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
                >
                  Active Goals
                </Text>
                <Text
                  variant='h2'
                  style={[styles.statValue, { color: colors.tertiary }]}
                >
                  3
                </Text>
              </Card>

              <Card
                style={[styles.statCard, { backgroundColor: colors.surface }]}
              >
                <Text
                  variant='caption'
                  style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
                >
                  Goal Progress
                </Text>
                <Text
                  variant='h2'
                  style={[styles.statValue, { color: colors.success }]}
                >
                  68%
                </Text>
              </Card>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text
              variant='h2'
              style={[styles.sectionTitle, { color: colors.onBackground }]}
            >
              Quick Actions
            </Text>

            <View style={styles.actionsGrid}>
              <Button
                variant='primary'
                size='lg'
                onPress={() => handleQuickAction('Add Account')}
                style={styles.actionButton}
              >
                Add Account
              </Button>

              <Button
                variant='secondary'
                size='lg'
                onPress={() => handleQuickAction('Create Goal')}
                style={styles.actionButton}
              >
                Create Goal
              </Button>

              <Button
                variant='outline'
                size='lg'
                onPress={() => handleQuickAction('View Reports')}
                style={styles.actionButton}
              >
                View Reports
              </Button>

              <Button
                variant='outline'
                size='lg'
                onPress={() => handleQuickAction('Plan Scenario')}
                style={styles.actionButton}
              >
                Plan Scenario
              </Button>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <Text
              variant='h2'
              style={[styles.sectionTitle, { color: colors.onBackground }]}
            >
              Recent Activity
            </Text>

            <Card
              style={[styles.activityCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.activityItem}>
                <Text
                  variant='body'
                  style={[styles.activityText, { color: colors.onSurface }]}
                >
                  Emergency Fund goal updated
                </Text>
                <Text
                  variant='caption'
                  style={[
                    styles.activityTime,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  2 hours ago
                </Text>
              </View>

              <View style={styles.activityItem}>
                <Text
                  variant='body'
                  style={[styles.activityText, { color: colors.onSurface }]}
                >
                  Savings account balance synced
                </Text>
                <Text
                  variant='caption'
                  style={[
                    styles.activityTime,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  1 day ago
                </Text>
              </View>

              <View style={styles.activityItem}>
                <Text
                  variant='body'
                  style={[styles.activityText, { color: colors.onSurface }]}
                >
                  New investment scenario created
                </Text>
                <Text
                  variant='caption'
                  style={[
                    styles.activityTime,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  3 days ago
                </Text>
              </View>
            </Card>
          </View>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  activitySection: {
    marginBottom: 32,
  },
  activityCard: {
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  activityText: {
    flex: 1,
  },
  activityTime: {
    marginLeft: 8,
  },
});
