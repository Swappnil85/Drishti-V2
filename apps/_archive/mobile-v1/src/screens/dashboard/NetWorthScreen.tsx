/**
 * Net Worth Screen Component
 * Displays user's net worth details and trends
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { DashboardStackScreenProps } from '../../types/navigation';

type Props = DashboardStackScreenProps<'NetWorth'>;

const NetWorthScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Net Worth Details</Text>
          <Text style={styles.subtitle}>Track your financial progress over time</Text>
          
          {/* Placeholder content */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Net Worth</Text>
            <Text style={styles.amount}>$125,430</Text>
            <Text style={styles.change}>+$2,340 this month</Text>
          </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  change: {
    fontSize: 16,
    color: '#34C759',
  },
});

export default NetWorthScreen;
