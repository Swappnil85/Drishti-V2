/**
 * Loading State Component
 * Reusable loading indicator with message and overlay options
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { useTheme, getColorValue } from '../../contexts/ThemeContext';
import { LoadingStateProps } from '../../types/components';
import { Text, Flex } from '../ui';

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'base',
  color = 'primary',
  overlay = false,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  // Get size values - use numeric values for better compatibility
  const sizeValues = {
    xs: 'small' as const,
    sm: 'small' as const,
    base: 'small' as const,
    md: 'small' as const,
    lg: 'small' as const,
    xl: 'small' as const,
    '2xl': 'small' as const,
    '3xl': 'small' as const,
  };

  const indicatorSize = sizeValues[size];

  // Get color value
  const indicatorColor = getColorValue(theme.colors, color, 500);

  // Create container styles
  const containerStyles = [
    styles.container,
    overlay && styles.overlay,
    {
      backgroundColor: overlay ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
    },
    style,
  ];

  const contentStyles = [
    styles.content,
    overlay && styles.overlayContent,
    overlay && {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
    },
  ];

  const renderContent = () => (
    <View
      style={containerStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `Loading: ${message}`}
      accessibilityHint={accessibilityHint}
      accessibilityRole='progressbar'
    >
      <Flex
        direction='column'
        align='center'
        justify='center'
        gap='base'
        style={contentStyles}
      >
        <ActivityIndicator
          size={indicatorSize}
          color={indicatorColor}
          testID={`${testID}-indicator`}
        />

        {message && (
          <Text
            variant='body2'
            color='text.secondary'
            align='center'
            style={styles.message}
          >
            {message}
          </Text>
        )}
      </Flex>
    </View>
  );

  // Render with modal overlay if needed
  if (overlay) {
    return (
      <Modal transparent visible animationType='fade' statusBarTranslucent>
        {renderContent()}
      </Modal>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  content: {
    padding: 24,
  },
  overlayContent: {
    margin: 32,
    padding: 32,
    minWidth: 200,
    maxWidth: 300,
  },
  message: {
    marginTop: 8,
  },
});

export default LoadingState;
