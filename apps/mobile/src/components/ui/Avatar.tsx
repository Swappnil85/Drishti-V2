/**
 * Avatar Component
 * User avatar with image, initials, or icon fallback
 */

import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AvatarProps } from '../../types/components';
import Text from './Text';
import Icon from './Icon';

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'base',
  variant = 'circle',
  fallbackIcon = 'person',
  onPress,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'image',
}) => {
  const theme = useTheme();

  // Get size value
  const sizeValues = {
    xs: 24,
    sm: 32,
    base: 40,
    md: 48,
    lg: 56,
    xl: 64,
    '2xl': 72,
    '3xl': 80,
  };

  const avatarSize = sizeValues[size];
  const fontSize = avatarSize * 0.4;
  const iconSize = avatarSize * 0.5;

  // Get border radius based on variant
  const getBorderRadius = () => {
    switch (variant) {
      case 'circle':
        return avatarSize / 2;
      case 'square':
        return 0;
      case 'rounded':
        return theme.borderRadius.md;
      default:
        return avatarSize / 2;
    }
  };

  // Get initials from name
  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const avatarStyles = [
    styles.avatar,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: getBorderRadius(),
      backgroundColor: theme.colors.primary[100],
    },
    style,
  ];

  const renderContent = () => {
    // If source is provided, show image
    if (source) {
      return (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: getBorderRadius(),
            },
          ]}
          resizeMode="cover"
        />
      );
    }

    // If name is provided, show initials
    if (name) {
      return (
        <Text
          variant="body1"
          weight="semiBold"
          color="primary.600"
          style={{ fontSize }}
        >
          {getInitials(name)}
        </Text>
      );
    }

    // Fallback to icon
    return (
      <Icon
        name={fallbackIcon}
        size={iconSize}
        color="primary.600"
      />
    );
  };

  // If onPress is provided, use TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        style={avatarStyles}
        onPress={onPress}
        activeOpacity={0.8}
        testID={testID}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel || `Avatar for ${name || 'user'}`}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Otherwise, use regular View
  return (
    <View
      style={avatarStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `Avatar for ${name || 'user'}`}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    // Image styles are applied inline
  },
});

export default Avatar;
