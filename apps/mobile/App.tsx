import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

// Ultra-minimal app without any Expo dependencies that might cause conflicts
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Drishti App</Text>
      <Text style={styles.subtitle}>✅ Mobile Working!</Text>
      <Text style={styles.info}>
        Platform: {Platform.OS} - No SafeArea conflicts
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007AFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#00AA00',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
