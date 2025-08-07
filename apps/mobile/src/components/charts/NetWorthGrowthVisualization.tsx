/**
 * NetWorthGrowthVisualization Component
 * Epic 10, Story 5: Net Worth Growth Visualization
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
  VictoryBar,
  VictoryScatter,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryContainer,
  VictoryLabel,
  VictoryLegend,
  VictoryZoomContainer,
} from 'victory-native';
import { Card, Icon, Button, Flex } from '../ui';
import { useChartHaptics } from '../../hooks/useChartHaptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useHighContrastTheme } from '../../contexts/HighContrastThemeContext';

interface NetWorthGrowthVisualizationProps {
  historicalData: NetWorthDataPoint[];
  projectedData?: NetWorthDataPoint[];
  accountBreakdown?: AccountContribution[];
  milestones?: NetWorthMilestone[];
  peerComparison?: PeerComparisonData;
  onDataPointPress?: (dataPoint: NetWorthDataPoint) => void;
  onMilestonePress?: (milestone: NetWorthMilestone) => void;
  height?: number;
  showProjections?: boolean;
  showAccountBreakdown?: boolean;
  showMilestones?: boolean;
  showPeerComparison?: boolean;
  showSeasonalAnalysis?: boolean;
}

interface NetWorthDataPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  growthRate?: number;
  contributions?: number;
  marketGains?: number;
  metadata?: {
    season?: 'spring' | 'summer' | 'fall' | 'winter';
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    isProjected?: boolean;
    confidence?: number;
  };
}

interface AccountContribution {
  accountType: string;
  accountName: string;
  contribution: number;
  percentage: number;
  color: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface NetWorthMilestone {
  id: string;
  date: string;
  amount: number;
  type: 'goal' | 'achievement' | 'target' | 'warning';
  label: string;
  description?: string;
  achieved: boolean;
}

interface PeerComparisonData {
  percentile: number;
  ageGroup: string;
  incomeRange: string;
  averageNetWorth: number;
  medianNetWorth: number;
  topPercentileNetWorth: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const NetWorthGrowthVisualization: React.FC<NetWorthGrowthVisualizationProps> = ({
  historicalData,
  projectedData = [],
  accountBreakdown = [],
  milestones = [],
  peerComparison,
  onDataPointPress,
  onMilestonePress,
  height = 400,
  showProjections = true,
  showAccountBreakdown = true,
  showMilestones = true,
  showPeerComparison = true,
  showSeasonalAnalysis = false,
}) => {
  const [activeView, setActiveView] = useState<'growth' | 'breakdown' | 'trends' | 'comparison'>('growth');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1Y' | '5Y' | '10Y' | 'ALL'>('5Y');
  const [zoomDomain, setZoomDomain] = useState<any>(undefined);

  const { onDataPointTap, onMilestoneAchieved } = useChartHaptics();
  const { theme } = useTheme();
  const { isHighContrastEnabled, highContrastTheme, getChartColors } = useHighContrastTheme();

  const getFilteredData = () => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedTimeRange) {
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case '10Y':
        cutoffDate.setFullYear(now.getFullYear() - 10);
        break;
      case 'ALL':
        return historicalData;
    }
    
    return historicalData.filter(point => new Date(point.date) >= cutoffDate);
  };

  const calculateTrendAnalysis = (data: NetWorthDataPoint[]) => {
    if (data.length < 2) return null;
    
    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];
    const totalGrowth = lastPoint.netWorth - firstPoint.netWorth;
    const totalGrowthPercentage = (totalGrowth / firstPoint.netWorth) * 100;
    
    // Calculate CAGR (Compound Annual Growth Rate)
    const years = (new Date(lastPoint.date).getTime() - new Date(firstPoint.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const cagr = Math.pow(lastPoint.netWorth / firstPoint.netWorth, 1 / years) - 1;
    
    return {
      totalGrowth,
      totalGrowthPercentage,
      cagr: cagr * 100,
      averageMonthlyGrowth: totalGrowth / (data.length - 1),
    };
  };

  const renderNetWorthGrowthChart = () => {
    const filteredData = getFilteredData();
    const chartColors = isHighContrastEnabled ? getChartColors(3) : [theme.colors.primary, theme.colors.secondary, theme.colors.success];
    
    const historicalChartData = filteredData.map(point => ({
      x: new Date(point.date),
      y: point.netWorth,
      ...point,
    }));

    const projectedChartData = showProjections ? projectedData.map(point => ({
      x: new Date(point.date),
      y: point.netWorth,
      ...point,
    })) : [];

    return (
      <VictoryChart
        theme={VictoryTheme.material}
        height={height}
        width={screenWidth - 40}
        padding={{ left: 80, top: 40, right: 40, bottom: 80 }}
        domain={zoomDomain}
        containerComponent={
          <VictoryZoomContainer
            responsive={false}
            onZoomDomainChange={setZoomDomain}
          />
        }
      >
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `$${(t / 1000).toFixed(0)}K`}
          style={{
            tickLabels: { 
              fontSize: 10, 
              fill: isHighContrastEnabled ? highContrastTheme.colors.chartText : theme.colors.text 
            },
            grid: { 
              stroke: isHighContrastEnabled ? highContrastTheme.colors.chartGrid : theme.colors.border, 
              strokeWidth: 0.5 
            },
          }}
        />
        <VictoryAxis
          tickFormat={(t) => new Date(t).getFullYear().toString()}
          style={{
            tickLabels: { 
              fontSize: 10, 
              fill: isHighContrastEnabled ? highContrastTheme.colors.chartText : theme.colors.text 
            },
            grid: { 
              stroke: isHighContrastEnabled ? highContrastTheme.colors.chartGrid : theme.colors.border, 
              strokeWidth: 0.5 
            },
          }}
        />

        {/* Historical data area */}
        <VictoryArea
          data={historicalChartData}
          x="x"
          y="y"
          style={{
            data: {
              fill: chartColors[0],
              fillOpacity: 0.3,
              stroke: chartColors[0],
              strokeWidth: 3,
            },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 }
          }}
        />

        {/* Projected data line */}
        {showProjections && projectedChartData.length > 0 && (
          <VictoryLine
            data={projectedChartData}
            x="x"
            y="y"
            style={{
              data: {
                stroke: chartColors[1],
                strokeWidth: 2,
                strokeDasharray: '5,5',
              },
            }}
          />
        )}

        {/* Milestones */}
        {showMilestones && (
          <VictoryScatter
            data={milestones.map(milestone => ({
              x: new Date(milestone.date),
              y: milestone.amount,
              ...milestone,
            }))}
            x="x"
            y="y"
            size={8}
            style={{
              data: {
                fill: ({ datum }) => {
                  switch (datum.type) {
                    case 'achievement': return chartColors[2];
                    case 'goal': return theme.colors.primary;
                    case 'warning': return theme.colors.warning;
                    default: return theme.colors.text;
                  }
                },
              },
            }}
            labelComponent={<VictoryTooltip />}
            events={[{
              target: "data",
              eventHandlers: {
                onPress: () => {
                  return [{
                    target: "data",
                    mutation: (props) => {
                      onMilestonePress?.(props.datum);
                      onMilestoneAchieved();
                      return null;
                    }
                  }];
                }
              }
            }]}
          />
        )}

        {/* Peer comparison line */}
        {showPeerComparison && peerComparison && (
          <VictoryLine
            data={historicalChartData.map(point => ({
              x: point.x,
              y: peerComparison.averageNetWorth,
            }))}
            x="x"
            y="y"
            style={{
              data: {
                stroke: theme.colors.textSecondary,
                strokeWidth: 1,
                strokeDasharray: '3,3',
              },
            }}
          />
        )}
      </VictoryChart>
    );
  };

  const renderAccountBreakdownChart = () => {
    if (!showAccountBreakdown || accountBreakdown.length === 0) return null;

    return (
      <VictoryChart
        theme={VictoryTheme.material}
        height={height}
        width={screenWidth - 40}
        padding={{ left: 80, top: 40, right: 40, bottom: 80 }}
      >
        <VictoryAxis dependentAxis />
        <VictoryAxis />
        
        <VictoryBar
          data={accountBreakdown.map((account, index) => ({
            x: account.accountName,
            y: account.contribution,
            fill: account.color,
          }))}
          x="x"
          y="y"
          style={{
            data: { fill: ({ datum }) => datum.fill },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 }
          }}
        />
      </VictoryChart>
    );
  };

  const renderTrendAnalysis = () => {
    const filteredData = getFilteredData();
    const analysis = calculateTrendAnalysis(filteredData);
    
    if (!analysis) return null;

    return (
      <View style={styles.trendAnalysis}>
        <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>
          Trend Analysis ({selectedTimeRange})
        </Text>
        
        <View style={styles.analysisGrid}>
          <View style={styles.analysisItem}>
            <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
              Total Growth
            </Text>
            <Text style={[styles.analysisValue, { color: theme.colors.success }]}>
              ${analysis.totalGrowth.toLocaleString()}
            </Text>
            <Text style={[styles.analysisPercentage, { color: theme.colors.success }]}>
              {analysis.totalGrowthPercentage.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
              CAGR
            </Text>
            <Text style={[styles.analysisValue, { color: theme.colors.primary }]}>
              {analysis.cagr.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>
              Avg Monthly
            </Text>
            <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
              ${analysis.averageMonthlyGrowth.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPeerComparison = () => {
    if (!showPeerComparison || !peerComparison) return null;

    const currentNetWorth = historicalData[historicalData.length - 1]?.netWorth || 0;

    return (
      <View style={styles.peerComparison}>
        <Text style={[styles.comparisonTitle, { color: theme.colors.text }]}>
          Peer Comparison
        </Text>
        <Text style={[styles.comparisonSubtitle, { color: theme.colors.textSecondary }]}>
          {peerComparison.ageGroup} • {peerComparison.incomeRange}
        </Text>
        
        <View style={styles.comparisonGrid}>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
              Your Percentile
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.colors.primary }]}>
              {peerComparison.percentile}th
            </Text>
          </View>
          
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
              Peer Average
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.colors.text }]}>
              ${peerComparison.averageNetWorth.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonLabel, { color: theme.colors.textSecondary }]}>
              Top 10%
            </Text>
            <Text style={[styles.comparisonValue, { color: theme.colors.success }]}>
              ${peerComparison.topPercentileNetWorth.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderViewSelector = () => (
    <View style={styles.viewSelector}>
      {[
        { key: 'growth', label: 'Growth', icon: 'trending-up' },
        { key: 'breakdown', label: 'Breakdown', icon: 'pie-chart' },
        { key: 'trends', label: 'Trends', icon: 'activity' },
        { key: 'comparison', label: 'Peers', icon: 'users' },
      ].map(view => (
        <TouchableOpacity
          key={view.key}
          style={[
            styles.viewButton,
            activeView === view.key && styles.activeViewButton,
            { backgroundColor: activeView === view.key ? theme.colors.primary : theme.colors.surface }
          ]}
          onPress={() => setActiveView(view.key as any)}
        >
          <Icon
            name={view.icon}
            size={16}
            color={activeView === view.key ? theme.colors.onPrimary : theme.colors.text}
          />
          <Text
            style={[
              styles.viewButtonText,
              { color: activeView === view.key ? theme.colors.onPrimary : theme.colors.text }
            ]}
          >
            {view.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeSelector}>
      {['1Y', '5Y', '10Y', 'ALL'].map(range => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            selectedTimeRange === range && styles.activeTimeRangeButton,
            { backgroundColor: selectedTimeRange === range ? theme.colors.primary : theme.colors.surface }
          ]}
          onPress={() => setSelectedTimeRange(range as any)}
        >
          <Text
            style={[
              styles.timeRangeButtonText,
              { color: selectedTimeRange === range ? theme.colors.onPrimary : theme.colors.text }
            ]}
          >
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'growth':
        return renderNetWorthGrowthChart();
      case 'breakdown':
        return renderAccountBreakdownChart();
      case 'trends':
        return renderTrendAnalysis();
      case 'comparison':
        return renderPeerComparison();
      default:
        return renderNetWorthGrowthChart();
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Net Worth Growth
        </Text>
        {renderTimeRangeSelector()}
      </View>

      {renderViewSelector()}

      <View style={[styles.chartContainer, { height }]}>
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
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  timeRangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeTimeRangeButton: {
    // Styles applied via backgroundColor prop
  },
  timeRangeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  activeViewButton: {
    // Styles applied via backgroundColor prop
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendAnalysis: {
    padding: 20,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  analysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analysisItem: {
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  analysisPercentage: {
    fontSize: 14,
    fontWeight: '500',
  },
  peerComparison: {
    padding: 20,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  comparisonSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
