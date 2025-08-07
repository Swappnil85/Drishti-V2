/**
 * TemplateSelectionStep Component
 * Epic 9, Story 1: Template selection step in scenario creation wizard
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Text, Card } from '../../../components/ui';
import { useHaptic } from '../../../hooks/useHaptic';
import { ScenarioTemplate } from '@drishti/shared/types/financial';

interface TemplateSelectionStepProps {
  templates: ScenarioTemplate[];
  selectedTemplate?: ScenarioTemplate;
  onTemplateSelect: (template: ScenarioTemplate) => void;
}

const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
}) => {
  const { buttonTap } = useHaptic();

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template: ScenarioTemplate) => {
    buttonTap();
    onTemplateSelect(template);
  };

  /**
   * Render template card
   */
  const renderTemplateCard = ({ item: template }: { item: ScenarioTemplate }) => {
    const isSelected = selectedTemplate?.id === template.id;

    return (
      <TouchableOpacity
        style={[styles.templateCard, isSelected && styles.templateCardSelected]}
        onPress={() => handleTemplateSelect(template)}
        activeOpacity={0.7}
      >
        <Card style={[styles.cardContent, isSelected && styles.cardContentSelected]}>
          <View style={styles.templateHeader}>
            <View style={styles.templateIcon}>
              <Text variant="h2" style={{ color: template.color }}>
                {template.emoji}
              </Text>
            </View>
            <View style={styles.templateInfo}>
              <Text variant="h6" style={styles.templateName}>
                {template.name}
              </Text>
              <Text variant="caption" color="text.secondary" style={styles.templateCategory}>
                {template.category.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text variant="caption" style={styles.selectedText}>
                  ✓
                </Text>
              </View>
            )}
          </View>

          <Text variant="body2" color="text.secondary" style={styles.templateDescription}>
            {template.description}
          </Text>

          <View style={styles.templateTags}>
            {template.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text variant="caption" style={styles.tagText}>
                  {tag}
                </Text>
              </View>
            ))}
            {template.tags.length > 3 && (
              <View style={styles.tag}>
                <Text variant="caption" style={styles.tagText}>
                  +{template.tags.length - 3}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.templateMetrics}>
            <View style={styles.metric}>
              <Text variant="caption" color="text.secondary">
                Popularity
              </Text>
              <Text variant="body2" style={styles.metricValue}>
                {template.popularity_score}%
              </Text>
            </View>
            <View style={styles.metric}>
              <Text variant="caption" color="text.secondary">
                Type
              </Text>
              <Text variant="body2" style={styles.metricValue}>
                {template.created_by === 'system' ? 'Built-in' : 'Community'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  /**
   * Group templates by category
   */
  const groupedTemplates = templates.reduce((groups, template) => {
    const category = template.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(template);
    return groups;
  }, {} as Record<string, ScenarioTemplate[]>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h5" style={styles.title}>
          Choose a Template
        </Text>
        <Text variant="body1" color="text.secondary" style={styles.subtitle}>
          Start with a pre-configured scenario template or create a custom one
        </Text>
      </View>

      <FlatList
        data={templates}
        renderItem={renderTemplateCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.templateList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Custom template option */}
      <TouchableOpacity
        style={[
          styles.templateCard,
          !selectedTemplate && styles.templateCardSelected,
        ]}
        onPress={() => onTemplateSelect({
          id: 'custom',
          name: 'Custom Scenario',
          description: 'Create a scenario from scratch with your own assumptions',
          type: 'custom',
          category: 'personal',
          assumptions: {
            inflation_rate: 0.03,
            market_return: 0.07,
            savings_rate: 0.20,
            retirement_age: 65,
            life_expectancy: 87,
          },
          tags: ['custom'],
          color: '#9C27B0',
          emoji: '🎯',
          popularity_score: 0,
          created_by: 'user',
        })}
        activeOpacity={0.7}
      >
        <Card style={[
          styles.cardContent,
          !selectedTemplate && styles.cardContentSelected,
        ]}>
          <View style={styles.templateHeader}>
            <View style={styles.templateIcon}>
              <Text variant="h2" style={{ color: '#9C27B0' }}>
                🎯
              </Text>
            </View>
            <View style={styles.templateInfo}>
              <Text variant="h6" style={styles.templateName}>
                Custom Scenario
              </Text>
              <Text variant="caption" color="text.secondary" style={styles.templateCategory}>
                CUSTOM
              </Text>
            </View>
            {!selectedTemplate && (
              <View style={styles.selectedIndicator}>
                <Text variant="caption" style={styles.selectedText}>
                  ✓
                </Text>
              </View>
            )}
          </View>

          <Text variant="body2" color="text.secondary" style={styles.templateDescription}>
            Create a scenario from scratch with your own assumptions and parameters
          </Text>

          <View style={styles.templateTags}>
            <View style={styles.tag}>
              <Text variant="caption" style={styles.tagText}>
                custom
              </Text>
            </View>
            <View style={styles.tag}>
              <Text variant="caption" style={styles.tagText}>
                flexible
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
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
  templateList: {
    paddingBottom: 16,
  },
  templateCard: {
    marginBottom: 12,
  },
  templateCardSelected: {
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
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    marginBottom: 2,
  },
  templateCategory: {
    fontSize: 10,
    fontWeight: '600',
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
  templateDescription: {
    marginBottom: 12,
    lineHeight: 18,
  },
  templateTags: {
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
  templateMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontWeight: '600',
    marginTop: 2,
  },
  separator: {
    height: 8,
  },
});

export default TemplateSelectionStep;
