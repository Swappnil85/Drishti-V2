import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Drishti App</Text>
      <Text style={styles.subtitle}>✅ Working Successfully!</Text>
      <Text style={styles.info}>This is a minimal test version</Text>
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
