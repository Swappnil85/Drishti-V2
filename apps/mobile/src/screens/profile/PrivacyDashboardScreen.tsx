/**
 * Privacy Dashboard Screen
 * Comprehensive privacy settings and data transparency
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Flex, Icon, LoadingState } from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigation } from '@react-navigation/native';
import PrivacyDashboardService from '../../services/profile/PrivacyDashboardService';
import { PrivacyDashboard } from '../../types/profile';

const PrivacyDashboardScreen: React.FC = () => {
  const { buttonTap, toggleSwitch, successFeedback } = useHaptic();
  const navigation = useNavigation();
  
  const [dashboard, setDashboard] = useState<PrivacyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await PrivacyDashboardService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load privacy dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataCollectionToggle = async (category: string, enabled: boolean) => {
    try {
      setUpdating(category);
      await toggleSwitch();
      
      await PrivacyDashboardService.updateDataCollection(category, enabled);
      await loadDashboard();
      await successFeedback();
    } catch (error) {
      Alert.alert('Error', 'Failed to update data collection setting');
    } finally {
      setUpdating(null);
    }
  };

  const handleThirdPartyToggle = async (name: string, enabled: boolean) => {
    try {
      setUpdating(name);
      await toggleSwitch();
      
      await PrivacyDashboardService.updateThirdPartySharing(name, enabled);
      await loadDashboard();
      await successFeedback();
    } catch (error) {
      Alert.alert('Error', 'Failed to update third-party sharing setting');
    } finally {
      setUpdating(null);
    }
  };

  const handleExportPrivacyData = async () => {
    try {
      await buttonTap();
      const data = await PrivacyDashboardService.exportPrivacyData();
      
      // In a real app, you would save this to a file or share it
      Alert.alert(
        'Privacy Data Exported',
        'Your privacy data has been prepared for export.',
        [
          { text: 'OK' }
        ]
      );
      
      await successFeedback();
    } catch (error) {
      Alert.alert('Error', 'Failed to export privacy data');
    }
  };

  const handleResetSettings = async () => {
    Alert.alert(
      'Reset Privacy Settings',
      'This will reset all privacy settings to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await PrivacyDashboardService.resetToDefaults();
              await loadDashboard();
              await successFeedback();
              Alert.alert('Success', 'Privacy settings have been reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset privacy settings');
            }
          },
        },
      ]
    );
  };

  const getPrivacyScoreColor = (score: number): string => {
    if (score >= 80) return 'success.500';
    if (score >= 60) return 'warning.500';
    return 'error.500';
  };

  const getPrivacyScoreText = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading privacy dashboard..." size="lg" />
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="shield-outline" size="xl" color="text.secondary" />
          <Text variant="h6" color="text.secondary" style={styles.errorTitle}>
            Privacy Dashboard Unavailable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const privacyScore = PrivacyDashboardService.getPrivacyScore();
  const dataCollectionSummary = PrivacyDashboardService.getDataCollectionSummary();
  const thirdPartySummary = PrivacyDashboardService.getThirdPartySharingSummary();
  const recommendations = PrivacyDashboardService.getPrivacyRecommendations();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Privacy Score */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Flex direction="row" align="center" justify="space-between">
            <View>
              <Text variant="h6" weight="semiBold">Privacy Score</Text>
              <Text variant="body2" color="text.secondary">
                {getPrivacyScoreText(privacyScore)} privacy protection
              </Text>
            </View>
            
            <View style={styles.scoreContainer}>
              <Text variant="h4" weight="bold" color={getPrivacyScoreColor(privacyScore)}>
                {privacyScore}
              </Text>
              <Text variant="caption" color="text.secondary">/100</Text>
            </View>
          </Flex>
          
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreProgress, 
                { 
                  width: `${privacyScore}%`,
                  backgroundColor: getPrivacyScoreColor(privacyScore) === 'success.500' ? '#10B981' :
                                   getPrivacyScoreColor(privacyScore) === 'warning.500' ? '#F59E0B' : '#EF4444'
                }
              ]} 
            />
          </View>

          {/* Privacy Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.recommendations}>
              <Text variant="body2" weight="medium" style={styles.recommendationsTitle}>
                Privacy Recommendations:
              </Text>
              {recommendations.map((rec, index) => (
                <Text key={index} variant="body2" color="text.secondary" style={styles.recommendation}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </Card>

        {/* Data Collection Overview */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Data Collection Overview
          </Text>
          
          <Flex direction="row" justify="space-around" style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text variant="h6" weight="bold" color="primary.500">
                {dataCollectionSummary.totalCategories}
              </Text>
              <Text variant="caption" color="text.secondary">Total Categories</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text variant="h6" weight="bold" color="success.500">
                {dataCollectionSummary.enabledCategories}
              </Text>
              <Text variant="caption" color="text.secondary">Enabled</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text variant="h6" weight="bold" color="warning.500">
                {dataCollectionSummary.requiredCategories}
              </Text>
              <Text variant="caption" color="text.secondary">Required</Text>
            </View>
          </Flex>
        </Card>

        {/* Data Collection Settings */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Data Collection Settings
          </Text>
          
          <Flex direction="column" gap="lg">
            {dashboard.dataCollected.map((item, index) => (
              <View key={index} style={styles.dataItem}>
                <Flex direction="row" align="flex-start" justify="space-between">
                  <View style={styles.dataInfo}>
                    <Flex direction="row" align="center">
                      <Text variant="body1" weight="medium">{item.category}</Text>
                      {item.required && (
                        <View style={styles.requiredBadge}>
                          <Text variant="caption" color="white">REQUIRED</Text>
                        </View>
                      )}
                    </Flex>
                    <Text variant="body2" color="text.secondary" style={styles.dataDescription}>
                      {item.description}
                    </Text>
                    <Text variant="caption" color="text.tertiary">
                      Purpose: {item.purpose}
                    </Text>
                    <Text variant="caption" color="text.tertiary">
                      Frequency: {item.frequency}
                    </Text>
                  </View>
                  
                  <Switch
                    value={item.enabled}
                    onValueChange={(value) => handleDataCollectionToggle(item.category, value)}
                    disabled={item.required || updating === item.category}
                  />
                </Flex>
              </View>
            ))}
          </Flex>
        </Card>

        {/* Third-Party Sharing */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Third-Party Data Sharing
          </Text>
          
          <View style={styles.thirdPartySummary}>
            <Text variant="body2" color="text.secondary">
              {thirdPartySummary.activePartners} of {thirdPartySummary.totalPartners} partners active
            </Text>
            {thirdPartySummary.dataTypesShared.length > 0 && (
              <Text variant="caption" color="text.tertiary">
                Shared data: {thirdPartySummary.dataTypesShared.join(', ')}
              </Text>
            )}
          </View>
          
          <Flex direction="column" gap="lg" style={styles.thirdPartyList}>
            {dashboard.thirdPartySharing.map((partner, index) => (
              <View key={index} style={styles.partnerItem}>
                <Flex direction="row" align="flex-start" justify="space-between">
                  <View style={styles.partnerInfo}>
                    <Text variant="body1" weight="medium">{partner.name}</Text>
                    <Text variant="body2" color="text.secondary" style={styles.partnerDescription}>
                      {partner.purpose}
                    </Text>
                    <Text variant="caption" color="text.tertiary">
                      Data shared: {partner.dataShared.join(', ')}
                    </Text>
                    <Button
                      variant="ghost"
                      size="xs"
                      onPress={() => {
                        // In a real app, this would open the privacy policy
                        Alert.alert('Privacy Policy', `Would open: ${partner.privacyPolicy}`);
                      }}
                      style={styles.privacyPolicyButton}
                    >
                      <Text variant="caption" color="primary.500">View Privacy Policy</Text>
                    </Button>
                  </View>
                  
                  <Switch
                    value={partner.enabled}
                    onValueChange={(value) => handleThirdPartyToggle(partner.name, value)}
                    disabled={updating === partner.name}
                  />
                </Flex>
              </View>
            ))}
          </Flex>
        </Card>

        {/* Data Retention */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Data Retention Policy
          </Text>
          
          <View style={styles.retentionInfo}>
            <Text variant="body2" color="text.secondary">
              <Text weight="medium">Retention Period:</Text> {dashboard.retentionPolicy.retentionPeriod} days
            </Text>
            <Text variant="body2" color="text.secondary">
              <Text weight="medium">Deletion Method:</Text> {dashboard.retentionPolicy.deletionMethod}
            </Text>
            {dashboard.retentionPolicy.exceptions.length > 0 && (
              <Text variant="body2" color="text.secondary">
                <Text weight="medium">Exceptions:</Text> {dashboard.retentionPolicy.exceptions.join(', ')}
              </Text>
            )}
          </View>
        </Card>

        {/* User Rights */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Your Data Rights
          </Text>
          
          <Flex direction="column" gap="md">
            <Flex direction="row" align="center">
              <Icon 
                name={dashboard.userRights.canExport ? "checkmark-circle" : "close-circle"} 
                size="sm" 
                color={dashboard.userRights.canExport ? "success.500" : "error.500"}
                style={styles.rightIcon}
              />
              <Text variant="body2">Right to data portability (export your data)</Text>
            </Flex>
            
            <Flex direction="row" align="center">
              <Icon 
                name={dashboard.userRights.canDelete ? "checkmark-circle" : "close-circle"} 
                size="sm" 
                color={dashboard.userRights.canDelete ? "success.500" : "error.500"}
                style={styles.rightIcon}
              />
              <Text variant="body2">Right to erasure (delete your data)</Text>
            </Flex>
            
            <Flex direction="row" align="center">
              <Icon 
                name={dashboard.userRights.canCorrect ? "checkmark-circle" : "close-circle"} 
                size="sm" 
                color={dashboard.userRights.canCorrect ? "success.500" : "error.500"}
                style={styles.rightIcon}
              />
              <Text variant="body2">Right to rectification (correct your data)</Text>
            </Flex>
            
            <Flex direction="row" align="center">
              <Icon 
                name={dashboard.userRights.canRestrict ? "checkmark-circle" : "close-circle"} 
                size="sm" 
                color={dashboard.userRights.canRestrict ? "success.500" : "error.500"}
                style={styles.rightIcon}
              />
              <Text variant="body2">Right to restrict processing</Text>
            </Flex>
          </Flex>
        </Card>

        {/* Actions */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Privacy Actions
          </Text>
          
          <Flex direction="column" gap="md">
            <Button
              variant="outline"
              size="lg"
              onPress={handleExportPrivacyData}
              style={styles.actionButton}
            >
              <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                <Flex direction="row" align="center">
                  <Icon name="download" size="md" color="primary.500" style={styles.actionIcon} />
                  <Text variant="body1" weight="medium">Export Privacy Data</Text>
                </Flex>
                <Icon name="chevron-forward" size="sm" color="text.secondary" />
              </Flex>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onPress={handleResetSettings}
              style={[styles.actionButton, styles.dangerButton]}
            >
              <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                <Flex direction="row" align="center">
                  <Icon name="refresh" size="md" color="error.500" style={styles.actionIcon} />
                  <Text variant="body1" weight="medium" color="error.500">Reset to Defaults</Text>
                </Flex>
                <Icon name="chevron-forward" size="sm" color="error.500" />
              </Flex>
            </Button>
          </Flex>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  recommendations: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  recommendationsTitle: {
    marginBottom: 8,
  },
  recommendation: {
    marginBottom: 4,
    lineHeight: 18,
  },
  summaryGrid: {
    marginTop: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  dataItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dataInfo: {
    flex: 1,
    marginRight: 16,
  },
  dataDescription: {
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
  },
  requiredBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  thirdPartySummary: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  thirdPartyList: {
    marginTop: 8,
  },
  partnerItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  partnerInfo: {
    flex: 1,
    marginRight: 16,
  },
  partnerDescription: {
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
  },
  privacyPolicyButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 0,
  },
  retentionInfo: {
    gap: 8,
  },
  rightIcon: {
    marginRight: 12,
  },
  actionButton: {
    paddingVertical: 16,
  },
  actionContent: {
    width: '100%',
  },
  actionIcon: {
    marginRight: 12,
  },
  dangerButton: {
    borderColor: '#EF4444',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    marginTop: 16,
  },
});

export default PrivacyDashboardScreen;
