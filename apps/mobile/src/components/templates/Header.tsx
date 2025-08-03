/**
 * Header Component
 * Reusable header for screens with title, actions, and navigation
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { HeaderProps } from '../../types/components';
import { Text, Button, Icon, Flex } from '../ui';

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightActions,
  showBackButton = false,
  onBackPress,
  backgroundColor,
  elevation = true,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();

  // Handle back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Get header styles
  const headerStyles = [
    styles.header,
    {
      backgroundColor: backgroundColor || theme.colors.background.primary,
      borderBottomColor: theme.colors.border.light,
      paddingTop: Platform.OS === 'ios' ? 0 : theme.spacing[2],
      ...(elevation ? theme.shadows.sm : {}),
    },
    style,
  ];

  return (
    <View
      style={headerStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="header"
    >
      <Flex
        direction="row"
        align="center"
        justify="space-between"
        style={styles.content}
      >
        {/* Left Section */}
        <Flex direction="row" align="center" style={styles.leftSection}>
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleBackPress}
              leftIcon={
                <Icon
                  name="chevron-back"
                  size="md"
                  color="text.primary"
                />
              }
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              Back
            </Button>
          )}
          
          {leftAction && (
            <View style={styles.leftAction}>
              {leftAction}
            </View>
          )}
        </Flex>

        {/* Center Section */}
        <Flex direction="column" align="center" style={styles.centerSection}>
          {title && (
            <Text
              variant="h6"
              weight="semiBold"
              color="text.primary"
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </Text>
          )}
          
          {subtitle && (
            <Text
              variant="caption"
              color="text.secondary"
              numberOfLines={1}
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}
        </Flex>

        {/* Right Section */}
        <Flex direction="row" align="center" style={styles.rightSection}>
          {rightActions && (
            <View style={styles.rightActions}>
              {rightActions}
            </View>
          )}
        </Flex>
      </Flex>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    zIndex: 1000,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backButton: {
    marginRight: 8,
  },
  leftAction: {
    marginLeft: 8,
  },
  rightActions: {
    marginLeft: 8,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 2,
  },
});

export default Header;
