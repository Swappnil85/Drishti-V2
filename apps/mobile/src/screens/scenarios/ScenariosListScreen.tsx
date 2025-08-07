/**
 * ScenariosListScreen Component
 * Epic 9, Story 1: Comprehensive scenarios list with search, filtering, and management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { ScenariosStackScreenProps } from '../../types/navigation';
import { Text, Button, Card, Container } from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';
import useScenarios from '../../hooks/useScenarios';
import { EnhancedScenario } from '@drishti/shared/types/financial';

type Props = ScenariosStackScreenProps<'ScenariosList'>;

const ScenariosListScreen: React.FC<Props> = ({ navigation }) => {
  // Hooks
  const { buttonTap, successFeedback, errorFeedback } = useHaptic();
  const {
    scenarios,
    stats,
    loading,
    refreshing,
    error,
    refresh,
    deleteScenario,
    cloneScenario,
  } = useScenarios();

  // State
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Navigation setup
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          variant='ghost'
          size='sm'
          onPress={handleCreateScenario}
          title='+'
        />
      ),
    });
  }, [navigation]);

  /**
   * Handle create scenario
   */
  const handleCreateScenario = () => {
    buttonTap();
    navigation.navigate('CreateScenario');
  };

  /**
   * Handle scenario selection
   */
  const handleScenarioPress = (scenario: EnhancedScenario) => {
    buttonTap();
    if (isSelectionMode) {
      toggleScenarioSelection(scenario.id);
    } else {
      navigation.navigate('ScenarioDetails', { scenarioId: scenario.id });
    }
  };

  /**
   * Handle scenario long press
   */
  const handleScenarioLongPress = (scenario: EnhancedScenario) => {
    buttonTap();
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedScenarios([scenario.id]);
    }
  };

  /**
   * Toggle scenario selection
   */
  const toggleScenarioSelection = (scenarioId: string) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        const newSelection = prev.filter(id => id !== scenarioId);
        if (newSelection.length === 0) {
          setIsSelectionMode(false);
        }
        return newSelection;
      } else {
        return [...prev, scenarioId];
      }
    });
  };

  /**
   * Handle scenario deletion
   */
  const handleDeleteScenario = (scenarioId: string) => {
    Alert.alert(
      'Delete Scenario',
      'Are you sure you want to delete this scenario? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteScenario(scenarioId);
            if (success) {
              successFeedback();
            } else {
              errorFeedback();
            }
          },
        },
      ]
    );
  };

  /**
   * Handle scenario cloning
   */
  const handleCloneScenario = (scenario: EnhancedScenario) => {
    Alert.prompt(
      'Clone Scenario',
      'Enter a name for the cloned scenario:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clone',
          onPress: async newName => {
            if (newName && newName.trim()) {
              const cloned = await cloneScenario(scenario.id, newName.trim());
              if (cloned) {
                successFeedback();
                navigation.navigate('ScenarioDetails', {
                  scenarioId: cloned.id,
                });
              } else {
                errorFeedback();
              }
            }
          },
        },
      ],
      'plain-text',
      `Copy of ${scenario.name}`
    );
  };

  /**
   * Render scenario card
   */
  const renderScenarioCard = ({
    item: scenario,
  }: {
    item: EnhancedScenario;
  }) => {
    const isSelected = selectedScenarios.includes(scenario.id);

    return (
      <TouchableOpacity
        style={[styles.scenarioCard, isSelected && styles.scenarioCardSelected]}
        onPress={() => handleScenarioPress(scenario)}
        onLongPress={() => handleScenarioLongPress(scenario)}
        activeOpacity={0.7}
      >
        <Card
          style={[styles.cardContent, isSelected && styles.cardContentSelected]}
        >
          <View style={styles.scenarioHeader}>
            <View
              style={[styles.scenarioIcon, { backgroundColor: scenario.color }]}
            >
              <Text style={styles.scenarioEmoji}>{scenario.emoji}</Text>
            </View>
            <View style={styles.scenarioInfo}>
              <Text variant='h6' style={styles.scenarioName}>
                {scenario.name}
              </Text>
              <Text variant='caption' color='text.secondary'>
                {scenario.template_type?.replace('_', ' ').toUpperCase() ||
                  'CUSTOM'}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text variant='caption' style={styles.selectedText}>
                  ✓
                </Text>
              </View>
            )}
          </View>

          {scenario.description && (
            <Text
              variant='body2'
              color='text.secondary'
              style={styles.scenarioDescription}
            >
              {scenario.description}
            </Text>
          )}

          <View style={styles.scenarioMeta}>
            <View style={styles.metaItem}>
              <Text variant='caption' color='text.secondary'>
                Updated
              </Text>
              <Text variant='caption' style={styles.metaValue}>
                {new Date(scenario.updated_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text variant='caption' color='text.secondary'>
                Status
              </Text>
              <Text
                variant='caption'
                style={[
                  styles.metaValue,
                  {
                    color:
                      scenario.calculation_status === 'completed'
                        ? '#4CAF50'
                        : '#FF9800',
                  },
                ]}
              >
                {scenario.calculation_status || 'Pending'}
              </Text>
            </View>
          </View>

          {scenario.tags && scenario.tags.length > 0 && (
            <View style={styles.scenarioTags}>
              {scenario.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text variant='caption' style={styles.tagText}>
                    {tag}
                  </Text>
                </View>
              ))}
              {scenario.tags.length > 3 && (
                <View style={styles.tag}>
                  <Text variant='caption' style={styles.tagText}>
                    +{scenario.tags.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCloneScenario(scenario)}
            >
              <Text variant='caption' style={styles.actionButtonText}>
                Clone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('EditScenario', { scenarioId: scenario.id })
              }
            >
              <Text variant='caption' style={styles.actionButtonText}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteScenario(scenario.id)}
            >
              <Text
                variant='caption'
                style={[styles.actionButtonText, styles.deleteButtonText]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant='h2' style={styles.emptyIcon}>
        📊
      </Text>
      <Text variant='h6' style={styles.emptyTitle}>
        No Scenarios Yet
      </Text>
      <Text
        variant='body1'
        color='text.secondary'
        style={styles.emptyDescription}
      >
        Create your first financial scenario to start planning your FIRE journey
      </Text>
      <Button
        variant='primary'
        onPress={handleCreateScenario}
        title='Create First Scenario'
        style={styles.emptyButton}
      />
    </View>
  );

  /**
   * Render stats header
   */
  const renderStatsHeader = () => {
    if (!stats) return null;

    return (
      <Card style={styles.statsCard}>
        <Text variant='h6' style={styles.statsTitle}>
          Your Scenarios
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant='h5' style={styles.statValue}>
              {stats.totalScenarios}
            </Text>
            <Text variant='caption' color='text.secondary'>
              Total
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant='h5' style={styles.statValue}>
              {stats.activeScenarios}
            </Text>
            <Text variant='caption' color='text.secondary'>
              Active
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant='h5' style={styles.statValue}>
              {stats.averageFeasibilityScore}%
            </Text>
            <Text variant='caption' color='text.secondary'>
              Avg Score
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container style={styles.content}>
        {error && (
          <Card style={styles.errorCard}>
            <Text variant='body2' style={styles.errorText}>
              {error}
            </Text>
          </Card>
        )}

        <FlatList
          data={scenarios}
          renderItem={renderScenarioCard}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderStatsHeader}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            scenarios.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor='#2196F3'
            />
          }
        />
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  errorCard: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#C62828',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 12,
  },
  statsCard: {
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#2196F3',
    marginBottom: 4,
  },
  scenarioCard: {
    marginBottom: 12,
  },
  scenarioCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  cardContent: {
    padding: 16,
  },
  cardContentSelected: {
    borderColor: '#2196F3',
    borderWidth: 2,
    backgroundColor: '#F3F8FF',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scenarioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scenarioEmoji: {
    fontSize: 24,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioName: {
    marginBottom: 2,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scenarioDescription: {
    marginBottom: 12,
    lineHeight: 18,
  },
  scenarioMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaValue: {
    fontWeight: '600',
    marginTop: 2,
  },
  scenarioTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#1976D2',
    fontSize: 10,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default ScenariosListScreen;
