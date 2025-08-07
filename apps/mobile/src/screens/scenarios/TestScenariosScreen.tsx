/**
 * Test Scenarios Screen
 * Simple test screen to debug scenario loading issues
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const TestScenariosScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scenarios Test Screen</Text>
        <Text style={styles.subtitle}>
          This is a test screen to verify navigation works
        </Text>
        <Text style={styles.description}>
          If you can see this screen, the basic navigation is working.
          The issue is likely with the useScenarios hook or ScenarioService.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TestScenariosScreen;
