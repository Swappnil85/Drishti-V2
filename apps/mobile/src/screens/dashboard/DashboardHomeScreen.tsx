/**
 * Dashboard Home Screen Component
 * Main dashboard with financial overview
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardStackScreenProps } from '../../types/navigation';

type Props = DashboardStackScreenProps<'DashboardHome'>;

const DashboardHomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleNetWorthPress = () => {
    navigation.navigate('NetWorth');
  };

  const handleProgressPress = () => {
    navigation.navigate('ProgressOverview');
  };

  const handleQuickActionsPress = () => {
    navigation.navigate('QuickActions');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Net Worth Card */}
          <TouchableOpacity style={styles.card} onPress={handleNetWorthPress}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Net Worth</Text>
              <Ionicons name="trending-up" size={24} color="#34C759" />
            </View>
            <Text style={styles.netWorthAmount}>$125,430</Text>
            <Text style={styles.netWorthChange}>+$2,340 this month</Text>
          </TouchableOpacity>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Scenarios</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Accounts</Text>
            </View>
          </View>

          {/* Progress Overview */}
          <TouchableOpacity style={styles.card} onPress={handleProgressPress}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Goal Progress</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
            <Text style={styles.progressText}>
              You're on track to reach 3 out of 5 goals this year
            </Text>
          </TouchableOpacity>

          {/* Quick Actions */}
          <TouchableOpacity style={styles.card} onPress={handleQuickActionsPress}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </View>
            <Text style={styles.quickActionsText}>
              Add account, create goal, or run scenario
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 16,
    gap: 16,
  },
  welcomeSection: {
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#666666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  netWorthAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  netWorthChange: {
    fontSize: 16,
    color: '#34C759',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  quickActionsText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
});

export default DashboardHomeScreen;
