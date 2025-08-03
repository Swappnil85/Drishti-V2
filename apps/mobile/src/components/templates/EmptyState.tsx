/**
 * Empty State Component
 * Reusable empty state display with action button
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { EmptyStateProps } from '../../types/components';
import { Text, Button, Icon, Flex, Container } from '../ui';

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There are no items to display at the moment.',
  icon,
  action,
  actionText = 'Add Item',
  onAction,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  const containerStyles = [
    styles.container,
    style,
  ];

  // Default icon if none provided
  const defaultIcon = (
    <Icon
      name="document-outline"
      size="3xl"
      color="text.tertiary"
    />
  );

  return (
    <Container
      style={containerStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `Empty state: ${title}`}
      accessibilityHint={accessibilityHint}
    >
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="lg"
        style={styles.content}
      >
        {/* Empty State Icon */}
        <View style={styles.iconContainer}>
          {icon || defaultIcon}
        </View>

        {/* Empty State Title */}
        <Text
          variant="h5"
          weight="semiBold"
          color="text.primary"
          align="center"
          style={styles.title}
        >
          {title}
        </Text>

        {/* Empty State Message */}
        <Text
          variant="body2"
          color="text.secondary"
          align="center"
          style={styles.message}
        >
          {message}
        </Text>

        {/* Action Button or Custom Action */}
        {action ? (
          <View style={styles.actionContainer}>
            {action}
          </View>
        ) : onAction ? (
          <Button
            variant="primary"
            size="md"
            onPress={onAction}
            leftIcon={
              <Icon
                name="add"
                size="sm"
                color="text.inverse"
              />
            }
            testID={`${testID}-action`}
            accessibilityLabel={`${actionText} button`}
            style={styles.actionButton}
          >
            {actionText}
          </Button>
        ) : null}
      </Flex>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    maxWidth: 320,
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 8,
    opacity: 0.6,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    lineHeight: 22,
    marginBottom: 16,
  },
  actionContainer: {
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 120,
  },
});

export default EmptyState;
