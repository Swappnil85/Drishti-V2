/**
 * InteractiveProjectionTimeline Component
 * Epic 10, Story 2: Interactive Projection Timeline Graphs
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryScatter,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryContainer,
  VictoryLabel,
  VictoryZoomContainer,
  VictoryBrushContainer,
  VictoryLegend,
} from 'victory';
import { Card, Icon, Button, Flex } from '../ui';
import { useChartHaptics } from '../../hooks/useChartHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useHighContrastTheme } from '../../contexts/HighContrastThemeContext';
import { ChartAccessibility } from './ChartAccessibility';
import { ScreenReaderService } from '../../services/accessibility/ScreenReaderService';
import { YearlyProjection } from '../../services/projections/YearlyProjectionsService';

interface InteractiveProjectionTimelineProps {
  projections: ProjectionData[];
  scenarios?: ScenarioProjection[];
  onDataPointPress?: (dataPoint: ProjectionDataPoint) => void;
  onExport?: (format: ExportFormat) => void;
  height?: number;
  showConfidenceBands?: boolean;
  showAnnotations?: boolean;
  logarithmicScale?: boolean;
  interactive?: boolean;
}

interface ProjectionData {
  id: string;
  name: string;
  color: string;
  data: ProjectionDataPoint[];
  confidenceBands?: ConfidenceBand[];
  annotations?: Annotation[];
}

interface ProjectionDataPoint {
  year: number;
  value: number;
  age?: number;
  metadata?: {
    netWorth?: number;
    contributions?: number;
    growth?: number;
    milestones?: string[];
    isRetired?: boolean;
  };
}

interface ConfidenceBand {
  year: number;
  lower: number;
  upper: number;
  confidence: number; // 0.8 for 80%, 0.95 for 95%
}

interface Annotation {
  year: number;
  value: number;
  label: string;
  type: 'milestone' | 'event' | 'warning' | 'achievement';
  icon?: string;
}

interface ScenarioProjection {
  id: string;
  name: string;
  color: string;
  data: ProjectionDataPoint[];
}

type ExportFormat = 'PNG' | 'PDF' | 'SVG' | 'CSV' | 'JSON';

const { width: screenWidth } = Dimensions.get('window');

export const InteractiveProjectionTimeline: React.FC<
  InteractiveProjectionTimelineProps
> = ({
  projections,
  scenarios = [],
  onDataPointPress,
  onExport,
  height = 400,
  showConfidenceBands = true,
  showAnnotations = true,
  logarithmicScale = false,
  interactive = true,
}) => {
  const [zoomDomain, setZoomDomain] = useState<
    { x: [number, number]; y: [number, number] } | undefined
  >();
  const [selectedDataPoint, setSelectedDataPoint] =
    useState<ProjectionDataPoint | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [activeScenarios, setActiveScenarios] = useState<string[]>(
    scenarios.map(s => s.id)
  );
  const [showLegend, setShowLegend] = useState(true);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);

  const chartRef = useRef<any>(null);
  const { onZoomIn, onZoomOut, onPanStart, onPanEnd, onDataPointTap } =
    useChartHaptics();
  const { theme } = useTheme();
  const { isHighContrastEnabled, highContrastTheme, getChartColors } =
    useHighContrastTheme();
  const screenReaderService = ScreenReaderService.getInstance();

  const handleDataPointPress = async (
    dataPoint: ProjectionDataPoint,
    event: any
  ) => {
    if (!interactive) return;

    await onDataPointTap();
    setSelectedDataPoint(dataPoint);
    setShowTooltip(true);
    setTooltipPosition({
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
    });
    onDataPointPress?.(dataPoint);
  };

  const handleZoom = async (domain: any) => {
    if (!interactive) return;

    await onZoomIn();
    setZoomDomain(domain);
  };

  const handlePanStart = async () => {
    if (!interactive) return;
    await onPanStart();
  };

  const handlePanEnd = async () => {
    if (!interactive) return;
    await onPanEnd();
  };

  const resetZoom = async () => {
    await onZoomOut();
    setZoomDomain(undefined);
  };

  const toggleScenario = (scenarioId: string) => {
    setActiveScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const handleExport = async (format: ExportFormat) => {
    setExportMenuVisible(false);
    onExport?.(format);
  };

  const renderConfidenceBands = () => {
    if (!showConfidenceBands) return null;

    return projections.map((projection, index) => {
      if (!projection.confidenceBands) return null;

      const upperBandData = projection.confidenceBands.map(band => ({
        x: band.year,
        y: logarithmicScale ? Math.log10(band.upper) : band.upper,
      }));

      const lowerBandData = projection.confidenceBands.map(band => ({
        x: band.year,
        y: logarithmicScale ? Math.log10(band.lower) : band.lower,
      }));

      return (
        <VictoryArea
          key={`confidence-${index}`}
          data={upperBandData}
          y0={datum => {
            const lowerBand = projection.confidenceBands?.find(
              b => b.year === datum.x
            );
            return lowerBand
              ? logarithmicScale
                ? Math.log10(lowerBand.lower)
                : lowerBand.lower
              : 0;
          }}
          style={{
            data: {
              fill: projection.color,
              fillOpacity: 0.2,
              stroke: 'none',
            },
          }}
        />
      );
    });
  };

  const renderProjectionLines = () => {
    return projections.map((projection, index) => {
      const lineData = projection.data.map(point => ({
        x: point.year,
        y: logarithmicScale ? Math.log10(point.value) : point.value,
        ...point,
      }));

      return (
        <VictoryLine
          key={`projection-${index}`}
          data={lineData}
          x='x'
          y='y'
          style={{
            data: {
              stroke: projection.color,
              strokeWidth: 3,
            },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 },
          }}
        />
      );
    });
  };

  const renderScenarioLines = () => {
    return scenarios
      .filter(scenario => activeScenarios.includes(scenario.id))
      .map((scenario, index) => {
        const lineData = scenario.data.map(point => ({
          x: point.year,
          y: logarithmicScale ? Math.log10(point.value) : point.value,
          ...point,
        }));

        return (
          <VictoryLine
            key={`scenario-${index}`}
            data={lineData}
            x='x'
            y='y'
            style={{
              data: {
                stroke: scenario.color,
                strokeWidth: 2,
                strokeDasharray: '5,5',
              },
            }}
          />
        );
      });
  };

  const renderAnnotations = () => {
    if (!showAnnotations) return null;

    const allAnnotations = projections.flatMap(p => p.annotations || []);

    return (
      <VictoryScatter
        data={allAnnotations.map(annotation => ({
          x: annotation.year,
          y: logarithmicScale ? Math.log10(annotation.value) : annotation.value,
          ...annotation,
        }))}
        x='x'
        y='y'
        size={6}
        style={{
          data: {
            fill: ({ datum }) => {
              switch (datum.type) {
                case 'milestone':
                  return theme.colors.success;
                case 'warning':
                  return theme.colors.warning;
                case 'achievement':
                  return theme.colors.primary;
                default:
                  return theme.colors.text;
              }
            },
          },
        }}
        labelComponent={
          <VictoryTooltip
            flyoutStyle={{
              fill: theme.colors.surface,
              stroke: theme.colors.border,
            }}
            style={{
              fill: theme.colors.text,
              fontSize: 12,
            }}
          />
        }
        events={[
          {
            target: 'data',
            eventHandlers: {
              onPress: () => {
                return [
                  {
                    target: 'data',
                    mutation: props => {
                      handleDataPointPress(props.datum, props);
                      return null;
                    },
                  },
                ];
              },
            },
          },
        ]}
      />
    );
  };

  const renderLegend = () => {
    if (!showLegend) return null;

    const legendData = [
      ...projections.map(p => ({
        name: p.name,
        symbol: { fill: p.color, type: 'line' },
      })),
      ...scenarios
        .filter(s => activeScenarios.includes(s.id))
        .map(s => ({ name: s.name, symbol: { fill: s.color, type: 'line' } })),
    ];

    return (
      <VictoryLegend
        x={20}
        y={20}
        orientation='horizontal'
        gutter={20}
        style={{
          border: { stroke: theme.colors.border, fill: theme.colors.surface },
          title: { fontSize: 14, fill: theme.colors.text },
          labels: { fontSize: 12, fill: theme.colors.text },
        }}
        data={legendData}
      />
    );
  };

  const renderControls = () => (
    <View style={styles.controls}>
      <Flex direction='row' align='center' gap='sm'>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={resetZoom}
        >
          <Icon name='zoom-out' size={16} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() => setShowLegend(!showLegend)}
        >
          <Icon name='list' size={16} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() => setExportMenuVisible(true)}
        >
          <Icon name='download' size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </Flex>
    </View>
  );

  const renderExportMenu = () => {
    if (!exportMenuVisible) return null;

    const exportFormats: ExportFormat[] = ['PNG', 'PDF', 'SVG', 'CSV', 'JSON'];

    return (
      <View style={styles.exportMenu}>
        <Card style={styles.exportCard}>
          <Text style={[styles.exportTitle, { color: theme.colors.text }]}>
            Export Chart
          </Text>
          {exportFormats.map(format => (
            <TouchableOpacity
              key={format}
              style={styles.exportOption}
              onPress={() => handleExport(format)}
            >
              <Text
                style={[styles.exportOptionText, { color: theme.colors.text }]}
              >
                {format}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.exportCancel}
            onPress={() => setExportMenuVisible(false)}
          >
            <Text
              style={[
                styles.exportCancelText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Projection Timeline
        </Text>
        {renderControls()}
      </View>

      <View style={[styles.chartContainer, { height }]}>
        <VictoryChart
          ref={chartRef}
          theme={VictoryTheme.material}
          height={height}
          width={screenWidth - 40}
          padding={{ left: 80, top: 40, right: 40, bottom: 80 }}
          domain={zoomDomain}
          containerComponent={
            interactive ? (
              <VictoryZoomContainer
                responsive={false}
                onZoomDomainChange={handleZoom}
              />
            ) : (
              <VictoryContainer responsive={false} />
            )
          }
        >
          <VictoryAxis
            dependentAxis
            tickFormat={t =>
              logarithmicScale
                ? `$${Math.pow(10, t).toLocaleString()}`
                : `$${t.toLocaleString()}`
            }
            style={{
              tickLabels: { fontSize: 10, fill: theme.colors.text },
              grid: { stroke: theme.colors.border, strokeWidth: 0.5 },
            }}
          />
          <VictoryAxis
            tickFormat={t => t.toString()}
            style={{
              tickLabels: { fontSize: 10, fill: theme.colors.text },
              grid: { stroke: theme.colors.border, strokeWidth: 0.5 },
            }}
          />

          {renderConfidenceBands()}
          {renderProjectionLines()}
          {renderScenarioLines()}
          {renderAnnotations()}
          {renderLegend()}
        </VictoryChart>
      </View>

      {renderExportMenu()}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 6,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportCard: {
    padding: 20,
    minWidth: 200,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  exportOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  exportOptionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  exportCancel: {
    paddingVertical: 12,
    marginTop: 8,
  },
  exportCancelText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
