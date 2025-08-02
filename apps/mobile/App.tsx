import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import DatabaseTest from './src/components/DatabaseTest';
import BiometricAuth from './src/components/BiometricAuth';

type TabType = 'database' | 'biometric';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('database');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drishti</Text>
        <Text style={styles.subtitle}>AI-Powered Visual Assistance</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'database' && styles.activeTab]}
          onPress={() => setActiveTab('database')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'database' && styles.activeTabText,
            ]}
          >
            Database
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'biometric' && styles.activeTab]}
          onPress={() => setActiveTab('biometric')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'biometric' && styles.activeTabText,
            ]}
          >
            Biometric Auth
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'database' ? <DatabaseTest /> : <BiometricAuth />}

      <StatusBar style='auto' />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
});
