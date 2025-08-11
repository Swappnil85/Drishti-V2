/**
 * Icon Component
 * Reusable icon component with multiple icon libraries
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Import other icon libraries as needed
// import { MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';

import { useTheme, getColorValue } from '../../contexts/ThemeContext';
import { IconProps } from '../../types/components';

const Icon: React.FC<IconProps> = ({
  name,
  size = 'base',
  color = 'text.primary',
  library = 'Ionicons',
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'image',
}) => {
  const theme = useTheme();

  // Get size value
  const getSizeValue = (sizeInput: number | string): number => {
    if (typeof sizeInput === 'number') {
      return sizeInput;
    }

    const sizeMap = {
      xs: 12,
      sm: 16,
      base: 20,
      md: 24,
      lg: 28,
      xl: 32,
      '2xl': 36,
      '3xl': 40,
    };

    return sizeMap[sizeInput as keyof typeof sizeMap] || 20;
  };

  const iconSize = getSizeValue(size);

  // Get color value
  const iconColor = color.startsWith('#') 
    ? color 
    : getColorValue(theme.colors, color);

  // Render icon based on library
  const renderIcon = () => {
    switch (library) {
      case 'Ionicons':
        return (
          <Ionicons
            name={name as any}
            size={iconSize}
            color={iconColor}
          />
        );
      // Add other icon libraries as needed
      // case 'MaterialIcons':
      //   return (
      //     <MaterialIcons
      //       name={name as any}
      //       size={iconSize}
      //       color={iconColor}
      //     />
      //   );
      // case 'FontAwesome':
      //   return (
      //     <FontAwesome
      //       name={name as any}
      //       size={iconSize}
      //       color={iconColor}
      //     />
      //   );
      // case 'Feather':
      //   return (
      //     <Feather
      //       name={name as any}
      //       size={iconSize}
      //       color={iconColor}
      //     />
      //   );
      default:
        return (
          <Ionicons
            name={name as any}
            size={iconSize}
            color={iconColor}
          />
        );
    }
  };

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `${name} icon`}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Icon;
