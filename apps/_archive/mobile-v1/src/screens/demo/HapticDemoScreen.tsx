/**
 * Haptic Demo Screen
 * Demonstrates all haptic feedback patterns and contexts
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { Switch, Slider } from 'react-native';
import {
  ScreenTemplate,
  Card,
  Text,
  Button,
  Flex,
  Icon,
  Input,
  Container,
} from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';

const HapticDemoScreen: React.FC = () => {
  const {
    isEnabled,
    config,
    setEnabled,
    setIntensity,
    trigger,
    buttonTap,
    toggleSwitch,
    sliderChange,
    swipeAction,
    pullRefresh,
    navigation,
    formValidationError,
    formValidationSuccess,
    achievement,
    milestone,
    errorFeedback,
    successFeedback,
    loadingComplete,
    dataUpdate,
    gestureRecognition,
    modalOpen,
    modalClose,
    tabSwitch,
    longPress,
    doubleTap,
    testPattern,
    testAllPatterns,
    getStats,
  } = useHaptic();

  const [demoText, setDemoText] = useState('');
  const [demoSwitch, setDemoSwitch] = useState(false);
  const [demoSlider, setDemoSlider] = useState(0.5);
  const [loading, setLoading] = useState(false);

  const handleDemoSwitchToggle = async (value: boolean) => {
    setDemoSwitch(value);
    await toggleSwitch(value);
  };

  const handleDemoSliderChange = async (value: number) => {
    setDemoSlider(value);
    await sliderChange();
  };

  const handleFormValidation = async () => {
    if (demoText.length < 3) {
      await formValidationError();
      Alert.alert('Validation Error', 'Text must be at least 3 characters long');
    } else {
      await formValidationSuccess();
      Alert.alert('Validation Success', 'Form is valid!');
    }
  };

  const handleAchievement = async () => {
    await achievement();
    Alert.alert('Achievement Unlocked!', 'You discovered the haptic demo!');
  };

  const handleMilestone = async () => {
    await milestone();
    Alert.alert('Milestone Reached!', 'You completed the haptic tour!');
  };

  const handleLoadingDemo = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await loadingComplete();
    setLoading(false);
    Alert.alert('Loading Complete', 'Data has been loaded successfully!');
  };

  const handleDataUpdate = async () => {
    await dataUpdate();
    Alert.alert('Data Updated', 'Your data has been refreshed!');
  };

  const handleGestureDemo = async () => {
    await gestureRecognition();
    Alert.alert('Gesture Recognized', 'Swipe gesture detected!');
  };

  const handleModalDemo = async () => {
    await modalOpen();
    Alert.alert('Modal Opened', 'This simulates opening a modal', [
      {
        text: 'Close',
        onPress: async () => {
          await modalClose();
        },
      },
    ]);
  };

  const handleTabDemo = async () => {
    await tabSwitch();
    Alert.alert('Tab Switched', 'This simulates switching tabs');
  };

  const handleLongPressDemo = async () => {
    await longPress();
    Alert.alert('Long Press', 'Long press gesture detected!');
  };

  const handleDoubleTapDemo = async () => {
    await doubleTap();
    Alert.alert('Double Tap', 'Double tap gesture detected!');
  };

  const handleTestAllPatterns = async () => {
    setLoading(true);
    await testAllPatterns();
    setLoading(false);
    Alert.alert('Pattern Test Complete', 'All haptic patterns have been tested!');
  };

  const stats = getStats();

  return (
    <ScreenTemplate
      title="Haptic Demo"
      showBackButton={true}
      padding="base"
    >
      {/* Status Card */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <Flex direction="row" justify="space-between" align="center">
          <Text variant="h6" weight="semiBold">Haptic Status</Text>
          <Text variant="body2" color={isEnabled ? 'success.500' : 'error.500'}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </Flex>
        
        <Flex direction="row" justify="space-between" style={styles.statsRow}>
          <Flex direction="column" align="center">
            <Text variant="h4" weight="bold" color="primary.500">
              {Math.round(config.intensity * 100)}%
            </Text>
            <Text variant="caption" color="text.secondary">Intensity</Text>
          </Flex>
          <Flex direction="column" align="center">
            <Text variant="h4" weight="bold" color="primary.500">
              {stats.totalEvents}
            </Text>
            <Text variant="caption" color="text.secondary">Total Events</Text>
          </Flex>
          <Flex direction="column" align="center">
            <Text variant="h4" weight="bold" color="success.500">
              {Math.round(stats.successRate * 100)}%
            </Text>
            <Text variant="caption" color="text.secondary">Success Rate</Text>
          </Flex>
        </Flex>
      </Card>

      {/* Basic Patterns */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
          Basic Patterns
        </Text>
        
        <Flex direction="row" wrap="wrap" gap="sm" style={styles.buttonGrid}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => testPattern('light')}
            style={styles.patternButton}
          >
            Light
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => testPattern('medium')}
            style={styles.patternButton}
          >
            Medium
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => testPattern('heavy')}
            style={styles.patternButton}
          >
            Heavy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => testPattern('success')}
            style={styles.patternButton}
          >
            Success
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => testPattern('warning')}
            style={styles.patternButton}
          >
            Warning
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => testPattern('error')}
            style={styles.patternButton}
          >
            Error
          </Button>
        </Flex>

        <Button
          variant="primary"
          size="md"
          onPress={handleTestAllPatterns}
          loading={loading}
          disabled={loading}
          style={styles.testAllButton}
        >
          Test All Patterns
        </Button>
      </Card>

      {/* Interactive Controls */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
          Interactive Controls
        </Text>

        {/* Switch Demo */}
        <Flex direction="row" justify="space-between" align="center" style={styles.controlRow}>
          <Text variant="body1">Demo Switch</Text>
          <Switch
            value={demoSwitch}
            onValueChange={handleDemoSwitchToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={demoSwitch ? '#f5dd4b' : '#f4f3f4'}
          />
        </Flex>

        {/* Slider Demo */}
        <Flex direction="column" style={styles.controlRow}>
          <Flex direction="row" justify="space-between" align="center">
            <Text variant="body1">Demo Slider</Text>
            <Text variant="body2" color="primary.500">
              {Math.round(demoSlider * 100)}%
            </Text>
          </Flex>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={demoSlider}
            onValueChange={handleDemoSliderChange}
            minimumTrackTintColor="#1976d2"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#1976d2"
            step={0.1}
          />
        </Flex>

        {/* Input Demo */}
        <Flex direction="column" style={styles.controlRow}>
          <Input
            label="Demo Input"
            placeholder="Type at least 3 characters"
            value={demoText}
            onChangeText={setDemoText}
            style={styles.input}
          />
          <Button
            variant="outline"
            size="sm"
            onPress={handleFormValidation}
            style={styles.validateButton}
          >
            Validate Input
          </Button>
        </Flex>
      </Card>

      {/* Contextual Actions */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
          Contextual Actions
        </Text>

        <Flex direction="column" gap="sm">
          <Button
            variant="outline"
            size="md"
            onPress={handleAchievement}
            leftIcon={<Icon name="trophy-outline" size="sm" color="warning.500" />}
            fullWidth
          >
            Trigger Achievement
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={handleMilestone}
            leftIcon={<Icon name="flag-outline" size="sm" color="success.500" />}
            fullWidth
          >
            Reach Milestone
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={handleLoadingDemo}
            leftIcon={<Icon name="refresh-outline" size="sm" color="primary.500" />}
            loading={loading}
            disabled={loading}
            fullWidth
          >
            Loading Demo
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={handleDataUpdate}
            leftIcon={<Icon name="sync-outline" size="sm" color="info.500" />}
            fullWidth
          >
            Data Update
          </Button>
        </Flex>
      </Card>

      {/* Gesture Actions */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <Text variant="h6" weight="semiBold" style={styles.cardTitle}>
          Gesture Actions
        </Text>

        <Flex direction="column" gap="sm">
          <Button
            variant="outline"
            size="md"
            onPress={handleGestureDemo}
            leftIcon={<Icon name="hand-left-outline" size="sm" color="primary.500" />}
            fullWidth
          >
            Gesture Recognition
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={handleModalDemo}
            leftIcon={<Icon name="layers-outline" size="sm" color="primary.500" />}
            fullWidth
          >
            Modal Open/Close
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={handleTabDemo}
            leftIcon={<Icon name="albums-outline" size="sm" color="primary.500" />}
            fullWidth
          >
            Tab Switch
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={handleLongPressDemo}
            onLongPress={handleLongPressDemo}
            leftIcon={<Icon name="finger-print-outline" size="sm" color="primary.500" />}
            fullWidth
          >
            Long Press (Try It!)
          </Button>

          <Button
            variant="outline"
            size="md"
            onPress={handleDoubleTapDemo}
            leftIcon={<Icon name="radio-button-on-outline" size="sm" color="primary.500" />}
            fullWidth
          >
            Double Tap
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
  cardTitle: {
    marginBottom: 16,
  },
  statsRow: {
    marginTop: 16,
  },
  buttonGrid: {
    marginBottom: 16,
  },
  patternButton: {
    minWidth: 80,
  },
  testAllButton: {
    marginTop: 8,
  },
  controlRow: {
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 8,
  },
  input: {
    marginBottom: 8,
  },
  validateButton: {
    alignSelf: 'flex-start',
  },
});

export default HapticDemoScreen;
