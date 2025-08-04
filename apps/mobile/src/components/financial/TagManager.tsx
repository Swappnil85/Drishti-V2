/**
 * Tag Manager Component
 * Manages account tags with add/remove functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Icon, Button, Flex, Badge } from '../ui';
import { useFormHaptic } from '../../hooks/useHaptic';

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  maxTags?: number;
  suggestedTags?: string[];
  testID?: string;
}

const DEFAULT_SUGGESTED_TAGS = [
  'Emergency Fund',
  'Vacation',
  'House Down Payment',
  'Car Fund',
  'Investment',
  'Retirement',
  'Business',
  'Education',
  'Healthcare',
  'Debt Payoff',
];

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onTagsChange,
  label = 'Tags',
  placeholder = 'Add a tag...',
  maxTags = 10,
  suggestedTags = DEFAULT_SUGGESTED_TAGS,
  testID,
}) => {
  const theme = useTheme();
  const formHaptic = useFormHaptic();
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = async (tag: string) => {
    const trimmedTag = tag.trim();
    
    if (!trimmedTag) return;
    
    if (tags.length >= maxTags) {
      Alert.alert('Maximum Tags', `You can only add up to ${maxTags} tags.`);
      return;
    }
    
    if (tags.includes(trimmedTag)) {
      Alert.alert('Duplicate Tag', 'This tag already exists.');
      return;
    }
    
    await formHaptic.success();
    onTagsChange([...tags, trimmedTag]);
    setNewTag('');
    setShowSuggestions(false);
  };

  const removeTag = async (tagToRemove: string) => {
    await formHaptic.light();
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmitEditing = () => {
    addTag(newTag);
  };

  const filteredSuggestions = suggestedTags.filter(
    suggestion => 
      !tags.includes(suggestion) && 
      suggestion.toLowerCase().includes(newTag.toLowerCase())
  );

  const renderTag = (tag: string, index: number) => (
    <TouchableOpacity
      key={`${tag}-${index}`}
      onPress={() => removeTag(tag)}
      style={styles.tag}
      testID={`tag-${tag}`}
    >
      <Badge
        variant="filled"
        color="primary"
        rightIcon={
          <Icon
            name="close-circle"
            size="xs"
            color="white"
          />
        }
      >
        {tag}
      </Badge>
    </TouchableOpacity>
  );

  const renderSuggestedTag = (suggestion: string) => (
    <TouchableOpacity
      key={suggestion}
      onPress={() => addTag(suggestion)}
      style={styles.suggestionTag}
      testID={`suggestion-${suggestion}`}
    >
      <Badge
        variant="outline"
        color="secondary"
        rightIcon={
          <Icon
            name="add-circle-outline"
            size="xs"
            color="secondary.500"
          />
        }
      >
        {suggestion}
      </Badge>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {label}
      </Text>

      {/* Current Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Flex direction="row" wrap gap="xs">
            {tags.map(renderTag)}
          </Flex>
        </View>
      )}

      {/* Add New Tag Input */}
      <Card variant="outlined" padding="sm" style={styles.inputCard}>
        <Flex direction="row" align="center" gap="sm">
          <Icon
            name="pricetag-outline"
            size="sm"
            color="text.tertiary"
          />
          <TextInput
            style={[
              styles.input,
              { 
                color: theme.colors.text.primary,
                flex: 1,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.text.tertiary}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={handleSubmitEditing}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            returnKeyType="done"
            maxLength={30}
            testID="tag-input"
          />
          {newTag.trim() && (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => addTag(newTag)}
              rightIcon={<Icon name="add" size="sm" />}
              testID="add-tag-button"
            >
              Add
            </Button>
          )}
        </Flex>
      </Card>

      {/* Suggested Tags */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Card variant="elevated" style={styles.suggestionsCard}>
          <Text style={[styles.suggestionsTitle, { color: theme.colors.text.secondary }]}>
            Suggested Tags
          </Text>
          <Flex direction="row" wrap gap="xs" style={styles.suggestions}>
            {filteredSuggestions.slice(0, 6).map(renderSuggestedTag)}
          </Flex>
        </Card>
      )}

      {/* Tag Count */}
      <Text style={[styles.tagCount, { color: theme.colors.text.tertiary }]}>
        {tags.length} of {maxTags} tags used
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  tagsContainer: {
    minHeight: 40,
  },
  tag: {
    // Badge component handles styling
  },
  inputCard: {
    borderWidth: 1,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  suggestionsCard: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
    padding: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  suggestions: {
    // Flex handles layout
  },
  suggestionTag: {
    // Badge component handles styling
  },
  tagCount: {
    fontSize: 12,
    textAlign: 'right',
  },
});

export default TagManager;
