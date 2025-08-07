/**
 * Yearly Projections Screen
 * Epic 9, Story 4: Detailed yearly projections with interactive tables and export
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Text, Card, Button } from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';
import { useScenarios } from '../../hooks/useScenarios';
import {
  yearlyProjectionsService,
  YearlyProjection,
  ProjectionSummary,
  DecadeView,
  ExportOptions,
} from '../../services/projections/YearlyProjectionsService';
import { EnhancedScenario } from '@drishti/shared/types/financial';

interface YearlyProjectionsScreenProps {
  route: {
    params: {
      scenarioId: string;
    };
  };
  navigation: any;
}

const YearlyProjectionsScreen: React.FC<YearlyProjectionsScreenProps> = ({
  route,
  navigation,
}) => {
  const { buttonTap } = useHaptic();
  const { scenarios, loading } = useScenarios();
  const [scenario, setScenario] = useState<EnhancedScenario | null>(null);
  const [projections, setProjections] = useState<YearlyProjection[]>([]);
  const [summary, setSummary] = useState<ProjectionSummary | null>(null);
  const [decadeViews, setDecadeViews] = useState<DecadeView[]>([]);
  const [activeTab, setActiveTab] = useState<'yearly' | 'decades' | 'summary'>('yearly');
  const [sortBy, setSortBy] = useState<'year' | 'netWorth' | 'cashFlow'>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterRetired, setFilterRetired] = useState<'all' | 'working' | 'retired'>('all');
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null);

  useEffect(() => {
    initializeProjections();
  }, [route.params.scenarioId]);

  /**
   * Initialize projections
   */
  const initializeProjections = async () => {
    const { scenarioId } = route.params;
    
    // Find scenario
    const foundScenario = scenarios.find(s => s.id === scenarioId);
    if (!foundScenario) return;

    setScenario(foundScenario);

    // Generate projections
    const projectionInputs = {
      currentAge: 30,
      currentNetWorth: 50000,
      currentSalary: 100000,
      assumptions: foundScenario.assumptions,
      projectionYears: 50,
      customMilestones: [
        { name: 'House Down Payment', targetValue: 100000, description: 'Save for house down payment' },
        { name: 'Kids College Fund', targetValue: 200000, description: 'College fund for children' },
      ],
    };

    const result = yearlyProjectionsService.generateProjections(projectionInputs);
    setProjections(result.projections);
    setSummary(result.summary);
    setDecadeViews(result.decadeViews);
  };

  /**
   * Export projections
   */
  const exportProjections = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!projections.length || !summary) return;

    buttonTap();
    try {
      const exportOptions: ExportOptions = {
        format,
        includeCharts: true,
        includeAnalysis: true,
        groupByDecade: activeTab === 'decades',
      };

      const exportData = await yearlyProjectionsService.exportProjections(
        projections,
        summary,
        exportOptions
      );

      // Share the exported data
      await Share.share({
        message: exportData,
        title: `FIRE Projections - ${scenario?.name}`,
      });
    } catch (error) {
      console.error('Error exporting projections:', error);
      Alert.alert('Error', 'Failed to export projections');
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  /**
   * Get filtered and sorted projections
   */
  const getFilteredProjections = (): YearlyProjection[] => {
    let filtered = projections;

    // Apply retirement filter
    if (filterRetired === 'working') {
      filtered = filtered.filter(p => !p.isRetired);
    } else if (filterRetired === 'retired') {
      filtered = filtered.filter(p => p.isRetired);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'netWorth':
          aValue = a.endingNetWorth;
          bValue = b.endingNetWorth;
          break;
        case 'cashFlow':
          aValue = a.cashFlow;
          bValue = b.cashFlow;
          break;
        default:
          aValue = a.year;
          bValue = b.year;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  /**
   * Render projection row
   */
  const renderProjectionRow = ({ item }: { item: YearlyProjection }) => (
    <View style={styles.projectionRow}>
      <View style={styles.projectionCell}>
        <Text variant="body2" style={styles.cellText}>
          {item.year}
        </Text>
      </View>
      <View style={styles.projectionCell}>
        <Text variant="body2" style={styles.cellText}>
          {item.age}
        </Text>
      </View>
      <View style={styles.projectionCell}>
        <Text variant="body2" style={styles.cellText}>
          {formatCurrency(item.endingNetWorth)}
        </Text>
      </View>
      <View style={styles.projectionCell}>
        <Text variant="body2" style={styles.cellText}>
          {formatCurrency(item.contributions.total)}
        </Text>
      </View>
      <View style={styles.projectionCell}>
        <Text variant="body2" style={styles.cellText}>
          {formatCurrency(item.growth.total)}
        </Text>
      </View>
      <View style={styles.projectionCell}>
        <Text variant="body2" style={[
          styles.cellText,
          { color: item.isRetired ? '#F44336' : '#4CAF50' }
        ]}>
          {item.isRetired ? 'Retired' : 'Working'}
        </Text>
      </View>
    </View>
  );

  /**
   * Render yearly tab
   */
  const renderYearlyTab = () => (
    <View style={styles.tabContent}>
      {/* Filters and Sorting */}
      <Card style={styles.controlsCard}>
        <View style={styles.controlsRow}>
          <View style={styles.filterGroup}>
            <Text variant="caption" style={styles.filterLabel}>Filter:</Text>
            <View style={styles.filterButtons}>
              {['all', 'working', 'retired'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    filterRetired === filter && styles.activeFilterButton,
                  ]}
                  onPress={() => {
                    buttonTap();
                    setFilterRetired(filter as any);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterRetired === filter && styles.activeFilterButtonText,
                  ]}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sortGroup}>
            <Text variant="caption" style={styles.filterLabel}>Sort:</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                buttonTap();
                if (sortBy === 'year') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('year');
                  setSortOrder('asc');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sortButtonText}>
                Year {sortBy === 'year' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <View style={styles.headerCell}>
          <Text variant="caption" style={styles.headerText}>Year</Text>
        </View>
        <View style={styles.headerCell}>
          <Text variant="caption" style={styles.headerText}>Age</Text>
        </View>
        <View style={styles.headerCell}>
          <Text variant="caption" style={styles.headerText}>Net Worth</Text>
        </View>
        <View style={styles.headerCell}>
          <Text variant="caption" style={styles.headerText}>Contributions</Text>
        </View>
        <View style={styles.headerCell}>
          <Text variant="caption" style={styles.headerText}>Growth</Text>
        </View>
        <View style={styles.headerCell}>
          <Text variant="caption" style={styles.headerText}>Status</Text>
        </View>
      </View>

      {/* Projections Table */}
      <FlatList
        data={getFilteredProjections()}
        renderItem={renderProjectionRow}
        keyExtractor={(item) => item.year.toString()}
        style={styles.projectionsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  /**
   * Render decades tab
   */
  const renderDecadesTab = () => (
    <View style={styles.tabContent}>
      {decadeViews.map((decade, index) => (
        <Card key={index} style={styles.decadeCard}>
          <TouchableOpacity
            style={styles.decadeHeader}
            onPress={() => {
              buttonTap();
              setSelectedDecade(selectedDecade === index ? null : index);
            }}
            activeOpacity={0.7}
          >
            <Text variant="h6" style={styles.decadeTitle}>
              {decade.decade}
            </Text>
            <Text style={styles.expandIcon}>
              {selectedDecade === index ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          <View style={styles.decadeSummary}>
            <View style={styles.decadeMetric}>
              <Text variant="caption" color="text.secondary">Net Worth Growth</Text>
              <Text variant="body2" style={styles.decadeValue}>
                {formatCurrency(decade.startingNetWorth)} → {formatCurrency(decade.endingNetWorth)}
              </Text>
            </View>
            <View style={styles.decadeMetric}>
              <Text variant="caption" color="text.secondary">Total Contributions</Text>
              <Text variant="body2" style={styles.decadeValue}>
                {formatCurrency(decade.totalContributions)}
              </Text>
            </View>
            <View style={styles.decadeMetric}>
              <Text variant="caption" color="text.secondary">Average Return</Text>
              <Text variant="body2" style={styles.decadeValue}>
                {formatPercentage(decade.averageReturn)}
              </Text>
            </View>
          </View>

          {decade.keyEvents.length > 0 && (
            <View style={styles.keyEvents}>
              <Text variant="caption" style={styles.keyEventsTitle}>Key Events:</Text>
              {decade.keyEvents.map((event, eventIndex) => (
                <Text key={eventIndex} variant="caption" style={styles.keyEvent}>
                  • {event}
                </Text>
              ))}
            </View>
          )}

          {selectedDecade === index && (
            <View style={styles.decadeDetails}>
              <Text variant="body2" style={styles.detailsTitle}>Yearly Breakdown:</Text>
              {decade.projections.map((projection) => (
                <View key={projection.year} style={styles.yearDetail}>
                  <Text variant="caption" style={styles.yearDetailText}>
                    Year {projection.year}: {formatCurrency(projection.endingNetWorth)} 
                    ({projection.fireProgress.toFixed(1)}% to FIRE)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      ))}
    </View>
  );

  /**
   * Render summary tab
   */
  const renderSummaryTab = () => {
    if (!summary) return null;

    return (
      <View style={styles.tabContent}>
        {/* Key Metrics */}
        <Card style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            📊 Key Metrics
          </Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text variant="h4" style={styles.metricValue}>
                {summary.fireYear}
              </Text>
              <Text variant="caption" color="text.secondary">Years to FIRE</Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="h4" style={styles.metricValue}>
                {summary.fireAge}
              </Text>
              <Text variant="caption" color="text.secondary">FIRE Age</Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="h4" style={styles.metricValue}>
                {formatCurrency(summary.finalNetWorth)}
              </Text>
              <Text variant="caption" color="text.secondary">Final Net Worth</Text>
            </View>
          </View>
        </Card>

        {/* Financial Summary */}
        <Card style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            💰 Financial Summary
          </Text>
          
          <View style={styles.summaryRow}>
            <Text variant="body2" style={styles.summaryLabel}>Total Contributions:</Text>
            <Text variant="body2" style={styles.summaryValue}>
              {formatCurrency(summary.totalContributions)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="body2" style={styles.summaryLabel}>Total Growth:</Text>
            <Text variant="body2" style={styles.summaryValue}>
              {formatCurrency(summary.totalGrowth)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="body2" style={styles.summaryLabel}>Total Expenses:</Text>
            <Text variant="body2" style={styles.summaryValue}>
              {formatCurrency(summary.totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="body2" style={styles.summaryLabel}>Average Return:</Text>
            <Text variant="body2" style={styles.summaryValue}>
              {formatPercentage(summary.averageReturn)}
            </Text>
          </View>
        </Card>

        {/* Milestones */}
        {summary.keyMilestones.length > 0 && (
          <Card style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>
              🎯 Key Milestones
            </Text>
            
            {summary.keyMilestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneItem}>
                <Text variant="body2" style={styles.milestoneDescription}>
                  ✅ {milestone.description}
                </Text>
                <Text variant="caption" color="text.secondary">
                  {formatCurrency(milestone.value)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Risk Analysis */}
        <Card style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            ⚠️ Risk Analysis
          </Text>
          
          <View style={styles.riskItem}>
            <Text variant="body2" style={styles.riskLabel}>Withdrawal Sustainability:</Text>
            <View style={[
              styles.riskIndicator,
              { backgroundColor: summary.riskMetrics.withdrawalSustainability > 0.7 ? '#4CAF50' : '#FF9800' }
            ]}>
              <Text style={styles.riskText}>
                {summary.riskMetrics.withdrawalSustainability > 0.7 ? 'Good' : 'Moderate'}
              </Text>
            </View>
          </View>
          
          <View style={styles.riskItem}>
            <Text variant="body2" style={styles.riskLabel}>Emergency Fund:</Text>
            <View style={[
              styles.riskIndicator,
              { backgroundColor: summary.riskMetrics.emergencyFundAdequacy > 0.6 ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.riskText}>
                {summary.riskMetrics.emergencyFundAdequacy > 0.6 ? 'Adequate' : 'Low'}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant="h6">Loading Projections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scenario || !projections.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text variant="h6">No Projections Available</Text>
          <Button
            title="Back to Scenarios"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="h5" style={styles.title}>
            📈 Yearly Projections
          </Text>
          <Text variant="caption" color="text.secondary">
            {scenario.emoji} {scenario.name}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              Alert.alert(
                'Export Format',
                'Choose export format:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'CSV', onPress: () => exportProjections('csv') },
                  { text: 'Excel', onPress: () => exportProjections('excel') },
                  { text: 'PDF', onPress: () => exportProjections('pdf') },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.exportButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'yearly', label: 'Yearly' },
          { key: 'decades', label: 'Decades' },
          { key: 'summary', label: 'Summary' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => {
              buttonTap();
              setActiveTab(tab.key as any);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.activeTabButtonText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'yearly' && renderYearlyTab()}
        {activeTab === 'decades' && renderDecadesTab()}
        {activeTab === 'summary' && renderSummaryTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  backButton: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: 18,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  activeTabButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  controlsCard: {
    padding: 12,
    marginBottom: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  activeFilterButton: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  sortGroup: {
    alignItems: 'flex-end',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontWeight: '600',
    color: '#666666',
  },
  projectionsList: {
    backgroundColor: '#FFFFFF',
    maxHeight: 400,
  },
  projectionRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  projectionCell: {
    flex: 1,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 12,
  },
  decadeCard: {
    padding: 16,
    marginBottom: 16,
  },
  decadeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  decadeTitle: {
    flex: 1,
  },
  expandIcon: {
    fontSize: 16,
    color: '#2196F3',
  },
  decadeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  decadeMetric: {
    flex: 1,
    alignItems: 'center',
  },
  decadeValue: {
    marginTop: 4,
    fontWeight: '600',
  },
  keyEvents: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  keyEventsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  keyEvent: {
    marginBottom: 4,
    paddingLeft: 8,
  },
  decadeDetails: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
  },
  detailsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  yearDetail: {
    marginBottom: 4,
  },
  yearDetailText: {
    fontSize: 11,
    paddingLeft: 8,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricValue: {
    marginBottom: 8,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    flex: 1,
  },
  summaryValue: {
    fontWeight: '600',
    color: '#2196F3',
  },
  milestoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  milestoneDescription: {
    flex: 1,
  },
  riskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  riskLabel: {
    flex: 1,
  },
  riskIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default YearlyProjectionsScreen;
