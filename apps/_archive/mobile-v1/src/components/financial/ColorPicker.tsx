/**
 * Color Picker Component
 * Visual color picker for account categorization
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Icon, Flex } from '../ui';
import { useFormHaptic } from '../../hooks/useHaptic';

interface ColorOption {
  value: string;
  name: string;
  hex: string;
}

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  label?: string;
  testID?: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { value: 'blue', name: 'Blue', hex: '#2196F3' },
  { value: 'green', name: 'Green', hex: '#4CAF50' },
  { value: 'orange', name: 'Orange', hex: '#FF9800' },
  { value: 'purple', name: 'Purple', hex: '#9C27B0' },
  { value: 'red', name: 'Red', hex: '#F44336' },
  { value: 'teal', name: 'Teal', hex: '#009688' },
  { value: 'indigo', name: 'Indigo', hex: '#3F51B5' },
  { value: 'pink', name: 'Pink', hex: '#E91E63' },
  { value: 'amber', name: 'Amber', hex: '#FFC107' },
  { value: 'cyan', name: 'Cyan', hex: '#00BCD4' },
  { value: 'lime', name: 'Lime', hex: '#CDDC39' },
  { value: 'brown', name: 'Brown', hex: '#795548' },
  { value: 'gray', name: 'Gray', hex: '#607D8B' },
  { value: 'deep-orange', name: 'Deep Orange', hex: '#FF5722' },
  { value: 'light-green', name: 'Light Green', hex: '#8BC34A' },
  { value: 'deep-purple', name: 'Deep Purple', hex: '#673AB7' },
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  label = 'Account Color',
  testID,
}) => {
  const theme = useTheme();
  const formHaptic = useFormHaptic();

  const handleColorSelect = async (color: string) => {
    await formHaptic.selection();
    onColorSelect(color);
  };

  const renderColorOption = (option: ColorOption) => {
    const isSelected = selectedColor === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => handleColorSelect(option.value)}
        style={[
          styles.colorOption,
          {
            backgroundColor: option.hex,
            borderColor: isSelected 
              ? theme.colors.text.primary 
              : 'transparent',
            borderWidth: isSelected ? 3 : 0,
          },
        ]}
        testID={`color-${option.value}`}
        accessibilityLabel={`Select ${option.name} color`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        {isSelected && (
          <Icon
            name="checkmark"
            size="sm"
            color="white"
            style={styles.checkmark}
          />
        )}
      </TouchableOpacity>
    );
  };

  const selectedOption = COLOR_OPTIONS.find(option => option.value === selectedColor);

  return (
    <View style={styles.container} testID={testID}>
      <Flex direction="row" align="center" justify="space-between" style={styles.header}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {label}
        </Text>
        {selectedOption && (
          <Flex direction="row" align="center" gap="xs">
            <View
              style={[
                styles.selectedColorPreview,
                { backgroundColor: selectedOption.hex },
              ]}
            />
            <Text style={[styles.selectedColorName, { color: theme.colors.text.secondary }]}>
              {selectedOption.name}
            </Text>
          </Flex>
        )}
      </Flex>

      <View style={styles.colorsGrid}>
        {COLOR_OPTIONS.map(renderColorOption)}
      </View>

      {selectedColor && (
        <TouchableOpacity
          onPress={() => handleColorSelect('')}
          style={styles.clearButton}
          testID="clear-color-button"
        >
          <Flex direction="row" align="center" gap="xs">
            <Icon
              name="close-circle-outline"
              size="sm"
              color="text.tertiary"
            />
            <Text style={[styles.clearText, { color: theme.colors.text.tertiary }]}>
              Remove Color
            </Text>
          </Flex>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedColorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedColorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  checkmark: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ColorPicker;
