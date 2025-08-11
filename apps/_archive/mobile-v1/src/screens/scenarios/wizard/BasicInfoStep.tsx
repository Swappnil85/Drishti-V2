/**
 * BasicInfoStep Component
 * Epic 9, Story 1: Basic information step in scenario creation wizard
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Text, Card, Input } from '../../../components/ui';
import { useHaptic } from '../../../hooks/useHaptic';
import { ScenarioWizardData } from '../CreateScenarioScreen';

interface BasicInfoStepProps {
  data: ScenarioWizardData;
  onUpdate: (updates: Partial<ScenarioWizardData>) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onUpdate }) => {
  const { buttonTap } = useHaptic();
  const [nameError, setNameError] = useState<string | null>(null);

  // Color options
  const colorOptions = [
    '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
    '#00BCD4', '#795548', '#607D8B', '#E91E63', '#3F51B5',
  ];

  // Emoji options
  const emojiOptions = [
    '📊', '📈', '📉', '💰', '🎯', '🚀', '⚡', '🔥', '💎', '🌟',
    '🏆', '💡', '🎪', '🎨', '🎭', '🎪', '🎯', '🎲', '🎳', '🎸',
  ];

  /**
   * Handle name change with validation
   */
  const handleNameChange = (name: string) => {
    onUpdate({ name });
    
    // Validate name
    if (name.trim().length === 0) {
      setNameError('Scenario name is required');
    } else if (name.length > 100) {
      setNameError('Name must be less than 100 characters');
    } else {
      setNameError(null);
    }
  };

  /**
   * Handle description change
   */
  const handleDescriptionChange = (description: string) => {
    onUpdate({ description });
  };

  /**
   * Handle color selection
   */
  const handleColorSelect = (color: string) => {
    buttonTap();
    onUpdate({ color });
  };

  /**
   * Handle emoji selection
   */
  const handleEmojiSelect = (emoji: string) => {
    buttonTap();
    onUpdate({ emoji });
  };

  /**
   * Handle folder change
   */
  const handleFolderChange = (folder: string) => {
    onUpdate({ folder });
  };

  /**
   * Handle tags change
   */
  const handleTagsChange = (tagsText: string) => {
    const tags = tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    onUpdate({ tags });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="h5" style={styles.title}>
          Basic Information
        </Text>
        <Text variant="body1" color="text.secondary" style={styles.subtitle}>
          Provide basic details for your scenario
        </Text>
      </View>

      {/* Scenario Name */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Scenario Name *
        </Text>
        <Input
          value={data.name}
          onChangeText={handleNameChange}
          placeholder="Enter scenario name"
          error={nameError}
          maxLength={100}
          style={styles.input}
        />
        <Text variant="caption" color="text.secondary" style={styles.hint}>
          Choose a descriptive name for your scenario
        </Text>
      </Card>

      {/* Description */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Description
        </Text>
        <TextInput
          value={data.description}
          onChangeText={handleDescriptionChange}
          placeholder="Describe your scenario (optional)"
          multiline
          numberOfLines={3}
          style={styles.textArea}
          maxLength={500}
        />
        <Text variant="caption" color="text.secondary" style={styles.hint}>
          Provide additional context or notes about this scenario
        </Text>
      </Card>

      {/* Visual Customization */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Visual Customization
        </Text>
        
        {/* Color Selection */}
        <View style={styles.customizationRow}>
          <Text variant="body2" style={styles.customizationLabel}>
            Color
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.colorScrollView}
          >
            <View style={styles.colorOptions}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    data.color === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => handleColorSelect(color)}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Emoji Selection */}
        <View style={styles.customizationRow}>
          <Text variant="body2" style={styles.customizationLabel}>
            Icon
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.emojiScrollView}
          >
            <View style={styles.emojiOptions}>
              {emojiOptions.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    data.emoji === emoji && styles.emojiOptionSelected,
                  ]}
                  onPress={() => handleEmojiSelect(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Card>

      {/* Organization */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Organization
        </Text>
        
        {/* Folder */}
        <View style={styles.organizationRow}>
          <Text variant="body2" style={styles.organizationLabel}>
            Folder
          </Text>
          <Input
            value={data.folder || ''}
            onChangeText={handleFolderChange}
            placeholder="Optional folder name"
            style={styles.organizationInput}
          />
        </View>

        {/* Tags */}
        <View style={styles.organizationRow}>
          <Text variant="body2" style={styles.organizationLabel}>
            Tags
          </Text>
          <Input
            value={data.tags?.join(', ') || ''}
            onChangeText={handleTagsChange}
            placeholder="Enter tags separated by commas"
            style={styles.organizationInput}
          />
        </View>
        
        <Text variant="caption" color="text.secondary" style={styles.hint}>
          Use folders and tags to organize your scenarios
        </Text>
      </Card>

      {/* Preview */}
      <Card style={styles.section}>
        <Text variant="h6" style={styles.sectionTitle}>
          Preview
        </Text>
        <View style={styles.preview}>
          <View style={styles.previewHeader}>
            <View style={[styles.previewIcon, { backgroundColor: data.color }]}>
              <Text style={styles.previewEmoji}>{data.emoji}</Text>
            </View>
            <View style={styles.previewInfo}>
              <Text variant="h6" style={styles.previewName}>
                {data.name || 'Scenario Name'}
              </Text>
              <Text variant="caption" color="text.secondary">
                {data.folder ? `📁 ${data.folder}` : 'No folder'}
              </Text>
            </View>
          </View>
          {data.description && (
            <Text variant="body2" color="text.secondary" style={styles.previewDescription}>
              {data.description}
            </Text>
          )}
          {data.tags && data.tags.length > 0 && (
            <View style={styles.previewTags}>
              {data.tags.map((tag, index) => (
                <View key={index} style={styles.previewTag}>
                  <Text variant="caption" style={styles.previewTagText}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 20,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  customizationRow: {
    marginBottom: 16,
  },
  customizationLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  colorScrollView: {
    maxHeight: 50,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000000',
  },
  emojiScrollView: {
    maxHeight: 50,
  },
  emojiOptions: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  emojiText: {
    fontSize: 20,
  },
  organizationRow: {
    marginBottom: 12,
  },
  organizationLabel: {
    marginBottom: 6,
    fontWeight: '600',
  },
  organizationInput: {
    flex: 1,
  },
  preview: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewEmoji: {
    fontSize: 20,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    marginBottom: 2,
  },
  previewDescription: {
    marginBottom: 8,
    lineHeight: 18,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewTagText: {
    color: '#1976D2',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default BasicInfoStep;
