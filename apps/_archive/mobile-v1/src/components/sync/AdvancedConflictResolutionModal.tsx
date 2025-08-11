import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '@react-navigation/native';

// Web-compatible components
const Badge = ({ children, colorScheme, variant, size, style }: any) => (
  <View
    style={[
      {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor:
          colorScheme === 'blue'
            ? '#3b82f6'
            : colorScheme === 'green'
              ? '#10b981'
              : colorScheme === 'yellow'
                ? '#f59e0b'
                : colorScheme === 'red'
                  ? '#ef4444'
                  : colorScheme === 'orange'
                    ? '#f97316'
                    : '#6b7280',
      },
      style,
    ]}
  >
    <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
      {children}
    </Text>
  </View>
);

const Button = ({
  children,
  onPress,
  disabled,
  variant,
  size,
  leftIcon,
  colorScheme,
  style,
}: any) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor:
          variant === 'outline'
            ? 'transparent'
            : colorScheme === 'red'
              ? '#ef4444'
              : colorScheme === 'green'
                ? '#10b981'
                : colorScheme === 'blue'
                  ? '#3b82f6'
                  : '#3b82f6',
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor:
          colorScheme === 'red'
            ? '#ef4444'
            : colorScheme === 'green'
              ? '#10b981'
              : colorScheme === 'blue'
                ? '#3b82f6'
                : '#3b82f6',
        opacity: disabled ? 0.5 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      style,
    ]}
  >
    {leftIcon}
    <Text
      style={{
        color:
          variant === 'outline'
            ? colorScheme === 'red'
              ? '#ef4444'
              : '#3b82f6'
            : 'white',
        fontSize: 14,
        fontWeight: '500',
      }}
    >
      {children}
    </Text>
  </TouchableOpacity>
);

const Icon = ({ name, size, color, style }: any) => {
  const iconMap: { [key: string]: string } = {
    close: '✕',
    check: '✓',
    warning: '⚠️',
    merge: '🔀',
    download: '⬇️',
    upload: '⬆️',
    'auto-fix': '🔧',
    settings: '⚙️',
    info: 'ℹ️',
    'chevron-down': '▼',
    'chevron-up': '▲',
  };

  return (
    <Text style={[{ color, fontSize: size === 'sm' ? 16 : 20 }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

const Progress = ({ value, colorScheme, style }: any) => (
  <View
    style={[{ height: 8, backgroundColor: '#e5e5e5', borderRadius: 4 }, style]}
  >
    <View
      style={{
        height: '100%',
        width: `${value}%`,
        backgroundColor: colorScheme === 'green' ? '#10b981' : '#3b82f6',
        borderRadius: 4,
      }}
    />
  </View>
);

const Divider = ({ style }: any) => (
  <View
    style={[
      { height: 1, backgroundColor: '#e5e5e5', marginVertical: 8 },
      style,
    ]}
  />
);

import {
  EnhancedSyncConflict,
  ConflictDiff,
  BulkResolutionOptions,
} from '../../services/sync/AdvancedConflictResolutionService';

interface AdvancedConflictResolutionModalProps {
  visible: boolean;
  conflicts: EnhancedSyncConflict[];
  onResolve: (
    conflict: EnhancedSyncConflict,
    resolution: 'client' | 'server' | 'merge',
    mergedData?: any
  ) => void;
  onBulkResolve: (
    conflicts: EnhancedSyncConflict[],
    options: BulkResolutionOptions
  ) => void;
  onAutoResolve: (conflicts: EnhancedSyncConflict[]) => void;
  onClose: () => void;
  testID?: string;
}

/**
 * AdvancedConflictResolutionModal provides comprehensive conflict resolution
 * with diff visualization, smart merge suggestions, and bulk operations
 */
export default function AdvancedConflictResolutionModal({
  visible,
  conflicts,
  onResolve,
  onBulkResolve,
  onAutoResolve,
  onClose,
  testID,
}: AdvancedConflictResolutionModalProps) {
  const theme = useTheme();
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [selectedResolution, setSelectedResolution] = useState<
    'client' | 'server' | 'merge'
  >('server');
  const [showDiffView, setShowDiffView] = useState(false);
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [customMergeData, setCustomMergeData] = useState<any>(null);
  const [bulkOptions, setBulkOptions] = useState<BulkResolutionOptions>({
    strategy: 'smart_merge',
    applyToSimilar: true,
    requireConfirmation: true,
  });

  const currentConflict = conflicts[currentConflictIndex];
  const progress =
    conflicts.length > 0
      ? ((currentConflictIndex + 1) / conflicts.length) * 100
      : 0;

  useEffect(() => {
    if (currentConflict) {
      setSelectedResolution(currentConflict.suggestedResolution);
      setCustomMergeData(currentConflict.smartMergeSuggestion);
    }
  }, [currentConflict]);

  if (!currentConflict) {
    return null;
  }

  const handleResolve = () => {
    const mergedData =
      selectedResolution === 'merge' ? customMergeData : undefined;
    onResolve(currentConflict, selectedResolution, mergedData);
    moveToNextConflict();
  };

  const handleSkip = () => {
    moveToNextConflict();
  };

  const moveToNextConflict = () => {
    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(currentConflictIndex + 1);
    } else {
      onClose();
    }
  };

  const handleBulkResolve = () => {
    if (bulkOptions.requireConfirmation) {
      Alert.alert(
        'Bulk Resolution',
        `This will resolve ${conflicts.length} conflicts using the ${bulkOptions.strategy} strategy. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => onBulkResolve(conflicts, bulkOptions),
          },
        ]
      );
    } else {
      onBulkResolve(conflicts, bulkOptions);
    }
  };

  const handleAutoResolve = () => {
    const autoResolvableCount = conflicts.filter(c => c.autoResolvable).length;

    if (autoResolvableCount === 0) {
      Alert.alert(
        'No Auto-Resolvable Conflicts',
        'None of the current conflicts can be automatically resolved.'
      );
      return;
    }

    Alert.alert(
      'Auto-Resolve Conflicts',
      `${autoResolvableCount} of ${conflicts.length} conflicts can be automatically resolved. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Auto-Resolve', onPress: () => onAutoResolve(conflicts) },
      ]
    );
  };

  const getSeverityColor = (severity: EnhancedSyncConflict['severity']) => {
    switch (severity) {
      case 'critical':
        return '#ef4444'; // red
      case 'high':
        return '#f59e0b'; // amber
      case 'medium':
        return '#3b82f6'; // blue
      case 'low':
        return '#10b981'; // green
      default:
        return theme.colors.text.secondary;
    }
  };

  const getDiffTypeColor = (diffType: ConflictDiff['diffType']) => {
    switch (diffType) {
      case 'added':
        return '#10b981'; // green
      case 'removed':
        return '#ef4444'; // red
      case 'modified':
        return '#f59e0b'; // amber
      default:
        return theme.colors.text.secondary;
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Resolve Conflicts
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.text.secondary }]}
            >
              {currentConflictIndex + 1} of {conflicts.length}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name='close' size='md' color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Progress value={progress} colorScheme='blue' size='sm' />
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.text.secondary },
            ]}
          >
            {Math.round(progress)}% Complete
          </Text>
        </View>

        {/* Conflict Info */}
        <View style={styles.conflictInfo}>
          <View style={styles.rowBetween}>
            <Text
              style={[
                styles.conflictTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              {currentConflict.title}
            </Text>
            <Badge
              colorScheme={
                currentConflict.severity === 'critical'
                  ? 'red'
                  : currentConflict.severity === 'high'
                    ? 'orange'
                    : currentConflict.severity === 'medium'
                      ? 'blue'
                      : 'green'
              }
            >
              {currentConflict.severity.toUpperCase()}
            </Badge>
          </View>

          <Text
            style={[
              styles.conflictDescription,
              { color: theme.colors.text.secondary },
            ]}
          >
            {currentConflict.description}
          </Text>

          {currentConflict.autoResolvable && (
            <View style={styles.autoResolvableTag}>
              <Icon name='auto-fix-high' size='sm' color='#10b981' />
              <Text style={[styles.autoResolvableText, { color: '#10b981' }]}>
                Auto-resolvable
              </Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Diff View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !showDiffView && styles.toggleButtonActive,
              ]}
              onPress={() => setShowDiffView(false)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  {
                    color: !showDiffView
                      ? theme.colors.primary
                      : theme.colors.text.secondary,
                  },
                ]}
              >
                Summary
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                showDiffView && styles.toggleButtonActive,
              ]}
              onPress={() => setShowDiffView(true)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  {
                    color: showDiffView
                      ? theme.colors.primary
                      : theme.colors.text.secondary,
                  },
                ]}
              >
                Detailed Diff ({currentConflict.diffs.length})
              </Text>
            </TouchableOpacity>
          </View>

          {showDiffView ? (
            /* Detailed Diff View */
            <View style={styles.diffContainer}>
              {currentConflict.diffs.map((diff, index) => (
                <View key={index} style={styles.diffItem}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={[
                        styles.diffField,
                        { color: theme.colors.text.primary },
                      ]}
                    >
                      {diff.field}
                    </Text>
                    <Badge
                      colorScheme={
                        diff.diffType === 'added'
                          ? 'green'
                          : diff.diffType === 'removed'
                            ? 'red'
                            : diff.diffType === 'modified'
                              ? 'orange'
                              : 'gray'
                      }
                      size='sm'
                    >
                      {diff.diffType}
                    </Badge>
                  </View>

                  <View style={styles.diffValues}>
                    <View style={styles.diffValue}>
                      <Text
                        style={[
                          styles.diffLabel,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        Your Version:
                      </Text>
                      <Text
                        style={[
                          styles.diffText,
                          { color: theme.colors.text.primary },
                        ]}
                      >
                        {formatValue(diff.clientValue)}
                      </Text>
                    </View>

                    <View style={styles.diffValue}>
                      <Text
                        style={[
                          styles.diffLabel,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        Server Version:
                      </Text>
                      <Text
                        style={[
                          styles.diffText,
                          { color: theme.colors.text.primary },
                        ]}
                      >
                        {formatValue(diff.serverValue)}
                      </Text>
                    </View>

                    {diff.suggestedResolution && (
                      <View style={styles.diffSuggestion}>
                        <Text
                          style={[
                            styles.diffLabel,
                            { color: theme.colors.text.secondary },
                          ]}
                        >
                          Suggested: {diff.suggestedResolution}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            /* Summary View */
            <View style={styles.summaryContainer}>
              <View style={styles.dataComparison}>
                <View style={styles.dataVersion}>
                  <Text
                    style={[
                      styles.versionTitle,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    Your Version
                  </Text>
                  <Text
                    style={[
                      styles.versionData,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    {formatValue(currentConflict.client_data)}
                  </Text>
                </View>

                <View style={styles.dataVersion}>
                  <Text
                    style={[
                      styles.versionTitle,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    Server Version
                  </Text>
                  <Text
                    style={[
                      styles.versionData,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    {formatValue(currentConflict.server_data)}
                  </Text>
                </View>
              </View>

              {currentConflict.smartMergeSuggestion && (
                <View style={styles.mergeSuggestion}>
                  <Text
                    style={[
                      styles.versionTitle,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    Smart Merge Suggestion
                  </Text>
                  <Text
                    style={[
                      styles.versionData,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    {formatValue(currentConflict.smartMergeSuggestion)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Divider my={4} />

          {/* Resolution Options */}
          <View style={styles.resolutionSection}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              Choose Resolution
            </Text>

            <View style={styles.resolutionOptions}>
              <TouchableOpacity
                style={[
                  styles.resolutionOption,
                  selectedResolution === 'client' && styles.selectedOption,
                ]}
                onPress={() => setSelectedResolution('client')}
              >
                <View style={styles.rowBetween}>
                  <View>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: theme.colors.text.primary },
                      ]}
                    >
                      Keep Your Version
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: theme.colors.text.secondary },
                      ]}
                    >
                      Use your local changes
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      selectedResolution === 'client' &&
                        styles.radioButtonSelected,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resolutionOption,
                  selectedResolution === 'server' && styles.selectedOption,
                ]}
                onPress={() => setSelectedResolution('server')}
              >
                <View style={styles.rowBetween}>
                  <View>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: theme.colors.text.primary },
                      ]}
                    >
                      Keep Server Version
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: theme.colors.text.secondary },
                      ]}
                    >
                      Use the server version
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      selectedResolution === 'server' &&
                        styles.radioButtonSelected,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {currentConflict.smartMergeSuggestion && (
                <TouchableOpacity
                  style={[
                    styles.resolutionOption,
                    selectedResolution === 'merge' && styles.selectedOption,
                  ]}
                  onPress={() => setSelectedResolution('merge')}
                >
                  <View style={styles.rowBetween}>
                    <View>
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: theme.colors.text.primary },
                        ]}
                      >
                        Smart Merge
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        Combine both versions intelligently
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioButton,
                        selectedResolution === 'merge' &&
                          styles.radioButtonSelected,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {/* Bulk Actions */}
          <View style={styles.bulkActions}>
            <Button
              variant='outline'
              size='sm'
              onPress={() => setShowBulkOptions(!showBulkOptions)}
              leftIcon={<Icon name='settings' size='sm' />}
            >
              Bulk Options
            </Button>

            <Button
              variant='outline'
              size='sm'
              onPress={handleAutoResolve}
              leftIcon={<Icon name='auto-fix-high' size='sm' />}
            >
              Auto-Resolve
            </Button>
          </View>

          {/* Bulk Options Panel */}
          {showBulkOptions && (
            <View style={styles.bulkOptionsPanel}>
              <Text
                style={[
                  styles.bulkOptionsTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                Bulk Resolution Options
              </Text>

              <View style={styles.bulkOption}>
                <Text
                  style={[
                    styles.bulkOptionLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Strategy:
                </Text>
                <View style={styles.strategyButtons}>
                  {(
                    [
                      'client_wins',
                      'server_wins',
                      'smart_merge',
                      'user_pattern',
                    ] as const
                  ).map(strategy => (
                    <TouchableOpacity
                      key={strategy}
                      style={[
                        styles.strategyButton,
                        bulkOptions.strategy === strategy &&
                          styles.strategyButtonActive,
                      ]}
                      onPress={() =>
                        setBulkOptions({ ...bulkOptions, strategy })
                      }
                    >
                      <Text
                        style={[
                          styles.strategyButtonText,
                          {
                            color:
                              bulkOptions.strategy === strategy
                                ? theme.colors.primary
                                : theme.colors.text.secondary,
                          },
                        ]}
                      >
                        {strategy.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.bulkOption}>
                <View style={styles.rowBetween}>
                  <Text
                    style={[
                      styles.bulkOptionLabel,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Apply to similar conflicts
                  </Text>
                  <Switch
                    value={bulkOptions.applyToSimilar}
                    onValueChange={value =>
                      setBulkOptions({ ...bulkOptions, applyToSimilar: value })
                    }
                  />
                </View>
              </View>

              <View style={styles.bulkOption}>
                <View style={styles.rowBetween}>
                  <Text
                    style={[
                      styles.bulkOptionLabel,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Require confirmation
                  </Text>
                  <Switch
                    value={bulkOptions.requireConfirmation}
                    onValueChange={value =>
                      setBulkOptions({
                        ...bulkOptions,
                        requireConfirmation: value,
                      })
                    }
                  />
                </View>
              </View>

              <Button
                onPress={handleBulkResolve}
                colorScheme='blue'
                size='sm'
                mt={2}
              >
                Apply Bulk Resolution
              </Button>
            </View>
          )}

          {/* Individual Actions */}
          <View style={styles.individualActions}>
            <Button variant='outline' onPress={handleSkip} size='md'>
              Skip
            </Button>

            <Button
              onPress={handleResolve}
              colorScheme='blue'
              size='md'
              leftIcon={<Icon name='check' size='sm' />}
            >
              Resolve
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  conflictInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  conflictDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  autoResolvableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  autoResolvableText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  viewToggle: {
    flexDirection: 'row',
    marginVertical: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  diffContainer: {
    gap: 16,
  },
  diffItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  diffField: {
    fontSize: 14,
    fontWeight: '600',
  },
  diffValues: {
    gap: 8,
  },
  diffValue: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
  },
  diffLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  diffText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  diffSuggestion: {
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    padding: 8,
  },
  summaryContainer: {
    gap: 16,
  },
  dataComparison: {
    gap: 12,
  },
  dataVersion: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  versionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  versionData: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  mergeSuggestion: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  resolutionSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  resolutionOptions: {
    gap: 8,
  },
  resolutionOption: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  radioButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 12,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkOptionsPanel: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  bulkOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bulkOption: {
    gap: 8,
  },
  bulkOptionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  strategyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  strategyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  strategyButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  strategyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  individualActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
});
