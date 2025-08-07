/**
 * ChartAccessibility Component
 * Epic 10, Story 3: Accessibility Support for Charts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Card, Icon, Button, Flex } from '../ui';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptic } from '../../hooks/useHaptic';

interface ChartAccessibilityProps {
  chartData: ChartDataPoint[];
  chartType: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  onNavigateToDataPoint?: (index: number) => void;
  onExportAccessibleData?: (format: 'table' | 'audio' | 'text') => void;
  highContrastMode?: boolean;
  onHighContrastToggle?: (enabled: boolean) => void;
}

interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  metadata?: {
    description?: string;
    trend?: 'increasing' | 'decreasing' | 'stable';
    significance?: 'low' | 'medium' | 'high';
    [key: string]: any;
  };
}

interface AccessibilitySettings {
  enableAudioDescriptions: boolean;
  enableHapticFeedback: boolean;
  enableVoiceNavigation: boolean;
  highContrastMode: boolean;
  simplifiedView: boolean;
  audioSpeed: number;
  hapticIntensity: number;
}

export const ChartAccessibility: React.FC<ChartAccessibilityProps> = ({
  chartData,
  chartType,
  title,
  onNavigateToDataPoint,
  onExportAccessibleData,
  highContrastMode = false,
  onHighContrastToggle,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    enableAudioDescriptions: true,
    enableHapticFeedback: true,
    enableVoiceNavigation: false,
    highContrastMode,
    simplifiedView: false,
    audioSpeed: 1.0,
    hapticIntensity: 0.7,
  });

  const [currentDataPointIndex, setCurrentDataPointIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioDescriptionText, setAudioDescriptionText] = useState('');

  const { theme } = useTheme();
  const { buttonTap, impactLight, impactMedium } = useHaptic();

  useEffect(() => {
    generateAudioDescription();
  }, [chartData, chartType, title]);

  const generateAudioDescription = () => {
    const totalPoints = chartData.length;
    const values = chartData.map(d => d.y);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    let description = `${title}. This is a ${chartType} chart with ${totalPoints} data points. `;

    // Add trend analysis
    const trend = analyzeTrend(values);
    description += `Overall trend: ${trend}. `;

    // Add value range
    description += `Values range from ${formatValue(minValue)} to ${formatValue(maxValue)}, with an average of ${formatValue(avgValue)}. `;

    // Add significant points
    const significantPoints = findSignificantPoints(chartData);
    if (significantPoints.length > 0) {
      description += `Notable points include: ${significantPoints
        .map(p => `${p.label || p.x} at ${formatValue(p.y)}`)
        .join(', ')}. `;
    }

    setAudioDescriptionText(description);
  };

  const analyzeTrend = (values: number[]): string => {
    if (values.length < 2) return 'insufficient data';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(percentChange) < 5) return 'stable';
    return percentChange > 0 ? 'increasing' : 'decreasing';
  };

  const findSignificantPoints = (data: ChartDataPoint[]): ChartDataPoint[] => {
    const values = data.map(d => d.y);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return data.filter(
      point =>
        point.y === minValue ||
        point.y === maxValue ||
        point.metadata?.significance === 'high'
    );
  };

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} million`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} thousand`;
    }
    return value.toFixed(2);
  };

  const playAudioDescription = async () => {
    if (isPlayingAudio) {
      Speech.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    await buttonTap();

    try {
      await Speech.speak(audioDescriptionText, {
        language: 'en-US',
        pitch: 1.0,
        rate: settings.audioSpeed,
        onDone: () => setIsPlayingAudio(false),
        onStopped: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    } catch (error) {
      console.error('Audio description failed:', error);
      setIsPlayingAudio(false);
    }
  };

  const navigateDataPoints = async (direction: 'next' | 'previous') => {
    const newIndex =
      direction === 'next'
        ? Math.min(currentDataPointIndex + 1, chartData.length - 1)
        : Math.max(currentDataPointIndex - 1, 0);

    if (newIndex !== currentDataPointIndex) {
      setCurrentDataPointIndex(newIndex);
      await impactLight();

      const dataPoint = chartData[newIndex];
      const description = `Data point ${newIndex + 1} of ${chartData.length}. ${dataPoint.label || dataPoint.x}: ${formatValue(dataPoint.y)}`;

      if (settings.enableAudioDescriptions) {
        Speech.speak(description, {
          language: 'en-US',
          rate: settings.audioSpeed,
        });
      }

      onNavigateToDataPoint?.(newIndex);
    }
  };

  const updateSetting = async (
    key: keyof AccessibilitySettings,
    value: any
  ) => {
    await buttonTap();
    setSettings(prev => ({ ...prev, [key]: value }));

    if (key === 'highContrastMode') {
      onHighContrastToggle?.(value);
    }
  };

  const exportAccessibleData = async (format: 'table' | 'audio' | 'text') => {
    await buttonTap();
    onExportAccessibleData?.(format);
  };

  const renderDataTable = () => (
    <View style={styles.dataTable}>
      <Text style={[styles.tableTitle, { color: theme.colors.text }]}>
        Data Table View
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { color: theme.colors.text }]}>
              Point
            </Text>
            <Text style={[styles.tableHeader, { color: theme.colors.text }]}>
              Label
            </Text>
            <Text style={[styles.tableHeader, { color: theme.colors.text }]}>
              Value
            </Text>
            <Text style={[styles.tableHeader, { color: theme.colors.text }]}>
              Description
            </Text>
          </View>

          {/* Data rows */}
          {chartData.map((point, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tableRow,
                currentDataPointIndex === index && styles.selectedRow,
                {
                  backgroundColor:
                    currentDataPointIndex === index
                      ? theme.colors.primary + '20'
                      : 'transparent',
                },
              ]}
              onPress={() => {
                setCurrentDataPointIndex(index);
                onNavigateToDataPoint?.(index);
              }}
              accessible
              accessibilityLabel={`Data point ${index + 1}: ${point.label || point.x}, value ${formatValue(point.y)}`}
              accessibilityRole='button'
            >
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                {index + 1}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                {point.label || point.x}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                {formatValue(point.y)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {point.metadata?.description || 'No description'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderNavigationControls = () => (
    <View style={styles.navigationControls}>
      <Text style={[styles.controlsTitle, { color: theme.colors.text }]}>
        Voice Navigation
      </Text>

      <Flex
        direction='row'
        align='center'
        gap='md'
        style={styles.navigationButtons}
      >
        <Button
          title='Previous'
          variant='outline'
          size='sm'
          leftIcon='chevron-left'
          onPress={() => navigateDataPoints('previous')}
          disabled={currentDataPointIndex === 0}
          accessible
          accessibilityLabel='Navigate to previous data point'
        />

        <View style={styles.currentPointInfo}>
          <Text style={[styles.currentPointText, { color: theme.colors.text }]}>
            {currentDataPointIndex + 1} of {chartData.length}
          </Text>
          <Text
            style={[styles.currentPointValue, { color: theme.colors.primary }]}
          >
            {formatValue(chartData[currentDataPointIndex]?.y || 0)}
          </Text>
        </View>

        <Button
          title='Next'
          variant='outline'
          size='sm'
          rightIcon='chevron-right'
          onPress={() => navigateDataPoints('next')}
          disabled={currentDataPointIndex === chartData.length - 1}
          accessible
          accessibilityLabel='Navigate to next data point'
        />
      </Flex>
    </View>
  );

  const renderAccessibilitySettings = () => (
    <View style={styles.accessibilitySettings}>
      <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>
        Accessibility Settings
      </Text>

      {[
        {
          key: 'enableAudioDescriptions',
          label: 'Audio Descriptions',
          icon: 'volume-2',
        },
        {
          key: 'enableHapticFeedback',
          label: 'Haptic Feedback',
          icon: 'smartphone',
        },
        {
          key: 'enableVoiceNavigation',
          label: 'Voice Navigation',
          icon: 'mic',
        },
        { key: 'highContrastMode', label: 'High Contrast Mode', icon: 'eye' },
        { key: 'simplifiedView', label: 'Simplified View', icon: 'minimize-2' },
      ].map(setting => (
        <View key={setting.key} style={styles.settingRow}>
          <Flex direction='row' align='center' gap='sm'>
            <Icon name={setting.icon} size={16} color={theme.colors.text} />
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              {setting.label}
            </Text>
          </Flex>
          <Switch
            value={
              settings[setting.key as keyof AccessibilitySettings] as boolean
            }
            onValueChange={value =>
              updateSetting(setting.key as keyof AccessibilitySettings, value)
            }
            trackColor={{
              false: theme.colors.surface,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.onPrimary}
          />
        </View>
      ))}
    </View>
  );

  const renderExportOptions = () => (
    <View style={styles.exportOptions}>
      <Text style={[styles.exportTitle, { color: theme.colors.text }]}>
        Export Accessible Data
      </Text>

      <Flex direction='row' gap='sm' style={styles.exportButtons}>
        <Button
          title='Table'
          variant='outline'
          size='sm'
          leftIcon='grid'
          onPress={() => exportAccessibleData('table')}
          accessible
          accessibilityLabel='Export data as accessible table'
        />

        <Button
          title='Audio'
          variant='outline'
          size='sm'
          leftIcon='headphones'
          onPress={() => exportAccessibleData('audio')}
          accessible
          accessibilityLabel='Export data as audio description'
        />

        <Button
          title='Text'
          variant='outline'
          size='sm'
          leftIcon='file-text'
          onPress={() => exportAccessibleData('text')}
          accessible
          accessibilityLabel='Export data as text description'
        />
      </Flex>
    </View>
  );

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Chart Accessibility
        </Text>

        <TouchableOpacity
          style={[
            styles.audioButton,
            {
              backgroundColor: isPlayingAudio
                ? theme.colors.warning
                : theme.colors.primary,
            },
          ]}
          onPress={playAudioDescription}
          accessible
          accessibilityLabel={
            isPlayingAudio ? 'Stop audio description' : 'Play audio description'
          }
          accessibilityRole='button'
        >
          <Icon
            name={isPlayingAudio ? 'pause' : 'play'}
            size={16}
            color={theme.colors.onPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderNavigationControls()}
        {renderDataTable()}
        {renderAccessibilitySettings()}
        {renderExportOptions()}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  audioButton: {
    padding: 12,
    borderRadius: 20,
  },
  navigationControls: {
    marginBottom: 24,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  navigationButtons: {
    justifyContent: 'center',
  },
  currentPointInfo: {
    alignItems: 'center',
    minWidth: 80,
  },
  currentPointText: {
    fontSize: 12,
    marginBottom: 4,
  },
  currentPointValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataTable: {
    marginBottom: 24,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedRow: {
    borderRadius: 4,
  },
  tableHeader: {
    fontWeight: '600',
    fontSize: 12,
    width: 80,
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 12,
    width: 80,
    textAlign: 'center',
  },
  accessibilitySettings: {
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 14,
  },
  exportOptions: {},
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  exportButtons: {
    justifyContent: 'center',
  },
});
