import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { deviceIntegrityEnhanced, SecurityScoreData } from '../../services/security/DeviceIntegrityEnhanced';

export const SecurityScoreScreen: React.FC = () => {
  const [scoreData, setScoreData] = useState<SecurityScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [educationContent, setEducationContent] = useState<Array<{title: string; content: string; priority: 'high' | 'medium' | 'low'}>>([]);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [score, education] = await Promise.all([
        deviceIntegrityEnhanced.getSecurityScore(),
        deviceIntegrityEnhanced.getSecurityEducationContent()
      ]);
      setScoreData(score);
      setEducationContent(education);
    } catch (error) {
      console.error('Failed to load security data:', error);
      Alert.alert('Error', 'Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const refreshScore = async () => {
    try {
      const score = await deviceIntegrityEnhanced.getSecurityScore(true);
      setScoreData(score);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh security score');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    if (score >= 40) return '#FF5722'; // Red-Orange
    return '#F44336'; // Red
  };

  const getRiskLevelText = (riskLevel: SecurityScoreData['riskLevel']) => {
    switch (riskLevel) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      case 'critical': return 'Critical Risk';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading security information...</Text>
      </View>
    );
  }

  if (!scoreData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load security information</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSecurityData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Security Score</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshScore}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Security Score Circle */}
      <View style={styles.scoreContainer}>
        <View style={[styles.scoreCircle, { borderColor: getScoreColor(scoreData.score) }]}>
          <Text style={[styles.scoreText, { color: getScoreColor(scoreData.score) }]}>
            {scoreData.score}
          </Text>
          <Text style={styles.scoreLabel}>Security Score</Text>
        </View>
        <Text style={[styles.riskLevel, { color: getScoreColor(scoreData.score) }]}>
          {getRiskLevelText(scoreData.riskLevel)}
        </Text>
      </View>

      {/* Security Factors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Factors</Text>
        {scoreData.factors.map((factor, index) => (
          <View key={index} style={styles.factorItem}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorName}>{factor.name}</Text>
              <Text style={[
                styles.factorImpact,
                { color: factor.impact >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {factor.impact >= 0 ? '+' : ''}{factor.impact}
              </Text>
            </View>
            <Text style={styles.factorDescription}>{factor.description}</Text>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {scoreData.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationText}>• {recommendation}</Text>
          </View>
        ))}
      </View>

      {/* Security Education */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Tips</Text>
        {educationContent.map((item, index) => (
          <View key={index} style={styles.educationItem}>
            <Text style={[
              styles.educationTitle,
              { color: item.priority === 'high' ? '#F44336' : '#333' }
            ]}>
              {item.title}
            </Text>
            <Text style={styles.educationContent}>{item.content}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.lastUpdated}>
        Last updated: {new Date(scoreData.lastUpdated).toLocaleString()}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  factorItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  factorImpact: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  factorDescription: {
    fontSize: 14,
    color: '#666',
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  educationItem: {
    marginBottom: 16,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  educationContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 50,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
