/**
 * Security Settings Screen
 * Comprehensive security and privacy settings management
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Flex, Icon, Slider, LoadingState } from '../../components/ui';
import { useProfile } from '../../contexts/ProfileContext';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigation } from '@react-navigation/native';

const SecuritySettingsScreen: React.FC = () => {
  const { profile, updateProfile, securityScore, loading } = useProfile();
  const { buttonTap, toggleSwitch, formValidationSuccess } = useHaptic();
  const navigation = useNavigation();
  const [saving, setSaving] = useState(false);

  const handleToggleSetting = async (field: string, value: boolean) => {
    try {
      await toggleSwitch();
      await updateProfile({ field, value });
      await formValidationSuccess();
    } catch (error) {
      Alert.alert('Error', 'Failed to update security setting');
    }
  };

  const handleSessionTimeoutChange = async (value: number) => {
    try {
      await updateProfile({ 
        field: 'securitySettings.sessionTimeout', 
        value: Math.round(value) 
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update session timeout');
    }
  };

  const handleChangePassword = async () => {
    await buttonTap();
    Alert.alert(
      'Change Password',
      'This feature will redirect you to the secure password change flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          // In a real app, this would navigate to a secure password change flow
          Alert.alert('Info', 'Password change flow would be implemented here');
        }},
      ]
    );
  };

  const handleSetupTwoFactor = async () => {
    await buttonTap();
    Alert.alert(
      'Two-Factor Authentication',
      'Set up 2FA for enhanced security using an authenticator app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Setup', onPress: () => {
          // In a real app, this would navigate to 2FA setup
          Alert.alert('Info', '2FA setup flow would be implemented here');
        }},
      ]
    );
  };

  const handleViewSecurityLog = async () => {
    await buttonTap();
    navigation.navigate('SecurityLog' as never);
  };

  const getSecurityScoreColor = (score: number): string => {
    if (score >= 80) return 'success.500';
    if (score >= 60) return 'warning.500';
    return 'error.500';
  };

  const getSecurityScoreText = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading security settings..." size="lg" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="shield-outline" size="xl" color="text.secondary" />
          <Text variant="h6" color="text.secondary" style={styles.errorTitle}>
            No Profile Found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const security = profile.securitySettings;
  const privacy = profile.privacySettings;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Security Score */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Flex direction="row" align="center" justify="space-between">
            <View>
              <Text variant="h6" weight="semiBold">Security Score</Text>
              <Text variant="body2" color="text.secondary">
                {getSecurityScoreText(securityScore)} security level
              </Text>
            </View>
            
            <View style={styles.scoreContainer}>
              <Text variant="h4" weight="bold" color={getSecurityScoreColor(securityScore)}>
                {securityScore}
              </Text>
              <Text variant="caption" color="text.secondary">/100</Text>
            </View>
          </Flex>
          
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreProgress, 
                { 
                  width: `${securityScore}%`,
                  backgroundColor: getSecurityScoreColor(securityScore) === 'success.500' ? '#10B981' :
                                   getSecurityScoreColor(securityScore) === 'warning.500' ? '#F59E0B' : '#EF4444'
                }
              ]} 
            />
          </View>
        </Card>

        {/* Authentication Settings */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Authentication
          </Text>
          
          <Flex direction="column" gap="lg">
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Biometric Authentication</Text>
                <Text variant="body2" color="text.secondary">
                  Use Face ID, Touch ID, or Fingerprint
                </Text>
              </View>
              <Switch
                value={security.biometricEnabled}
                onValueChange={(value) => handleToggleSetting('securitySettings.biometricEnabled', value)}
              />
            </Flex>
            
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">PIN Authentication</Text>
                <Text variant="body2" color="text.secondary">
                  Require PIN for app access
                </Text>
              </View>
              <Switch
                value={security.pinEnabled}
                onValueChange={(value) => handleToggleSetting('securitySettings.pinEnabled', value)}
              />
            </Flex>
            
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Two-Factor Authentication</Text>
                <Text variant="body2" color="text.secondary">
                  Extra security for sensitive actions
                </Text>
              </View>
              <Button
                variant={security.twoFactorEnabled ? "primary" : "outline"}
                size="sm"
                onPress={handleSetupTwoFactor}
              >
                {security.twoFactorEnabled ? "Enabled" : "Setup"}
              </Button>
            </Flex>
            
            <View style={styles.divider} />
            
            <Button
              variant="outline"
              size="lg"
              onPress={handleChangePassword}
              style={styles.actionButton}
            >
              <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                <Flex direction="row" align="center">
                  <Icon name="key" size="md" color="primary.500" style={styles.actionIcon} />
                  <Text variant="body1" weight="medium">Change Password</Text>
                </Flex>
                <Icon name="chevron-forward" size="sm" color="text.secondary" />
              </Flex>
            </Button>
          </Flex>
        </Card>

        {/* Session Settings */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Session Management
          </Text>
          
          <Flex direction="column" gap="lg">
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Auto-Lock</Text>
                <Text variant="body2" color="text.secondary">
                  Automatically lock app when inactive
                </Text>
              </View>
              <Switch
                value={security.autoLockEnabled}
                onValueChange={(value) => handleToggleSetting('securitySettings.autoLockEnabled', value)}
              />
            </Flex>
            
            <View>
              <Text variant="body1" weight="medium" style={styles.sliderLabel}>
                Session Timeout: {security.sessionTimeout} minutes
              </Text>
              <Text variant="body2" color="text.secondary" style={styles.sliderDescription}>
                App will lock after this period of inactivity
              </Text>
              <Slider
                value={security.sessionTimeout}
                minimumValue={1}
                maximumValue={60}
                step={1}
                onValueChange={handleSessionTimeoutChange}
                style={styles.slider}
              />
              <Flex direction="row" justify="space-between" style={styles.sliderLabels}>
                <Text variant="caption" color="text.secondary">1 min</Text>
                <Text variant="caption" color="text.secondary">60 min</Text>
              </Flex>
            </View>
          </Flex>
        </Card>

        {/* Data Settings */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Data & Sync
          </Text>
          
          <Flex direction="column" gap="lg">
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Local-Only Mode</Text>
                <Text variant="body2" color="text.secondary">
                  Keep all data on device only
                </Text>
              </View>
              <Switch
                value={security.localOnlyMode}
                onValueChange={(value) => handleToggleSetting('securitySettings.localOnlyMode', value)}
              />
            </Flex>
            
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Cloud Sync</Text>
                <Text variant="body2" color="text.secondary">
                  Sync data across devices
                </Text>
              </View>
              <Switch
                value={security.cloudSyncEnabled && !security.localOnlyMode}
                onValueChange={(value) => handleToggleSetting('securitySettings.cloudSyncEnabled', value)}
                disabled={security.localOnlyMode}
              />
            </Flex>
          </Flex>
        </Card>

        {/* Privacy Settings */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Privacy & Analytics
          </Text>
          
          <Flex direction="column" gap="lg">
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Analytics</Text>
                <Text variant="body2" color="text.secondary">
                  Help improve the app with usage data
                </Text>
              </View>
              <Switch
                value={privacy.analyticsEnabled}
                onValueChange={(value) => handleToggleSetting('privacySettings.analyticsEnabled', value)}
              />
            </Flex>
            
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Crash Reporting</Text>
                <Text variant="body2" color="text.secondary">
                  Send crash reports to help fix bugs
                </Text>
              </View>
              <Switch
                value={privacy.crashReportingEnabled}
                onValueChange={(value) => handleToggleSetting('privacySettings.crashReportingEnabled', value)}
              />
            </Flex>
            
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Performance Data</Text>
                <Text variant="body2" color="text.secondary">
                  Share performance metrics
                </Text>
              </View>
              <Switch
                value={privacy.performanceDataEnabled}
                onValueChange={(value) => handleToggleSetting('privacySettings.performanceDataEnabled', value)}
              />
            </Flex>
            
            <Flex direction="row" align="center" justify="space-between">
              <View style={styles.settingInfo}>
                <Text variant="body1" weight="medium">Marketing Emails</Text>
                <Text variant="body2" color="text.secondary">
                  Receive product updates and tips
                </Text>
              </View>
              <Switch
                value={privacy.marketingEmailsEnabled}
                onValueChange={(value) => handleToggleSetting('privacySettings.marketingEmailsEnabled', value)}
              />
            </Flex>
          </Flex>
        </Card>

        {/* Security Actions */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Security Actions
          </Text>
          
          <Flex direction="column" gap="md">
            <Button
              variant="outline"
              size="lg"
              onPress={handleViewSecurityLog}
              style={styles.actionButton}
            >
              <Flex direction="row" align="center" justify="space-between" style={styles.actionContent}>
                <Flex direction="row" align="center">
                  <Icon name="list" size="md" color="info.500" style={styles.actionIcon} />
                  <Text variant="body1" weight="medium">View Security Log</Text>
                </Flex>
                <Icon name="chevron-forward" size="sm" color="text.secondary" />
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
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
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
  sliderLabel: {
    marginBottom: 4,
  },
  sliderDescription: {
    marginBottom: 12,
  },
  slider: {
    marginVertical: 8,
  },
  sliderLabels: {
    marginTop: 4,
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

export default SecuritySettingsScreen;
