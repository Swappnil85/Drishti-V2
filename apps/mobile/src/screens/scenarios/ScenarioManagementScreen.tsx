/**
 * Scenario Management Screen
 * Epic 9, Story 3: Advanced scenario management with versioning, sharing, and archival
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
} from 'react-native';
import { Text, Card, Button, Input } from '../../components/ui';
import { useHaptic } from '../../hooks/useHaptic';
import { useScenarios } from '../../hooks/useScenarios';
import {
  scenarioVersioningService,
  ScenarioVersion,
  ScenarioShare,
  ArchivedScenario,
  ScenarioTemplate,
} from '../../services/scenario/ScenarioVersioningService';
import { EnhancedScenario } from '@drishti/shared/types/financial';

interface ScenarioManagementScreenProps {
  route: {
    params: {
      scenarioId: string;
    };
  };
  navigation: any;
}

const ScenarioManagementScreen: React.FC<ScenarioManagementScreenProps> = ({
  route,
  navigation,
}) => {
  const { buttonTap } = useHaptic();
  const { scenarios, loading } = useScenarios();
  const [scenario, setScenario] = useState<EnhancedScenario | null>(null);
  const [versions, setVersions] = useState<ScenarioVersion[]>([]);
  const [shares, setShares] = useState<ScenarioShare[]>([]);
  const [archivedScenarios, setArchivedScenarios] = useState<ArchivedScenario[]>([]);
  const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'versions' | 'sharing' | 'archive' | 'templates'>('versions');
  const [showCreateShare, setShowCreateShare] = useState(false);
  const [shareType, setShareType] = useState<'public' | 'private' | 'team'>('private');
  const [shareExpiry, setShareExpiry] = useState<string>('7');

  useEffect(() => {
    initializeData();
  }, [route.params.scenarioId]);

  /**
   * Initialize data
   */
  const initializeData = async () => {
    const { scenarioId } = route.params;
    
    // Find scenario
    const foundScenario = scenarios.find(s => s.id === scenarioId);
    if (foundScenario) {
      setScenario(foundScenario);
    }

    // Load versions
    const scenarioVersions = scenarioVersioningService.getVersions(scenarioId);
    setVersions(scenarioVersions);

    // Load archived scenarios
    const archived = scenarioVersioningService.getArchivedScenarios();
    setArchivedScenarios(archived);

    // Load templates
    const marketplace = scenarioVersioningService.getTemplateMarketplace();
    setTemplates(marketplace);
  };

  /**
   * Create new version
   */
  const createVersion = async (reason: string) => {
    if (!scenario) return;

    try {
      const newVersion = await scenarioVersioningService.createVersion(
        scenario.id,
        scenario,
        reason
      );
      
      setVersions(prev => [...prev, newVersion]);
      Alert.alert('Success', 'New version created successfully');
    } catch (error) {
      console.error('Error creating version:', error);
      Alert.alert('Error', 'Failed to create version');
    }
  };

  /**
   * Rollback to version
   */
  const rollbackToVersion = async (versionId: string, version: number) => {
    if (!scenario) return;

    Alert.alert(
      'Confirm Rollback',
      `Are you sure you want to rollback to version ${version}? This will create a new version.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback',
          style: 'destructive',
          onPress: async () => {
            try {
              const newVersion = await scenarioVersioningService.rollbackToVersion(
                scenario.id,
                versionId,
                `Rollback to v${version}`
              );
              
              setVersions(prev => [...prev, newVersion]);
              Alert.alert('Success', 'Rollback completed successfully');
            } catch (error) {
              console.error('Error rolling back:', error);
              Alert.alert('Error', 'Failed to rollback version');
            }
          },
        },
      ]
    );
  };

  /**
   * Share scenario
   */
  const shareScenario = async () => {
    if (!scenario) return;

    const activeVersion = versions.find(v => v.isActive);
    if (!activeVersion) {
      Alert.alert('Error', 'No active version found');
      return;
    }

    try {
      const share = await scenarioVersioningService.shareScenario(
        scenario.id,
        activeVersion.id,
        shareType,
        {
          canView: true,
          canCopy: shareType !== 'private',
          canComment: shareType === 'team',
          canModify: false,
        },
        parseInt(shareExpiry)
      );

      // Share the code
      await Share.share({
        message: `Check out my FIRE scenario: ${scenario.name}\n\nShare Code: ${share.shareCode}\n\nUse this code in the Drishti app to view the scenario.`,
        title: 'FIRE Scenario Share',
      });

      setShowCreateShare(false);
      Alert.alert('Success', `Scenario shared! Share code: ${share.shareCode}`);
    } catch (error) {
      console.error('Error sharing scenario:', error);
      Alert.alert('Error', 'Failed to share scenario');
    }
  };

  /**
   * Archive scenario
   */
  const archiveScenario = async () => {
    if (!scenario) return;

    Alert.alert(
      'Archive Scenario',
      'Are you sure you want to archive this scenario? It will be moved to the archive and can be restored later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await scenarioVersioningService.archiveScenario(
                scenario.id,
                'User requested archive'
              );
              
              Alert.alert('Success', 'Scenario archived successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error archiving scenario:', error);
              Alert.alert('Error', 'Failed to archive scenario');
            }
          },
        },
      ]
    );
  };

  /**
   * Restore archived scenario
   */
  const restoreScenario = async (scenarioId: string) => {
    try {
      await scenarioVersioningService.restoreScenario(scenarioId);
      
      // Refresh archived scenarios
      const archived = scenarioVersioningService.getArchivedScenarios();
      setArchivedScenarios(archived);
      
      Alert.alert('Success', 'Scenario restored successfully');
    } catch (error) {
      console.error('Error restoring scenario:', error);
      Alert.alert('Error', 'Failed to restore scenario');
    }
  };

  /**
   * Create template from scenario
   */
  const createTemplate = async () => {
    if (!scenario) return;

    Alert.prompt(
      'Create Template',
      'Enter a name for your template:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (templateName) => {
            if (!templateName) return;
            
            try {
              await scenarioVersioningService.createTemplate(
                scenario,
                templateName,
                `Template based on ${scenario.name}`,
                'Custom',
                false
              );
              
              Alert.alert('Success', 'Template created successfully');
            } catch (error) {
              console.error('Error creating template:', error);
              Alert.alert('Error', 'Failed to create template');
            }
          },
        },
      ],
      'plain-text',
      scenario.name
    );
  };

  /**
   * Format date
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  /**
   * Get impact color
   */
  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'major': return '#F44336';
      case 'moderate': return '#FF9800';
      case 'minor': return '#4CAF50';
      default: return '#666666';
    }
  };

  /**
   * Render versions tab
   */
  const renderVersionsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h6" style={styles.sectionTitle}>
            📝 Version History
          </Text>
          <Button
            title="New Version"
            onPress={() => {
              Alert.prompt(
                'Create Version',
                'Enter reason for new version:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Create',
                    onPress: (reason) => reason && createVersion(reason),
                  },
                ]
              );
            }}
            style={styles.smallButton}
          />
        </View>

        {versions.length === 0 ? (
          <Text variant="body2" color="text.secondary" style={styles.emptyText}>
            No versions yet. Create your first version to track changes.
          </Text>
        ) : (
          versions.map((version, index) => (
            <View key={version.id} style={styles.versionItem}>
              <View style={styles.versionHeader}>
                <View style={styles.versionInfo}>
                  <Text variant="body2" style={styles.versionName}>
                    v{version.version} {version.isActive && '(Active)'}
                  </Text>
                  <Text variant="caption" color="text.secondary">
                    {formatDate(version.createdAt)}
                  </Text>
                </View>
                <View style={[
                  styles.impactBadge,
                  { backgroundColor: getImpactColor(version.metadata.impactLevel) }
                ]}>
                  <Text style={styles.impactText}>
                    {version.metadata.impactLevel.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text variant="caption" style={styles.changeReason}>
                {version.metadata.changeReason}
              </Text>

              {version.changes.length > 0 && (
                <View style={styles.changesContainer}>
                  <Text variant="caption" style={styles.changesTitle}>
                    Changes ({version.changes.length}):
                  </Text>
                  {version.changes.slice(0, 2).map((change, changeIndex) => (
                    <Text key={changeIndex} variant="caption" style={styles.changeItem}>
                      • {change.description}
                    </Text>
                  ))}
                  {version.changes.length > 2 && (
                    <Text variant="caption" style={styles.moreChanges}>
                      +{version.changes.length - 2} more changes
                    </Text>
                  )}
                </View>
              )}

              {!version.isActive && (
                <TouchableOpacity
                  style={styles.rollbackButton}
                  onPress={() => rollbackToVersion(version.id, version.version)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rollbackButtonText}>Rollback</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </Card>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant="h6">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!scenario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text variant="h6">Scenario Not Found</Text>
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
            {scenario.emoji} {scenario.name}
          </Text>
          <Text variant="caption" color="text.secondary">
            Scenario Management
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={createTemplate}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={archiveScenario}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>🗃️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'versions', label: 'Versions' },
          { key: 'sharing', label: 'Sharing' },
          { key: 'archive', label: 'Archive' },
          { key: 'templates', label: 'Templates' },
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
        {activeTab === 'versions' && renderVersionsTab()}
        {/* Other tabs would be implemented similarly */}
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
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
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
    fontSize: 14,
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
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    flex: 1,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  versionItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionInfo: {
    flex: 1,
  },
  versionName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  impactText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  changeReason: {
    marginBottom: 8,
    fontStyle: 'italic',
  },
  changesContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  changesTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  changeItem: {
    marginBottom: 2,
    paddingLeft: 8,
  },
  moreChanges: {
    color: '#2196F3',
    fontStyle: 'italic',
    paddingLeft: 8,
  },
  rollbackButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  rollbackButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ScenarioManagementScreen;
