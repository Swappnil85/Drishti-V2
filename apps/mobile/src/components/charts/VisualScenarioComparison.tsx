/**
 * VisualScenarioComparison Component
 * Epic 10, Story 6: Visual Scenario Comparison
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryScatter,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryContainer,
  VictoryLegend,
  VictoryZoomContainer,
} from 'victory';
import { Card, Icon, Button, Flex } from '../ui';
import { useChartHaptics } from '../../hooks/useChartHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useHighContrastTheme } from '../../contexts/HighContrastThemeContext';

interface VisualScenarioComparisonProps {
  scenarios: ScenarioData[];
  onScenarioPress?: (scenario: ScenarioData) => void;
  onDataPointPress?: (
    dataPoint: ScenarioDataPoint,
    scenario: ScenarioData
  ) => void;
  height?: number;
  showProbabilityWeighting?: boolean;
  showConvergenceDivergence?: boolean;
  showRiskReturn?: boolean;
  synchronizedZoom?: boolean;
}

interface ScenarioData {
  id: string;
  name: string;
  color: string;
  probability: number; // 0-1
  data: ScenarioDataPoint[];
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  volatility: number;
  metadata?: {
    description?: string;
    assumptions?: string[];
    lastUpdated?: string;
  };
}

interface ScenarioDataPoint {
  year: number;
  value: number;
  confidence?: number;
  riskAdjustedValue?: number;
  metadata?: {
    milestone?: string;
    event?: string;
    volatilityRange?: { min: number; max: number };
  };
}

interface ConvergenceDivergenceAnalysis {
  convergencePoints: Array<{ year: number; scenarios: string[] }>;
  divergencePoints: Array<{
    year: number;
    scenarios: string[];
    magnitude: number;
  }>;
  overallTrend: 'converging' | 'diverging' | 'stable';
}

const { width: screenWidth } = Dimensions.get('window');

export const VisualScenarioComparison: React.FC<
  VisualScenarioComparisonProps
> = ({
  scenarios,
  onScenarioPress,
  onDataPointPress,
  height = 400,
  showProbabilityWeighting = true,
  showConvergenceDivergence = true,
  showRiskReturn = true,
  synchronizedZoom = true,
}) => {
  const [activeScenarios, setActiveScenarios] = useState<string[]>(
    scenarios.map(s => s.id)
  );
  const [viewMode, setViewMode] = useState<
    'comparison' | 'risk-return' | 'convergence' | 'probability'
  >('comparison');
  const [zoomDomain, setZoomDomain] = useState<any>(undefined);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const { onDataPointTap, onZoomIn } = useChartHaptics();
  const { theme } = useTheme();
  const { isHighContrastEnabled, highContrastTheme, getChartColors } =
    useHighContrastTheme();

  const toggleScenario = async (scenarioId: string) => {
    await onDataPointTap();
    setActiveScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const calculateConvergenceDivergence = (): ConvergenceDivergenceAnalysis => {
    const activeScenarioData = scenarios.filter(s =>
      activeScenarios.includes(s.id)
    );
    const convergencePoints: Array<{ year: number; scenarios: string[] }> = [];
    const divergencePoints: Array<{
      year: number;
      scenarios: string[];
      magnitude: number;
    }> = [];

    // Find years where scenarios converge or diverge significantly
    const allYears = [
      ...new Set(activeScenarioData.flatMap(s => s.data.map(d => d.year))),
    ].sort();

    allYears.forEach(year => {
      const valuesAtYear = activeScenarioData
        .map(scenario => ({
          id: scenario.id,
          value: scenario.data.find(d => d.year === year)?.value || 0,
        }))
        .filter(v => v.value > 0);

      if (valuesAtYear.length >= 2) {
        const values = valuesAtYear.map(v => v.value);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          values.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;

        if (coefficientOfVariation < 0.1) {
          convergencePoints.push({
            year,
            scenarios: valuesAtYear.map(v => v.id),
          });
        } else if (coefficientOfVariation > 0.3) {
          divergencePoints.push({
            year,
            scenarios: valuesAtYear.map(v => v.id),
            magnitude: coefficientOfVariation,
          });
        }
      }
    });

    const overallTrend =
      divergencePoints.length > convergencePoints.length
        ? 'diverging'
        : convergencePoints.length > divergencePoints.length
          ? 'converging'
          : 'stable';

    return { convergencePoints, divergencePoints, overallTrend };
  };

  const renderScenarioComparisonChart = () => {
    const activeScenarioData = scenarios.filter(s =>
      activeScenarios.includes(s.id)
    );
    const chartColors = isHighContrastEnabled
      ? getChartColors(activeScenarioData.length)
      : activeScenarioData.map(s => s.color);

    return (
      <VictoryChart
        theme={VictoryTheme.material}
        height={height}
        width={screenWidth - 40}
        padding={{ left: 80, top: 40, right: 40, bottom: 80 }}
        domain={zoomDomain}
        containerComponent={
          synchronizedZoom ? (
            <VictoryZoomContainer
              responsive={false}
              onZoomDomainChange={setZoomDomain}
            />
          ) : (
            <VictoryContainer responsive={false} />
          )
        }
      >
        <VictoryAxis
          dependentAxis
          tickFormat={t => `$${(t / 1000).toFixed(0)}K`}
          style={{
            tickLabels: {
              fontSize: 10,
              fill: isHighContrastEnabled
                ? highContrastTheme.colors.chartText
                : theme.colors.text,
            },
            grid: {
              stroke: isHighContrastEnabled
                ? highContrastTheme.colors.chartGrid
                : theme.colors.border,
              strokeWidth: 0.5,
            },
          }}
        />
        <VictoryAxis
          tickFormat={t => t.toString()}
          style={{
            tickLabels: {
              fontSize: 10,
              fill: isHighContrastEnabled
                ? highContrastTheme.colors.chartText
                : theme.colors.text,
            },
            grid: {
              stroke: isHighContrastEnabled
                ? highContrastTheme.colors.chartGrid
                : theme.colors.border,
              strokeWidth: 0.5,
            },
          }}
        />

        {/* Scenario lines */}
        {activeScenarioData.map((scenario, index) => {
          const lineData = scenario.data.map(point => ({
            x: point.year,
            y: point.value,
            ...point,
            scenario,
          }));

          const lineOpacity = showProbabilityWeighting
            ? scenario.probability
            : 1.0;
          const strokeWidth = selectedScenario === scenario.id ? 4 : 2;

          return (
            <VictoryLine
              key={scenario.id}
              data={lineData}
              x='x'
              y='y'
              style={{
                data: {
                  stroke: chartColors[index],
                  strokeWidth,
                  strokeOpacity: lineOpacity,
                },
              }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 },
              }}
              events={[
                {
                  target: 'data',
                  eventHandlers: {
                    onPress: () => {
                      return [
                        {
                          target: 'data',
                          mutation: props => {
                            onDataPointPress?.(props.datum, scenario);
                            onDataPointTap();
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
        })}

        {/* Convergence/Divergence indicators */}
        {showConvergenceDivergence &&
          (() => {
            const analysis = calculateConvergenceDivergence();
            return (
              <VictoryScatter
                data={[
                  ...analysis.convergencePoints.map(point => ({
                    x: point.year,
                    y: Math.max(
                      ...activeScenarioData.flatMap(s =>
                        s.data
                          .filter(d => d.year === point.year)
                          .map(d => d.value)
                      )
                    ),
                    type: 'convergence',
                  })),
                  ...analysis.divergencePoints.map(point => ({
                    x: point.year,
                    y: Math.max(
                      ...activeScenarioData.flatMap(s =>
                        s.data
                          .filter(d => d.year === point.year)
                          .map(d => d.value)
                      )
                    ),
                    type: 'divergence',
                    magnitude: point.magnitude,
                  })),
                ]}
                x='x'
                y='y'
                size={6}
                style={{
                  data: {
                    fill: ({ datum }) =>
                      datum.type === 'convergence'
                        ? theme.colors.success
                        : theme.colors.warning,
                  },
                }}
                labelComponent={<VictoryTooltip />}
              />
            );
          })()}

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
          data={activeScenarioData.map((scenario, index) => ({
            name: `${scenario.name} (${(scenario.probability * 100).toFixed(0)}%)`,
            symbol: { fill: chartColors[index], type: 'line' },
          }))}
        />
      </VictoryChart>
    );
  };

  const renderRiskReturnScatter = () => {
    if (!showRiskReturn) return null;

    const scatterData = scenarios.map(scenario => ({
      x: scenario.volatility,
      y: scenario.expectedReturn,
      size: scenario.probability * 20 + 5,
      ...scenario,
    }));

    return (
      <VictoryChart
        theme={VictoryTheme.material}
        height={height}
        width={screenWidth - 40}
        padding={{ left: 80, top: 40, right: 40, bottom: 80 }}
      >
        <VictoryAxis
          dependentAxis
          label='Expected Return (%)'
          style={{
            axisLabel: { fontSize: 12, padding: 40, fill: theme.colors.text },
            tickLabels: { fontSize: 10, fill: theme.colors.text },
          }}
        />
        <VictoryAxis
          label='Risk (Volatility %)'
          style={{
            axisLabel: { fontSize: 12, padding: 40, fill: theme.colors.text },
            tickLabels: { fontSize: 10, fill: theme.colors.text },
          }}
        />

        <VictoryScatter
          data={scatterData}
          x='x'
          y='y'
          size='size'
          style={{
            data: {
              fill: ({ datum }) => datum.color,
              fillOpacity: 0.7,
            },
          }}
          labelComponent={<VictoryTooltip />}
          events={[
            {
              target: 'data',
              eventHandlers: {
                onPress: () => {
                  return [
                    {
                      target: 'data',
                      mutation: props => {
                        onScenarioPress?.(props.datum);
                        onDataPointTap();
                        return null;
                      },
                    },
                  ];
                },
              },
            },
          ]}
        />
      </VictoryChart>
    );
  };

  const renderProbabilityWeighting = () => {
    return (
      <View style={styles.probabilityWeighting}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Scenario Probabilities
        </Text>

        {scenarios.map(scenario => (
          <View key={scenario.id} style={styles.probabilityItem}>
            <View style={styles.probabilityHeader}>
              <View
                style={[
                  styles.colorIndicator,
                  { backgroundColor: scenario.color },
                ]}
              />
              <Text style={[styles.scenarioName, { color: theme.colors.text }]}>
                {scenario.name}
              </Text>
              <Text
                style={[
                  styles.probabilityValue,
                  { color: theme.colors.primary },
                ]}
              >
                {(scenario.probability * 100).toFixed(0)}%
              </Text>
            </View>

            <View
              style={[
                styles.probabilityBar,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[
                  styles.probabilityFill,
                  {
                    width: `${scenario.probability * 100}%`,
                    backgroundColor: scenario.color,
                  },
                ]}
              />
            </View>

            <Text
              style={[
                styles.scenarioDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {scenario.metadata?.description || 'No description available'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderConvergenceAnalysis = () => {
    const analysis = calculateConvergenceDivergence();

    return (
      <View style={styles.convergenceAnalysis}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Convergence/Divergence Analysis
        </Text>

        <View style={styles.analysisOverview}>
          <Text style={[styles.overallTrend, { color: theme.colors.text }]}>
            Overall Trend:{' '}
            <Text
              style={{
                color:
                  analysis.overallTrend === 'converging'
                    ? theme.colors.success
                    : analysis.overallTrend === 'diverging'
                      ? theme.colors.warning
                      : theme.colors.text,
              }}
            >
              {analysis.overallTrend.charAt(0).toUpperCase() +
                analysis.overallTrend.slice(1)}
            </Text>
          </Text>
        </View>

        <View style={styles.analysisDetails}>
          <View style={styles.analysisSection}>
            <Text
              style={[styles.analysisSubtitle, { color: theme.colors.success }]}
            >
              Convergence Points: {analysis.convergencePoints.length}
            </Text>
            {analysis.convergencePoints.slice(0, 3).map((point, index) => (
              <Text
                key={index}
                style={[
                  styles.analysisItem,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Year {point.year}: {point.scenarios.length} scenarios align
              </Text>
            ))}
          </View>

          <View style={styles.analysisSection}>
            <Text
              style={[styles.analysisSubtitle, { color: theme.colors.warning }]}
            >
              Divergence Points: {analysis.divergencePoints.length}
            </Text>
            {analysis.divergencePoints.slice(0, 3).map((point, index) => (
              <Text
                key={index}
                style={[
                  styles.analysisItem,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Year {point.year}: High variance (
                {(point.magnitude * 100).toFixed(0)}%)
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      {[
        { key: 'comparison', label: 'Compare', icon: 'trending-up' },
        { key: 'risk-return', label: 'Risk/Return', icon: 'target' },
        { key: 'convergence', label: 'Analysis', icon: 'activity' },
        { key: 'probability', label: 'Probability', icon: 'percent' },
      ].map(mode => (
        <TouchableOpacity
          key={mode.key}
          style={[
            styles.viewModeButton,
            viewMode === mode.key && styles.activeViewModeButton,
            {
              backgroundColor:
                viewMode === mode.key
                  ? theme.colors.primary
                  : theme.colors.surface,
            },
          ]}
          onPress={() => setViewMode(mode.key as any)}
        >
          <Icon
            name={mode.icon}
            size={16}
            color={
              viewMode === mode.key ? theme.colors.onPrimary : theme.colors.text
            }
          />
          <Text
            style={[
              styles.viewModeButtonText,
              {
                color:
                  viewMode === mode.key
                    ? theme.colors.onPrimary
                    : theme.colors.text,
              },
            ]}
          >
            {mode.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderScenarioToggles = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scenarioToggles}
    >
      {scenarios.map(scenario => (
        <TouchableOpacity
          key={scenario.id}
          style={[
            styles.scenarioToggle,
            activeScenarios.includes(scenario.id) &&
              styles.activeScenarioToggle,
            {
              backgroundColor: activeScenarios.includes(scenario.id)
                ? scenario.color
                : theme.colors.surface,
              borderColor: scenario.color,
            },
          ]}
          onPress={() => toggleScenario(scenario.id)}
        >
          <Text
            style={[
              styles.scenarioToggleText,
              {
                color: activeScenarios.includes(scenario.id)
                  ? '#FFFFFF'
                  : theme.colors.text,
              },
            ]}
          >
            {scenario.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'comparison':
        return renderScenarioComparisonChart();
      case 'risk-return':
        return renderRiskReturnScatter();
      case 'convergence':
        return renderConvergenceAnalysis();
      case 'probability':
        return renderProbabilityWeighting();
      default:
        return renderScenarioComparisonChart();
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Scenario Comparison
        </Text>
      </View>

      {renderViewModeSelector()}
      {renderScenarioToggles()}

      <View style={[styles.contentContainer, { height }]}>
        {renderContent()}
      </View>
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
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  activeViewModeButton: {
    // Styles applied via backgroundColor prop
  },
  viewModeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scenarioToggles: {
    marginBottom: 16,
  },
  scenarioToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  activeScenarioToggle: {
    // Styles applied via backgroundColor prop
  },
  scenarioToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  probabilityWeighting: {
    padding: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  probabilityItem: {
    marginBottom: 16,
  },
  probabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  scenarioName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  probabilityValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  probabilityBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  probabilityFill: {
    height: '100%',
    borderRadius: 3,
  },
  scenarioDescription: {
    fontSize: 12,
  },
  convergenceAnalysis: {
    padding: 20,
    width: '100%',
  },
  analysisOverview: {
    marginBottom: 16,
  },
  overallTrend: {
    fontSize: 14,
    fontWeight: '500',
  },
  analysisDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analysisSection: {
    flex: 1,
    marginHorizontal: 8,
  },
  analysisSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  analysisItem: {
    fontSize: 12,
    marginBottom: 4,
  },
});
