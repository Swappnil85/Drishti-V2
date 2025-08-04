/**
 * Template Selector Component
 * Displays and allows selection of account templates
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Icon, Button, Flex, Badge, Input } from '../ui';
import { 
  accountTemplateService, 
  type AccountTemplate 
} from '../../services/financial/AccountTemplateService';
import { useFormHaptic } from '../../hooks/useHaptic';

interface TemplateSelectorProps {
  selectedTemplate?: AccountTemplate;
  onTemplateSelect: (template: AccountTemplate) => void;
  userProfile?: {
    age?: number;
    hasChildren?: boolean;
    isBusinessOwner?: boolean;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
  testID?: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  fire: { label: 'FIRE Strategy', icon: 'flame-outline', color: '#FF9800' },
  beginner: { label: 'Beginner', icon: 'school-outline', color: '#4CAF50' },
  advanced: { label: 'Advanced', icon: 'trending-up-outline', color: '#9C27B0' },
  business: { label: 'Business', icon: 'business-outline', color: '#FF5722' },
  family: { label: 'Family', icon: 'people-outline', color: '#E91E63' },
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  userProfile,
  testID,
}) => {
  const theme = useTheme();
  const formHaptic = useFormHaptic();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [templates, setTemplates] = useState<AccountTemplate[]>([]);
  const [recommendedTemplates, setRecommendedTemplates] = useState<AccountTemplate[]>([]);

  useEffect(() => {
    loadTemplates();
  }, [userProfile]);

  useEffect(() => {
    filterTemplates();
  }, [searchTerm, selectedCategory]);

  const loadTemplates = () => {
    const allTemplates = accountTemplateService.getAllTemplates();
    const recommended = accountTemplateService.getRecommendedTemplates(userProfile);
    
    setTemplates(allTemplates);
    setRecommendedTemplates(recommended);
  };

  const filterTemplates = () => {
    let filtered = accountTemplateService.getAllTemplates();

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'recommended') {
        filtered = recommendedTemplates;
      } else {
        filtered = accountTemplateService.getTemplatesByCategory(selectedCategory as any);
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = accountTemplateService.searchTemplates(searchTerm);
    }

    setTemplates(filtered);
  };

  const handleTemplateSelect = async (template: AccountTemplate) => {
    await formHaptic.selection();
    onTemplateSelect(template);
  };

  const handleCategorySelect = async (category: string) => {
    await formHaptic.light();
    setSelectedCategory(category);
  };

  const renderCategoryFilter = () => {
    const categories = [
      { key: 'all', label: 'All Templates', icon: 'apps-outline' },
      { key: 'recommended', label: 'Recommended', icon: 'star-outline' },
      ...Object.entries(CATEGORY_LABELS).map(([key, value]) => ({
        key,
        label: value.label,
        icon: value.icon,
      })),
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            onPress={() => handleCategorySelect(category.key)}
            testID={`category-${category.key}`}
          >
            <Badge
              variant={selectedCategory === category.key ? 'filled' : 'outline'}
              color="primary"
              leftIcon={
                <Icon
                  name={category.icon as any}
                  size="xs"
                  color={selectedCategory === category.key ? 'white' : 'primary.500'}
                />
              }
            >
              {category.label}
            </Badge>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderTemplateCard = ({ item }: { item: AccountTemplate }) => {
    const isSelected = selectedTemplate?.id === item.id;
    const categoryInfo = CATEGORY_LABELS[item.category];
    
    return (
      <TouchableOpacity
        onPress={() => handleTemplateSelect(item)}
        testID={`template-${item.id}`}
      >
        <Card
          variant={isSelected ? 'filled' : 'outlined'}
          padding="base"
          style={[
            styles.templateCard,
            {
              borderColor: isSelected ? item.color : theme.colors.border.primary,
              backgroundColor: isSelected 
                ? `${item.color}15` 
                : theme.colors.background.primary,
            },
          ]}
        >
          <Flex direction="row" align="flex-start" gap="base">
            {/* Icon */}
            <View
              style={[
                styles.templateIcon,
                { backgroundColor: item.color },
              ]}
            >
              <Icon
                name={item.icon as any}
                size="md"
                color="white"
              />
            </View>

            {/* Content */}
            <Flex direction="column" flex={1} gap="xs">
              <Flex direction="row" align="center" justify="space-between">
                <Text
                  style={[
                    styles.templateName,
                    {
                      color: isSelected 
                        ? item.color 
                        : theme.colors.text.primary,
                      fontWeight: isSelected ? '600' : '500',
                    },
                  ]}
                >
                  {item.name}
                </Text>
                {isSelected && (
                  <Icon
                    name="checkmark-circle"
                    size="sm"
                    color={item.color}
                  />
                )}
              </Flex>

              <Text
                style={[
                  styles.templateDescription,
                  { color: theme.colors.text.secondary },
                ]}
              >
                {item.description}
              </Text>

              <Flex direction="row" align="center" justify="space-between" style={styles.templateMeta}>
                <Flex direction="row" align="center" gap="sm">
                  <Badge
                    variant="outline"
                    color="secondary"
                    size="sm"
                    leftIcon={
                      <Icon
                        name={categoryInfo.icon as any}
                        size="xs"
                        color="secondary.500"
                      />
                    }
                  >
                    {categoryInfo.label}
                  </Badge>
                  
                  <Flex direction="row" align="center" gap="xs">
                    <Icon
                      name="time-outline"
                      size="xs"
                      color="text.tertiary"
                    />
                    <Text style={[styles.setupTime, { color: theme.colors.text.tertiary }]}>
                      {item.estimatedSetupTime}min
                    </Text>
                  </Flex>
                </Flex>

                <Text style={[styles.accountCount, { color: theme.colors.text.tertiary }]}>
                  {item.accounts.length} accounts
                </Text>
              </Flex>

              {/* Tags */}
              {item.tags.length > 0 && (
                <Flex direction="row" wrap gap="xs" style={styles.tags}>
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge
                      key={index}
                      variant="filled"
                      color="gray"
                      size="xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Text style={[styles.moreTags, { color: theme.colors.text.tertiary }]}>
                      +{item.tags.length - 3} more
                    </Text>
                  )}
                </Flex>
              )}
            </Flex>
          </Flex>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <Card variant="outlined" padding="lg" style={styles.emptyState}>
      <Flex direction="column" align="center" gap="sm">
        <Icon
          name="document-outline"
          size="lg"
          color="text.tertiary"
        />
        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
          No templates found
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
          Try adjusting your search or category filter
        </Text>
      </Flex>
    </Card>
  );

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Choose a Template
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
        Get started quickly with pre-configured account setups
      </Text>

      <Input
        placeholder="Search templates..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        leftIcon={<Icon name="search-outline" size="sm" color="text.tertiary" />}
        style={styles.searchInput}
        testID="template-search"
      />

      {renderCategoryFilter()}

      <FlatList
        data={templates}
        renderItem={renderTemplateCard}
        keyExtractor={(item) => item.id}
        style={styles.templatesList}
        contentContainerStyle={styles.templatesContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  searchInput: {
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  templatesList: {
    flex: 1,
  },
  templatesContent: {
    paddingBottom: 20,
  },
  templateCard: {
    borderWidth: 2,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '500',
  },
  templateDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  templateMeta: {
    marginTop: 4,
  },
  setupTime: {
    fontSize: 12,
  },
  accountCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  tags: {
    marginTop: 8,
  },
  moreTags: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TemplateSelector;
