/**
 * TimelineZoomController Component
 * Epic 10, Story 2 & 4: Interactive Projection Timeline with Zoom and Pan
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { Card, Icon, Button, Flex } from '../ui';
import { useChartHaptics } from '../../hooks/useChartHaptics';
import { useTheme } from '../../contexts/ThemeContext';

interface TimelineZoomControllerProps {
  totalYears: number;
  currentRange: { start: number; end: number };
  onRangeChange: (range: { start: number; end: number }) => void;
  milestones?: TimelineMilestone[];
  onMilestoneSnap?: (milestone: TimelineMilestone) => void;
  showMinimap?: boolean;
  gestureEnabled?: boolean;
}

interface TimelineMilestone {
  year: number;
  label: string;
  type: 'retirement' | 'goal' | 'milestone' | 'event';
  importance: 'low' | 'medium' | 'high';
}

interface ZoomLevel {
  name: string;
  years: number;
  label: string;
}

const { width: screenWidth } = Dimensions.get('window');

const ZOOM_LEVELS: ZoomLevel[] = [
  { name: 'decade', years: 10, label: '10Y' },
  { name: 'quarter_century', years: 25, label: '25Y' },
  { name: 'half_century', years: 50, label: '50Y' },
  { name: 'full', years: 100, label: 'All' },
];

export const TimelineZoomController: React.FC<TimelineZoomControllerProps> = ({
  totalYears,
  currentRange,
  onRangeChange,
  milestones = [],
  onMilestoneSnap,
  showMinimap = true,
  gestureEnabled = true,
}) => {
  const [activeZoomLevel, setActiveZoomLevel] =
    useState<string>('quarter_century');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialRange, setInitialRange] = useState(currentRange);
  const [momentum, setMomentum] = useState({ velocity: 0, direction: 0 });
  const [zoomHistory, setZoomHistory] = useState<
    Array<{ start: number; end: number }>
  >([]);

  const panRef = useRef<any>(null);
  const pinchRef = useRef<any>(null);
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedTranslateX = useRef(new Animated.Value(0)).current;

  const { onZoomIn, onZoomOut, onPanStart, onPanEnd } = useChartHaptics();
  const { theme } = useTheme();

  useEffect(() => {
    // Auto-select appropriate zoom level based on current range
    const rangeYears = currentRange.end - currentRange.start;
    const closestZoomLevel = ZOOM_LEVELS.reduce((prev, curr) =>
      Math.abs(curr.years - rangeYears) < Math.abs(prev.years - rangeYears)
        ? curr
        : prev
    );
    setActiveZoomLevel(closestZoomLevel.name);
  }, [currentRange]);

  const handlePanGesture = async (event: any) => {
    if (!gestureEnabled) return;

    const { translationX, velocityX, state } = event.nativeEvent;

    switch (state) {
      case State.BEGAN:
        await onPanStart();
        setIsDragging(true);
        setDragStartX(translationX);
        setInitialRange(currentRange);
        break;

      case State.ACTIVE:
        const deltaX = translationX - dragStartX;
        const yearsDelta =
          (deltaX / screenWidth) * (currentRange.end - currentRange.start);

        const newStart = Math.max(0, initialRange.start - yearsDelta);
        const newEnd = Math.min(totalYears, initialRange.end - yearsDelta);

        if (newEnd - newStart === currentRange.end - currentRange.start) {
          onRangeChange({ start: newStart, end: newEnd });
        }
        break;

      case State.END:
        await onPanEnd();
        setIsDragging(false);

        // Apply momentum scrolling
        if (Math.abs(velocityX) > 500) {
          setMomentum({
            velocity: velocityX,
            direction: velocityX > 0 ? 1 : -1,
          });
          applyMomentumScrolling(velocityX);
        }
        break;
    }
  };

  const handlePinchGesture = async (event: any) => {
    if (!gestureEnabled) return;

    const { scale, state } = event.nativeEvent;

    switch (state) {
      case State.BEGAN:
        await onZoomIn();
        break;

      case State.ACTIVE:
        const currentSpan = currentRange.end - currentRange.start;
        const newSpan = Math.max(5, Math.min(totalYears, currentSpan / scale));
        const center = (currentRange.start + currentRange.end) / 2;

        const newStart = Math.max(0, center - newSpan / 2);
        const newEnd = Math.min(totalYears, center + newSpan / 2);

        onRangeChange({ start: newStart, end: newEnd });
        break;

      case State.END:
        // Snap to intelligent zoom levels
        snapToIntelligentZoom();
        break;
    }
  };

  const applyMomentumScrolling = (velocity: number) => {
    const duration = Math.min(2000, Math.abs(velocity) * 2);
    const distance = velocity * 0.001;

    Animated.timing(animatedTranslateX, {
      toValue: distance,
      duration,
      useNativeDriver: false,
    }).start(() => {
      animatedTranslateX.setValue(0);
      setMomentum({ velocity: 0, direction: 0 });
    });
  };

  const snapToIntelligentZoom = () => {
    const currentSpan = currentRange.end - currentRange.start;
    const closestZoomLevel = ZOOM_LEVELS.reduce((prev, curr) =>
      Math.abs(curr.years - currentSpan) < Math.abs(prev.years - currentSpan)
        ? curr
        : prev
    );

    setZoomLevel(closestZoomLevel.name);
  };

  const setZoomLevel = async (levelName: string) => {
    const level = ZOOM_LEVELS.find(l => l.name === levelName);
    if (!level) return;

    await onZoomIn();

    // Save current range to history
    setZoomHistory(prev => [...prev.slice(-4), currentRange]);

    const center = (currentRange.start + currentRange.end) / 2;
    const newStart = Math.max(0, center - level.years / 2);
    const newEnd = Math.min(totalYears, center + level.years / 2);

    setActiveZoomLevel(levelName);
    onRangeChange({ start: newStart, end: newEnd });
  };

  const snapToMilestone = async (milestone: TimelineMilestone) => {
    await onZoomIn();

    const currentSpan = currentRange.end - currentRange.start;
    const newStart = Math.max(0, milestone.year - currentSpan / 2);
    const newEnd = Math.min(totalYears, milestone.year + currentSpan / 2);

    onRangeChange({ start: newStart, end: newEnd });
    onMilestoneSnap?.(milestone);
  };

  const goToPreviousZoom = async () => {
    if (zoomHistory.length === 0) return;

    await onZoomOut();
    const previousRange = zoomHistory[zoomHistory.length - 1];
    setZoomHistory(prev => prev.slice(0, -1));
    onRangeChange(previousRange);
  };

  const renderZoomControls = () => (
    <View style={styles.zoomControls}>
      <Text style={[styles.controlsTitle, { color: theme.colors.text }]}>
        Zoom Level
      </Text>
      <View style={styles.zoomButtons}>
        {ZOOM_LEVELS.map(level => (
          <TouchableOpacity
            key={level.name}
            style={[
              styles.zoomButton,
              activeZoomLevel === level.name && styles.activeZoomButton,
              {
                backgroundColor:
                  activeZoomLevel === level.name
                    ? theme.colors.primary
                    : theme.colors.surface,
              },
            ]}
            onPress={() => setZoomLevel(level.name)}
          >
            <Text
              style={[
                styles.zoomButtonText,
                {
                  color:
                    activeZoomLevel === level.name
                      ? theme.colors.onPrimary
                      : theme.colors.text,
                },
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMilestoneSnap = () => {
    if (milestones.length === 0) return null;

    const visibleMilestones = milestones.filter(
      m => m.year >= currentRange.start && m.year <= currentRange.end
    );

    return (
      <View style={styles.milestoneSnap}>
        <Text style={[styles.controlsTitle, { color: theme.colors.text }]}>
          Quick Navigation
        </Text>
        <View style={styles.milestoneButtons}>
          {milestones.slice(0, 4).map(milestone => (
            <TouchableOpacity
              key={milestone.year}
              style={[
                styles.milestoneButton,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => snapToMilestone(milestone)}
            >
              <Icon
                name={
                  milestone.type === 'retirement'
                    ? 'sunset'
                    : milestone.type === 'goal'
                      ? 'target'
                      : milestone.type === 'milestone'
                        ? 'flag'
                        : 'calendar'
                }
                size={12}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.milestoneButtonText,
                  { color: theme.colors.text },
                ]}
              >
                {milestone.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderMinimap = () => {
    if (!showMinimap) return null;

    const minimapWidth = screenWidth - 80;
    const currentPosition = (currentRange.start / totalYears) * minimapWidth;
    const currentWidth =
      ((currentRange.end - currentRange.start) / totalYears) * minimapWidth;

    return (
      <View style={styles.minimap}>
        <Text style={[styles.controlsTitle, { color: theme.colors.text }]}>
          Overview
        </Text>
        <View
          style={[
            styles.minimapTrack,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {/* Milestone markers */}
          {milestones.map(milestone => (
            <View
              key={milestone.year}
              style={[
                styles.minimapMilestone,
                {
                  left: (milestone.year / totalYears) * minimapWidth,
                  backgroundColor:
                    milestone.importance === 'high'
                      ? theme.colors.primary
                      : milestone.importance === 'medium'
                        ? theme.colors.secondary
                        : theme.colors.textSecondary,
                },
              ]}
            />
          ))}

          {/* Current view indicator */}
          <View
            style={[
              styles.minimapIndicator,
              {
                left: currentPosition,
                width: currentWidth,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.minimapLabels}>
          <Text
            style={[styles.minimapLabel, { color: theme.colors.textSecondary }]}
          >
            {new Date().getFullYear()}
          </Text>
          <Text
            style={[styles.minimapLabel, { color: theme.colors.textSecondary }]}
          >
            {new Date().getFullYear() + totalYears}
          </Text>
        </View>
      </View>
    );
  };

  const renderGestureShortcuts = () => (
    <View style={styles.gestureShortcuts}>
      <Text style={[styles.controlsTitle, { color: theme.colors.text }]}>
        Gesture Shortcuts
      </Text>
      <View style={styles.shortcutsList}>
        <Text
          style={[styles.shortcutText, { color: theme.colors.textSecondary }]}
        >
          • Pinch to zoom in/out
        </Text>
        <Text
          style={[styles.shortcutText, { color: theme.colors.textSecondary }]}
        >
          • Pan to scroll timeline
        </Text>
        <Text
          style={[styles.shortcutText, { color: theme.colors.textSecondary }]}
        >
          • Double tap to auto-zoom
        </Text>
      </View>
    </View>
  );

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Timeline Navigation
        </Text>
        <Flex direction='row' align='center' gap='sm'>
          {zoomHistory.length > 0 && (
            <TouchableOpacity
              style={[
                styles.historyButton,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={goToPreviousZoom}
            >
              <Icon name='arrow-left' size={16} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </Flex>
      </View>

      <PanGestureHandler
        ref={panRef}
        onGestureEvent={handlePanGesture}
        enabled={gestureEnabled}
      >
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={handlePinchGesture}
          enabled={gestureEnabled}
        >
          <Animated.View style={styles.gestureArea}>
            {renderZoomControls()}
            {renderMilestoneSnap()}
            {renderMinimap()}
            {renderGestureShortcuts()}
          </Animated.View>
        </PinchGestureHandler>
      </PanGestureHandler>
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
  historyButton: {
    padding: 8,
    borderRadius: 6,
  },
  gestureArea: {
    minHeight: 200,
  },
  zoomControls: {
    marginBottom: 20,
  },
  controlsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  zoomButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeZoomButton: {
    // Styles applied via backgroundColor prop
  },
  zoomButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  milestoneSnap: {
    marginBottom: 20,
  },
  milestoneButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  milestoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  milestoneButtonText: {
    fontSize: 11,
  },
  minimap: {
    marginBottom: 20,
  },
  minimapTrack: {
    height: 20,
    borderRadius: 10,
    position: 'relative',
    marginBottom: 8,
  },
  minimapMilestone: {
    position: 'absolute',
    width: 3,
    height: 20,
    borderRadius: 1.5,
  },
  minimapIndicator: {
    position: 'absolute',
    height: 20,
    borderRadius: 10,
    opacity: 0.7,
  },
  minimapLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minimapLabel: {
    fontSize: 10,
  },
  gestureShortcuts: {},
  shortcutsList: {
    gap: 4,
  },
  shortcutText: {
    fontSize: 12,
  },
});
