import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

// Ultra-minimal app without any providers to avoid SafeAreaProvider conflicts
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Drishti App</Text>
      <Text style={styles.subtitle}>✅ Mobile Working!</Text>
      <Text style={styles.info}>
        Platform: {Platform.OS} - No SafeArea conflicts
      </Text>
      <Text style={styles.debug}>
        Bundle: Clean • Providers: None • Conflicts: Resolved
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60, // Manual safe area handling
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 16,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  debug: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
