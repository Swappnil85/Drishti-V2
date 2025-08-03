/**
 * Profile Screen
 * Main profile management screen with overview and navigation
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Flex, Icon, Avatar, LoadingState } from '../../components/ui';
import { useProfile } from '../../contexts/ProfileContext';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen: React.FC = () => {
  const {
    profile,
    recommendations,
    loading,
    error,
    isProfileComplete,
    hasRecommendations,
    securityScore,
    exportProfileData,
    deleteProfile,
  } = useProfile();
  
  const { buttonTap, successFeedback, errorFeedback } = useHaptic();
  const navigation = useNavigation();
  const [exporting, setExporting] = useState(false);

  const handleEditProfile = async () => {
    await buttonTap();
    navigation.navigate('EditProfile' as never);
  };

  const handleSecuritySettings = async () => {
    await buttonTap();
    navigation.navigate('SecuritySettings' as never);
  };

  const handleRecommendations = async () => {
    await buttonTap();
    navigation.navigate('Recommendations' as never);
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      await buttonTap();
      
      Alert.alert(
        'Export Profile Data',
        'Choose export format:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setExporting(false),
          },
          {
            text: 'JSON',
            onPress: async () => {
              try {
                const filePath = await exportProfileData('json');
                await successFeedback();
                Alert.alert('Success', `Profile data exported to: ${filePath}`);
              } catch (err) {
                await errorFeedback();
                Alert.alert('Error', 'Failed to export profile data');
              } finally {
                setExporting(false);
              }
            },
          },
          {
            text: 'CSV',
            onPress: async () => {
              try {
                const filePath = await exportProfileData('csv');
                await successFeedback();
                Alert.alert('Success', `Profile data exported to: ${filePath}`);
              } catch (err) {
                await errorFeedback();
                Alert.alert('Error', 'Failed to export profile data');
              } finally {
                setExporting(false);
              }
            },
          },
        ]
      );
    } catch (err) {
      setExporting(false);
      await errorFeedback();
    }
  };

  const handleDeleteProfile = async () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile();
              await successFeedback();
              Alert.alert('Success', 'Profile deleted successfully');
            } catch (err) {
              await errorFeedback();
              Alert.alert('Error', 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSecurityScoreColor = (score: number): string => {
    if (score >= 80) return 'success.500';
    if (score >= 60) return 'warning.500';
    return 'error.500';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading profile..." size="lg" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size="xl" color="error.500" />
          <Text variant="h6" color="error.500" style={styles.errorTitle}>
            Error Loading Profile
          </Text>
          <Text variant="body2" color="text.secondary" align="center" style={styles.errorMessage}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="person-add" size="xl" color="text.secondary" />
          <Text variant="h6" color="text.secondary" style={styles.emptyTitle}>
            No Profile Found
          </Text>
          <Text variant="body2" color="text.tertiary" align="center" style={styles.emptyMessage}>
            Create your profile to get started with personalized FIRE planning.
          </Text>
          <Button variant="primary" size="lg" onPress={handleEditProfile} style={styles.createButton}>
            Create Profile
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card variant="elevated" padding="lg" style={styles.headerCard}>
          <Flex direction="row" align="center" style={styles.profileHeader}>
            <Avatar
              size="lg"
              source={profile.personalInfo.profilePicture}
              fallback={`${profile.personalInfo.firstName?.[0] || ''}${profile.personalInfo.lastName?.[0] || ''}`}
            />
            
            <View style={styles.profileInfo}>
              <Text variant="h5" weight="bold">
                {profile.personalInfo.firstName} {profile.personalInfo.lastName}
              </Text>
              <Text variant="body2" color="text.secondary">
                {profile.personalInfo.email}
              </Text>
              <Flex direction="row" align="center" style={styles.completionStatus}>
                <Icon 
                  name={isProfileComplete ? "checkmark-circle" : "alert-circle"} 
                  size="sm" 
                  color={isProfileComplete ? "success.500" : "warning.500"} 
                />
                <Text variant="caption" color={isProfileComplete ? "success.500" : "warning.500"}>
                  {isProfileComplete ? "Profile Complete" : "Profile Incomplete"}
                </Text>
              </Flex>
            </View>
            
            <Button variant="ghost" size="sm" onPress={handleEditProfile}>
              <Icon name="create" size="md" color="primary.500" />
            </Button>
          </Flex>
        </Card>

        {/* Financial Overview */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Financial Overview
          </Text>
          
          <Flex direction="row" justify="space-between" style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <Text variant="caption" color="text.secondary">Annual Income</Text>
              <Text variant="h6" weight="bold" color="success.500">
                {formatCurrency(profile.financialInfo.totalAnnualIncome)}
              </Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text variant="caption" color="text.secondary">Current Savings</Text>
              <Text variant="h6" weight="bold" color="primary.500">
                {formatCurrency(profile.financialInfo.currentSavings)}
              </Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text variant="caption" color="text.secondary">FIRE Number</Text>
              <Text variant="h6" weight="bold" color="warning.500">
                {formatCurrency(profile.financialInfo.fireNumber)}
              </Text>
            </View>
          </Flex>
          
          <Flex direction="row" justify="space-between" style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <Text variant="caption" color="text.secondary">Savings Rate</Text>
              <Text variant="h6" weight="bold">
                {(profile.financialInfo.savingsRate * 100).toFixed(1)}%
              </Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text variant="caption" color="text.secondary">Years to FIRE</Text>
              <Text variant="h6" weight="bold">
                {profile.financialInfo.yearsToFire === Infinity 
                  ? '∞' 
                  : profile.financialInfo.yearsToFire.toFixed(1)
                }
              </Text>
            </View>
            
            <View style={styles.financialItem}>
              <Text variant="caption" color="text.secondary">Risk Tolerance</Text>
              <Text variant="h6" weight="bold" style={styles.riskTolerance}>
                {profile.financialInfo.riskTolerance.charAt(0).toUpperCase() + 
                 profile.financialInfo.riskTolerance.slice(1)}
              </Text>
            </View>
          </Flex>
        </Card>

        {/* Quick Actions */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          
          <Flex direction="column" gap="md">
            <Button
              variant="outline"
              size="lg"
              onPress={handleEditProfile}
              style={styles.actionButton}
            >
              <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                <Flex direction="row" align="center">
                  <Icon name="create" size="md" color="primary.500" style={styles.actionIcon} />
                  <Text variant="body1" weight="medium">Edit Profile</Text>
                </Flex>
                <Icon name="chevron-forward" size="sm" color="text.secondary" />
              </Flex>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onPress={handleSecuritySettings}
              style={styles.actionButton}
            >
              <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                <Flex direction="row" align="center">
                  <Icon name="shield-checkmark" size="md" color="primary.500" style={styles.actionIcon} />
                  <View>
                    <Text variant="body1" weight="medium">Security Settings</Text>
                    <Text variant="caption" color={getSecurityScoreColor(securityScore)}>
                      Security Score: {securityScore}/100
                    </Text>
                  </View>
                </Flex>
                <Icon name="chevron-forward" size="sm" color="text.secondary" />
              </Flex>
            </Button>
            
            {hasRecommendations && (
              <Button
                variant="outline"
                size="lg"
                onPress={handleRecommendations}
                style={styles.actionButton}
              >
                <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                  <Flex direction="row" align="center">
                    <Icon name="bulb" size="md" color="warning.500" style={styles.actionIcon} />
                    <View>
                      <Text variant="body1" weight="medium">Recommendations</Text>
                      <Text variant="caption" color="warning.500">
                        {recommendations.filter(r => !r.dismissed && !r.accepted).length} new
                      </Text>
                    </View>
                  </Flex>
                  <Icon name="chevron-forward" size="sm" color="text.secondary" />
                </Flex>
              </Button>
            )}
          </Flex>
        </Card>

        {/* Data Management */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Data Management
          </Text>
          
          <Flex direction="column" gap="md">
            <Button
              variant="outline"
              size="lg"
              onPress={handleExportData}
              loading={exporting}
              style={styles.actionButton}
            >
              <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                <Flex direction="row" align="center">
                  <Icon name="download" size="md" color="info.500" style={styles.actionIcon} />
                  <Text variant="body1" weight="medium">Export Data</Text>
                </Flex>
                <Icon name="chevron-forward" size="sm" color="text.secondary" />
              </Flex>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onPress={handleDeleteProfile}
              style={[styles.actionButton, styles.dangerButton]}
            >
              <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                <Flex direction="row" align="center">
                  <Icon name="trash" size="md" color="error.500" style={styles.actionIcon} />
                  <Text variant="body1" weight="medium" color="error.500">Delete Profile</Text>
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
  headerCard: {
    marginBottom: 16,
  },
  profileHeader: {
    marginBottom: 0,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  completionStatus: {
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  financialGrid: {
    marginBottom: 16,
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  riskTolerance: {
    textTransform: 'capitalize',
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
    marginBottom: 8,
  },
  errorMessage: {
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    marginBottom: 32,
    lineHeight: 20,
  },
  createButton: {
    minWidth: 200,
  },
});

export default ProfileScreen;
