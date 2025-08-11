/**
 * Navigation Analytics Screen
 * Dashboard for viewing navigation metrics and analytics
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
  Badge,
  Container,
} from '../../components/ui';
import { useEnhancedNavigation } from '../../contexts/EnhancedNavigationContext';

type Props = SettingsStackScreenProps<'NavigationAnalytics'>;

interface AnalyticsData {
  totalSessions: number;
  averageSessionDuration: number;
  mostVisitedScreens: Array<{ screen: string; count: number }>;
  averageScreenTime: Record<string, number>;
  navigationPaths: Array<{ path: string[]; count: number }>;
  dropOffPoints: Array<{ screen: string; dropOffRate: number }>;
  deepLinkUsage: Record<string, number>;
}

const NavigationAnalyticsScreen: React.FC<Props> = ({ navigation }) => {
  const {
    getNavigationMetrics,
    clearAnalytics,
    getCurrentSession,
    getGestureStats,
    getStorageStats,
    analyticsEnabled,
    setAnalyticsEnabled,
  } = useEnhancedNavigation();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [gestureStats, setGestureStats] = useState<any>(null);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [metricsData, sessionData, gestureData, storageData] = await Promise.all([
        getNavigationMetrics(),
        getCurrentSession(),
        getGestureStats(),
        getStorageStats(),
      ]);

      setAnalytics(metricsData);
      setCurrentSession(sessionData);
      setGestureStats(gestureData);
      setStorageStats(storageData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleClearAnalytics = () => {
    Alert.alert(
      'Clear Analytics',
      'Are you sure you want to clear all navigation analytics data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAnalytics();
            await loadAnalytics();
          },
        },
      ]
    );
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!analyticsEnabled) {
    return (
      <ScreenTemplate
        title="Navigation Analytics"
        showBackButton={true}
        padding="base"
      >
        <Container style={styles.disabledContainer}>
          <Icon name="analytics-outline" size="3xl" color="text.tertiary" />
          <Text variant="h5" weight="semiBold" align="center" style={styles.disabledTitle}>
            Analytics Disabled
          </Text>
          <Text variant="body2" color="text.secondary" align="center" style={styles.disabledMessage}>
            Enable navigation analytics to view detailed metrics about app usage and navigation patterns.
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={() => setAnalyticsEnabled(true)}
            style={styles.enableButton}
          >
            Enable Analytics
          </Button>
        </Container>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      title="Navigation Analytics"
      showBackButton={true}
      loading={loading}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      headerActions={
        <Button
          variant="ghost"
          size="sm"
          onPress={handleClearAnalytics}
          leftIcon={<Icon name="trash-outline" size="sm" color="error.500" />}
        >
          Clear
        </Button>
      }
      padding="base"
    >
      {/* Current Session */}
      {currentSession && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Flex direction="row" justify="space-between" align="center" style={styles.cardHeader}>
            <Text variant="h6" weight="semiBold">Current Session</Text>
            <Badge variant="filled" color="success" size="sm">Live</Badge>
          </Flex>
          
          <Flex direction="row" justify="space-between" style={styles.statsRow}>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {currentSession.totalScreens}
              </Text>
              <Text variant="caption" color="text.secondary">Screens</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {currentSession.uniqueScreens?.size || 0}
              </Text>
              <Text variant="caption" color="text.secondary">Unique</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {currentSession.deepLinks}
              </Text>
              <Text variant="caption" color="text.secondary">Deep Links</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {currentSession.backPresses}
              </Text>
              <Text variant="caption" color="text.secondary">Back Presses</Text>
            </Flex>
          </Flex>
        </Card>
      )}

      {/* Session Overview */}
      {analytics && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
            Session Overview
          </Text>
          
          <Flex direction="row" justify="space-between" style={styles.statsRow}>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {analytics.totalSessions}
              </Text>
              <Text variant="caption" color="text.secondary">Total Sessions</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {formatDuration(analytics.averageSessionDuration)}
              </Text>
              <Text variant="caption" color="text.secondary">Avg Duration</Text>
            </Flex>
          </Flex>
        </Card>
      )}

      {/* Most Visited Screens */}
      {analytics?.mostVisitedScreens && analytics.mostVisitedScreens.length > 0 && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
            Most Visited Screens
          </Text>
          
          {analytics.mostVisitedScreens.slice(0, 5).map((item, index) => (
            <Flex key={item.screen} direction="row" justify="space-between" align="center" style={styles.listItem}>
              <Flex direction="row" align="center" gap="sm">
                <Badge variant="filled" color="neutral" size="sm">
                  {index + 1}
                </Badge>
                <Text variant="body1">{item.screen}</Text>
              </Flex>
              <Text variant="body2" weight="medium" color="primary.500">
                {item.count} visits
              </Text>
            </Flex>
          ))}
        </Card>
      )}

      {/* Gesture Statistics */}
      {gestureStats && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
            Gesture Statistics
          </Text>
          
          <Flex direction="row" justify="space-between" style={styles.statsRow}>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {gestureStats.totalGestures}
              </Text>
              <Text variant="caption" color="text.secondary">Total Gestures</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="success.500">
                {formatPercentage(gestureStats.successRate)}
              </Text>
              <Text variant="caption" color="text.secondary">Success Rate</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {formatDuration(gestureStats.averageGestureDuration)}
              </Text>
              <Text variant="caption" color="text.secondary">Avg Duration</Text>
            </Flex>
          </Flex>
        </Card>
      )}

      {/* Storage Statistics */}
      {storageStats && (
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
            Storage Usage
          </Text>
          
          <Flex direction="row" justify="space-between" style={styles.statsRow}>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                {Math.round(storageStats.size / 1024)} KB
              </Text>
              <Text variant="caption" color="text.secondary">Storage Size</Text>
            </Flex>
            <Flex direction="column" align="center">
              <Text variant="h4" weight="bold" color="primary.500">
                v{storageStats.version || 'N/A'}
              </Text>
              <Text variant="caption" color="text.secondary">Version</Text>
            </Flex>
          </Flex>
          
          {storageStats.lastSaved && (
            <Text variant="caption" color="text.tertiary" align="center" style={styles.lastSaved}>
              Last saved: {new Date(storageStats.lastSaved).toLocaleString()}
            </Text>
          )}
        </Card>
      )}

      {/* Analytics Controls */}
      <Card variant="outlined" padding="lg" style={styles.card}>
        <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
          Analytics Controls
        </Text>
        
        <Flex direction="column" gap="sm">
          <Button
            variant="outline"
            size="md"
            onPress={() => setAnalyticsEnabled(false)}
            leftIcon={<Icon name="pause-outline" size="sm" color="warning.500" />}
            fullWidth
          >
            Disable Analytics
          </Button>
          
          <Button
            variant="outline"
            size="md"
            onPress={handleClearAnalytics}
            leftIcon={<Icon name="trash-outline" size="sm" color="error.500" />}
            fullWidth
          >
            Clear All Data
          </Button>
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
  statsRow: {
    marginBottom: 8,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastSaved: {
    marginTop: 8,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  disabledTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  disabledMessage: {
    marginBottom: 24,
    lineHeight: 22,
  },
  enableButton: {
    minWidth: 150,
  },
});

export default NavigationAnalyticsScreen;
