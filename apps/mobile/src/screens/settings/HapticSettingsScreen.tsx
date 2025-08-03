/**
 * Haptic Settings Screen
 * Configure haptic feedback preferences and test patterns
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SettingsStackScreenProps } from '../../types/navigation';
import {
  ScreenTemplate,
  Card,
  Text,
  Button,
  Flex,
  Icon,
  Container,
} from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';
import { Switch, Slider } from 'react-native';

type Props = SettingsStackScreenProps<'HapticSettings'>;

const HapticSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const {
    isEnabled,
    config,
    setEnabled,
    setIntensity,
    setContextualFeedback,
    testPattern,
    testAllPatterns,
    getStats,
    clearStats,
  } = useHaptic();

  const [stats, setStats] = useState(getStats());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update stats when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      setStats(getStats());
    });

    return unsubscribe;
  }, [navigation, getStats]);

  const handleToggleEnabled = async (enabled: boolean) => {
    await setEnabled(enabled);
    if (enabled) {
      // Test haptic when enabling
      await testPattern('success');
    }
  };

  const handleIntensityChange = async (intensity: number) => {
    await setIntensity(intensity);
    // Test haptic with new intensity
    await testPattern('light');
  };

  const handleContextualFeedbackToggle = async (enabled: boolean) => {
    await setContextualFeedback(enabled);
    if (enabled) {
      await testPattern('selection');
    }
  };

  const handleTestPattern = async (pattern: any) => {
    setLoading(true);
    await testPattern(pattern);
    setLoading(false);
  };

  const handleTestAllPatterns = async () => {
    setLoading(true);
    await testAllPatterns();
    setLoading(false);
    // Update stats after testing
    setStats(getStats());
  };

  const handleClearStats = () => {
    Alert.alert(
      'Clear Statistics',
      'Are you sure you want to clear all haptic feedback statistics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearStats();
            setStats(getStats());
          },
        },
      ]
    );
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <ScreenTemplate
      title="Haptic Feedback"
      showBackButton={true}
      padding="base"
    >
      {/* Main Settings */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
          Haptic Settings
        </Text>

        {/* Enable/Disable Haptics */}
        <Flex direction="row" justify="space-between" align="center" style={styles.settingRow}>
          <Flex direction="column" style={styles.settingInfo}>
            <Text variant="body1" weight="medium">Enable Haptic Feedback</Text>
            <Text variant="caption" color="text.secondary">
              Feel vibrations when interacting with the app
            </Text>
          </Flex>
          <Switch
            value={isEnabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </Flex>

        {/* Intensity Slider */}
        {isEnabled && (
          <Flex direction="column" style={styles.settingRow}>
            <Flex direction="row" justify="space-between" align="center">
              <Text variant="body1" weight="medium">Intensity</Text>
              <Text variant="body2" color="primary.500">
                {Math.round(config.intensity * 100)}%
              </Text>
            </Flex>
            <Text variant="caption" color="text.secondary" style={styles.settingDescription}>
              Adjust the strength of haptic feedback
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              value={config.intensity}
              onValueChange={handleIntensityChange}
              minimumTrackTintColor="#1976d2"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#1976d2"
              step={0.1}
            />
          </Flex>
        )}

        {/* Contextual Feedback */}
        {isEnabled && (
          <Flex direction="row" justify="space-between" align="center" style={styles.settingRow}>
            <Flex direction="column" style={styles.settingInfo}>
              <Text variant="body1" weight="medium">Contextual Feedback</Text>
              <Text variant="caption" color="text.secondary">
                Different patterns for different actions
              </Text>
            </Flex>
            <Switch
              value={config.contextualFeedback}
              onValueChange={handleContextualFeedbackToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={config.contextualFeedback ? '#f5dd4b' : '#f4f3f4'}
            />
          </Flex>
        )}
      </Card>

      {/* Test Patterns */}
      {isEnabled && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
            Test Patterns
          </Text>
          
          <Text variant="body2" color="text.secondary" style={styles.testDescription}>
            Try different haptic patterns to find your preference
          </Text>

          <Flex direction="row" wrap="wrap" gap="sm" style={styles.testButtons}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleTestPattern('light')}
              disabled={loading}
              style={styles.testButton}
            >
              Light
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleTestPattern('medium')}
              disabled={loading}
              style={styles.testButton}
            >
              Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleTestPattern('heavy')}
              disabled={loading}
              style={styles.testButton}
            >
              Heavy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleTestPattern('success')}
              disabled={loading}
              style={styles.testButton}
            >
              Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleTestPattern('warning')}
              disabled={loading}
              style={styles.testButton}
            >
              Warning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleTestPattern('error')}
              disabled={loading}
              style={styles.testButton}
            >
              Error
            </Button>
          </Flex>

          <Button
            variant="primary"
            size="md"
            onPress={handleTestAllPatterns}
            disabled={loading}
            loading={loading}
            style={styles.testAllButton}
          >
            Test All Patterns
          </Button>
        </Card>
      )}

      {/* Statistics */}
      {isEnabled && stats.totalEvents > 0 && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Flex direction="row" justify="space-between" align="center" style={styles.cardHeader}>
            <Text variant="h6" weight="semiBold">Usage Statistics</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleClearStats}
              leftIcon={<Icon name="trash-outline" size="sm" color="error.500" />}
            >
              Clear
            </Button>
          </Flex>

          <Flex direction="row" justify="space-between" style={styles.statsRow}>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {stats.totalEvents}
              </Text>
              <Text variant="caption" color="text.secondary">Total Events</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="success.500">
                {formatPercentage(stats.successRate)}
              </Text>
              <Text variant="caption" color="text.secondary">Success Rate</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {Math.round(stats.averageIntensity * 100)}%
              </Text>
              <Text variant="caption" color="text.secondary">Avg Intensity</Text>
            </Flex>
          </Flex>

          {/* Most Used Patterns */}
          {stats.mostUsedPatterns.length > 0 && (
            <Flex direction="column" style={styles.patternStats}>
              <Text variant="body1" weight="medium" style={styles.statsTitle}>
                Most Used Patterns
              </Text>
              {stats.mostUsedPatterns.slice(0, 3).map((item, index) => (
                <Flex key={item.pattern} direction="row" justify="space-between" align="center" style={styles.statItem}>
                  <Text variant="body2" style={styles.patternName}>
                    {item.pattern.charAt(0).toUpperCase() + item.pattern.slice(1)}
                  </Text>
                  <Text variant="body2" weight="medium" color="primary.500">
                    {item.count} uses
                  </Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>
      )}

      {/* Information */}
      <Card variant="outlined" padding="lg" style={styles.card}>
        <Flex direction="row" align="flex-start" gap="sm">
          <Icon name="information-circle-outline" size="md" color="info.500" />
          <Flex direction="column" style={styles.infoContent}>
            <Text variant="body2" weight="medium" color="info.600">
              About Haptic Feedback
            </Text>
            <Text variant="caption" color="text.secondary" style={styles.infoText}>
              Haptic feedback provides tactile responses to your interactions, making the app feel more responsive and accessible. Different patterns help distinguish between various actions and states.
            </Text>
          </Flex>
        </Flex>
      </Card>
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    marginTop: 4,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  testDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  testButtons: {
    marginBottom: 16,
  },
  testButton: {
    minWidth: 80,
  },
  testAllButton: {
    marginTop: 8,
  },
  statsRow: {
    marginBottom: 16,
  },
  patternStats: {
    marginTop: 8,
  },
  statsTitle: {
    marginBottom: 8,
  },
  statItem: {
    paddingVertical: 4,
  },
  patternName: {
    textTransform: 'capitalize',
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    marginTop: 4,
    lineHeight: 18,
  },
});

export default HapticSettingsScreen;
