import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SyncConflict } from '../../services/sync/SyncManager';

interface ConflictResolutionModalProps {
  visible: boolean;
  conflicts: SyncConflict[];
  onResolve: (
    conflictId: string,
    resolution: 'client' | 'server' | 'merge',
    mergedData?: any
  ) => void;
  onClose: () => void;
}

/**
 * ConflictResolutionModal allows users to resolve sync conflicts
 * Presents client vs server data and allows user to choose resolution
 */
export default function ConflictResolutionModal({
  visible,
  conflicts,
  onResolve,
  onClose,
}: ConflictResolutionModalProps) {
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [selectedResolution, setSelectedResolution] = useState<
    'client' | 'server' | 'merge'
  >('server');

  const currentConflict = conflicts[currentConflictIndex];

  if (!currentConflict) {
    return null;
  }

  const handleResolve = () => {
    onResolve(currentConflict.operation_id, selectedResolution);

    // Move to next conflict or close modal
    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(currentConflictIndex + 1);
      setSelectedResolution('server'); // Reset to default
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(currentConflictIndex + 1);
      setSelectedResolution('server');
    } else {
      onClose();
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'Not set';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return String(value);
  };

  const getConflictTypeDescription = (type: string): string => {
    switch (type) {
      case 'update_conflict':
        return 'Both local and server versions were modified';
      case 'delete_conflict':
        return 'Item was deleted locally but modified on server';
      case 'create_conflict':
        return 'Item was created in both places with different data';
      default:
        return 'Unknown conflict type';
    }
  };

  const renderDataComparison = () => {
    const clientData = currentConflict.client_data;
    const serverData = currentConflict.server_data;

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(clientData || {}),
      ...Object.keys(serverData || {}),
    ]);

    // Filter out internal fields
    const relevantKeys = Array.from(allKeys).filter(
      key =>
        !['id', 'user_id', 'created_at', 'updated_at', 'synced_at'].includes(
          key
        )
    );

    return (
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonHeader}>
          <Text style={styles.comparisonTitle}>Local Version</Text>
          <Text style={styles.comparisonTitle}>Server Version</Text>
        </View>

        {relevantKeys.map(key => {
          const clientValue = clientData?.[key];
          const serverValue = serverData?.[key];
          const isDifferent =
            JSON.stringify(clientValue) !== JSON.stringify(serverValue);

          return (
            <View
              key={key}
              style={[styles.comparisonRow, isDifferent && styles.conflictRow]}
            >
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldName}>{key}:</Text>
                <Text
                  style={[
                    styles.fieldValue,
                    isDifferent && styles.conflictValue,
                  ]}
                >
                  {formatValue(clientValue)}
                </Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldName}>{key}:</Text>
                <Text
                  style={[
                    styles.fieldValue,
                    isDifferent && styles.conflictValue,
                  ]}
                >
                  {formatValue(serverValue)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Resolve Sync Conflict</Text>
          <Text style={styles.subtitle}>
            {currentConflictIndex + 1} of {conflicts.length}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.conflictInfo}>
            <Text style={styles.conflictTitle}>
              {currentConflict.table.replace('_', ' ').toUpperCase()} Conflict
            </Text>
            <Text style={styles.conflictDescription}>
              {getConflictTypeDescription(currentConflict.conflict_type)}
            </Text>

            <View style={styles.timestampContainer}>
              <Text style={styles.timestamp}>
                Local:{' '}
                {new Date(currentConflict.client_timestamp).toLocaleString()}
              </Text>
              <Text style={styles.timestamp}>
                Server:{' '}
                {new Date(currentConflict.server_timestamp).toLocaleString()}
              </Text>
            </View>
          </View>

          {renderDataComparison()}

          <View style={styles.resolutionOptions}>
            <Text style={styles.resolutionTitle}>Choose Resolution:</Text>

            <TouchableOpacity
              style={[
                styles.resolutionOption,
                selectedResolution === 'client' && styles.selectedOption,
              ]}
              onPress={() => setSelectedResolution('client')}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Keep Local Version</Text>
                <View
                  style={[
                    styles.radioButton,
                    selectedResolution === 'client' &&
                      styles.radioButtonSelected,
                  ]}
                />
              </View>
              <Text style={styles.optionDescription}>
                Use your local changes and overwrite the server version
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resolutionOption,
                selectedResolution === 'server' && styles.selectedOption,
              ]}
              onPress={() => setSelectedResolution('server')}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Keep Server Version</Text>
                <View
                  style={[
                    styles.radioButton,
                    selectedResolution === 'server' &&
                      styles.radioButtonSelected,
                  ]}
                />
              </View>
              <Text style={styles.optionDescription}>
                Use the server version and discard your local changes
              </Text>
            </TouchableOpacity>

            {/* Merge option disabled for now - would require complex UI */}
            {/* <TouchableOpacity
              style={[
                styles.resolutionOption,
                selectedResolution === 'merge' && styles.selectedOption,
                styles.disabledOption,
              ]}
              disabled={true}
            >
              <View style={styles.optionHeader}>
                <Text style={[styles.optionTitle, styles.disabledText]}>Merge Changes</Text>
                <View style={styles.radioButton} />
              </View>
              <Text style={[styles.optionDescription, styles.disabledText]}>
                Manually combine both versions (coming soon)
              </Text>
            </TouchableOpacity> */}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resolveButton]}
            onPress={handleResolve}
          >
            <Text style={styles.resolveButtonText}>Resolve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  conflictInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  conflictTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  conflictDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  timestampContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  comparisonContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  conflictRow: {
    backgroundColor: '#fff3cd',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  fieldContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  fieldName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  conflictValue: {
    fontWeight: '600',
    color: '#856404',
  },
  resolutionOptions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  resolutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  resolutionOption: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  radioButtonSelected: {
    borderColor: '#007bff',
    backgroundColor: '#007bff',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  resolveButton: {
    backgroundColor: '#007bff',
  },
  skipButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
