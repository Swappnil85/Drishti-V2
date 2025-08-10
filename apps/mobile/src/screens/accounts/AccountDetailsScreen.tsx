/**
 * AccountDetailsScreen Component
 * Account Details screen
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { AccountsStackScreenProps } from '../../types/navigation';
import { useAccountDetail } from '../../hooks/useAccountDetail';

type Props = AccountsStackScreenProps<'AccountDetails'>;

import Sparkline from '../../components/charts/Sparkline';
import { useAccountSparkline } from '../../hooks/useAccountSparkline';

const AccountDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { accountId } = route.params;
  const { data, loading, error, refresh } = useAccountDetail(accountId);
  const spark = useAccountSparkline(accountId, data?.balance);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Account Details</Text>
          {loading && <Text style={styles.subtitle}>Loading...</Text>}
          {error && (
            <Text style={[styles.subtitle, { color: '#B00020' }]}>
              Error: {error}
            </Text>
          )}
          {data && (
            <View>
              <Text style={styles.subtitle}>{data.name}</Text>
              <Text style={styles.row}>Type: {data.account_type}</Text>
              {data.institution && (
                <Text style={styles.row}>Institution: {data.institution}</Text>
              )}
              <Text style={styles.row}>
                Balance:{' '}
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: data.currency,
                }).format(data.balance)}
              </Text>
              {/* Small sparkline of last 12 points from BalanceHistory (fallback to synthetic inside hook) */}
              <Sparkline
                data={
                  spark.data && spark.data.length > 0
                    ? spark.data
                    : Array.from({ length: 12 }, () => data.balance)
                }
                height={60}
                color={'#3B82F6'}
                style={{ marginTop: 12, borderRadius: 6, opacity: 0.7 }}
              />
            </View>
          )}
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
  row: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
});

export default AccountDetailsScreen;
