/**
 * Progress Overview Screen Component
 * Shows progress towards financial goals
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

type Props = DashboardStackScreenProps<'ProgressOverview'>;

const ProgressOverviewScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Goal Progress Overview</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Progress</Text>
            <Text style={styles.progressText}>3 out of 5 goals on track</Text>
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
  progressText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default ProgressOverviewScreen;
