import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useHapticContext } from '../../contexts/HapticContext';
import { Text, Card, Button, Container } from '../../components/ui';

export default function DashboardHomeScreen() {
  const { colors } = useTheme();
  const { trigger: triggerHaptic } = useHapticContext();

  const handleQuickAction = (action: string) => {
    triggerHaptic('light');
    console.log(`Quick action: ${action}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Container style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text
              variant="h2"
              style={[styles.welcomeTitle, { color: colors.text.primary }]}
            >
              Welcome to Drishti
            </Text>
            <Text
              variant="body1"
              style={[
                styles.welcomeSubtitle,
                { color: colors.text.secondary },
              ]}
            >
              Your personal finance companion
            </Text>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsSection}>
            <Text
              variant="h3"
              style={[styles.sectionTitle, { color: colors.text.primary }]}
            >
              Overview
            </Text>

            <View style={styles.statsGrid}>
              <Card
                style={[styles.statCard, { backgroundColor: colors.background.secondary }]}
              >
                <Text
                  variant="caption"
                  style={[styles.statLabel, { color: colors.text.secondary }]}
                >
                  Total Balance
                </Text>
                <Text
                  variant="h4"
                  style={[styles.statValue, { color: colors.primary[500] }]}
                >
                  $12,450.00
                </Text>
              </Card>

              <Card
                style={[styles.statCard, { backgroundColor: colors.background.secondary }]}
              >
                <Text
                  variant="caption"
                  style={[styles.statLabel, { color: colors.text.secondary }]}
                >
                  Monthly Spending
                </Text>
                <Text
                  variant="h4"
                  style={[styles.statValue, { color: colors.secondary[500] }]}
                >
                  $2,340.00
                </Text>
              </Card>

              <Card
                style={[styles.statCard, { backgroundColor: colors.background.secondary }]}
              >
                <Text
                  variant="caption"
                  style={[styles.statLabel, { color: colors.text.secondary }]}
                >
                  Savings Goal
                </Text>
                <Text
                  variant="h4"
                  style={[styles.statValue, { color: colors.warning[500] }]}
                >
                  75%
                </Text>
              </Card>

              <Card
                style={[styles.statCard, { backgroundColor: colors.background.secondary }]}
              >
                <Text
                  variant="caption"
                  style={[styles.statLabel, { color: colors.text.secondary }]}
                >
                  Investments
                </Text>
                <Text
                  variant="h4"
                  style={[styles.statValue, { color: colors.success[500] }]}
                >
                  $8,750.00
                </Text>
              </Card>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text
              variant="h3"
              style={[styles.sectionTitle, { color: colors.text.primary }]}
            >
              Quick Actions
            </Text>

            <View style={styles.actionsGrid}>
              <Button
                variant="primary"
                onPress={() => handleQuickAction('add-transaction')}
                style={styles.actionButton}
              >
                Add Transaction
              </Button>

              <Button
                variant="outlined"
                onPress={() => handleQuickAction('view-accounts')}
                style={styles.actionButton}
              >
                View Accounts
              </Button>

              <Button
                variant="outlined"
                onPress={() => handleQuickAction('set-goal')}
                style={styles.actionButton}
              >
                Set New Goal
              </Button>

              <Button
                variant="outlined"
                onPress={() => handleQuickAction('view-reports')}
                style={styles.actionButton}
              >
                View Reports
              </Button>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <Text
              variant="h3"
              style={[styles.sectionTitle, { color: colors.text.primary }]}
            >
              Recent Activity
            </Text>

            <Card
              style={[styles.activityCard, { backgroundColor: colors.background.secondary }]}
            >
              <View style={styles.activityItem}>
                <Text
                  variant="body1"
                  style={[styles.activityText, { color: colors.text.primary }]}
                >
                  Grocery Shopping
                </Text>
                <Text
                  variant="caption"
                  style={[
                    styles.activityTime,
                    { color: colors.text.secondary },
                  ]}
                >
                  2 hours ago
                </Text>
              </View>

              <View style={styles.activityItem}>
                <Text
                  variant="body1"
                  style={[styles.activityText, { color: colors.text.primary }]}
                >
                  Salary Deposit
                </Text>
                <Text
                  variant="caption"
                  style={[
                    styles.activityTime,
                    { color: colors.text.secondary },
                  ]}
                >
                  1 day ago
                </Text>
              </View>

              <View style={styles.activityItem}>
                <Text
                  variant="body1"
                  style={[styles.activityText, { color: colors.text.primary }]}
                >
                  Investment Purchase
                </Text>
                <Text
                  variant="caption"
                  style={[
                    styles.activityTime,
                    { color: colors.text.secondary },
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
