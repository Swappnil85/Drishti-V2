/**
 * Error State Component
 * Reusable error display with retry functionality
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ErrorStateProps } from '../../types/components';
import { Text, Button, Icon, Flex, Container } from '../ui';

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  showIcon = true,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  // Get error message
  const getErrorMessage = () => {
    if (message) return message;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred. Please try again.';
  };

  const errorMessage = getErrorMessage();

  const containerStyles = [
    styles.container,
    style,
  ];

  return (
    <Container
      style={containerStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `Error: ${title}`}
      accessibilityHint={accessibilityHint}
    >
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="lg"
        style={styles.content}
      >
        {/* Error Icon */}
        {showIcon && (
          <View style={styles.iconContainer}>
            <Icon
              name="alert-circle"
              size="3xl"
              color="error.500"
              testID={`${testID}-icon`}
            />
          </View>
        )}

        {/* Error Title */}
        <Text
          variant="h5"
          weight="semiBold"
          color="text.primary"
          align="center"
          style={styles.title}
        >
          {title}
        </Text>

        {/* Error Message */}
        <Text
          variant="body2"
          color="text.secondary"
          align="center"
          style={styles.message}
        >
          {errorMessage}
        </Text>

        {/* Retry Button */}
        {onRetry && (
          <Button
            variant="primary"
            size="md"
            onPress={onRetry}
            leftIcon={
              <Icon
                name="refresh"
                size="sm"
                color="text.inverse"
              />
            }
            testID={`${testID}-retry`}
            accessibilityLabel={`${retryText} button`}
            style={styles.retryButton}
          >
            {retryText}
          </Button>
        )}
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
  },
  title: {
    marginBottom: 8,
  },
  message: {
    lineHeight: 22,
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
});

export default ErrorState;
