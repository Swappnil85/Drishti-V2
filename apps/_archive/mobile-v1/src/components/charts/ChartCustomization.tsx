/**
 * ChartCustomization Component
 * Epic 10, Story 1: Goal Progress Visual Charts - Chart customization options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Slider } from '@react-native-community/slider';
import { Card, Icon, Button, Flex } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptic } from '../../hooks/useHaptic';

interface ChartCustomizationProps {
  onCustomizationChange: (customization: ChartCustomizationOptions) => void;
  initialCustomization?: ChartCustomizationOptions;
}

export interface ChartCustomizationOptions {
  colorScheme: ColorScheme;
  showGrid: boolean;
  showTooltips: boolean;
  showAnimations: boolean;
  animationDuration: number;
  chartTheme: 'light' | 'dark' | 'auto';
  showDataLabels: boolean;
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  gridOpacity: number;
  borderRadius: number;
  shadowEnabled: boolean;
  gradientEnabled: boolean;
  hapticFeedback: boolean;
  accessibilityMode: boolean;
}

interface ColorScheme {
  name: string;
  colors: string[];
  primary: string;
  secondary: string;
}

const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Default',
    colors: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'],
    primary: '#007AFF',
    secondary: '#34C759',
  },
  {
    name: 'Ocean',
    colors: ['#0077BE', '#00A8CC', '#7FB3D3', '#C5DBEA', '#E8F4F8'],
    primary: '#0077BE',
    secondary: '#00A8CC',
  },
  {
    name: 'Sunset',
    colors: ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#118AB2'],
    primary: '#FF6B35',
    secondary: '#F7931E',
  },
  {
    name: 'Forest',
    colors: ['#2D5016', '#61A5C2', '#A9D6E5', '#E9C46A', '#F4A261'],
    primary: '#2D5016',
    secondary: '#61A5C2',
  },
  {
    name: 'Monochrome',
    colors: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF'],
    primary: '#000000',
    secondary: '#404040',
  },
];

export const ChartCustomization: React.FC<ChartCustomizationProps> = ({
  onCustomizationChange,
  initialCustomization,
}) => {
  const { theme } = useTheme();
  const { buttonTap } = useHaptic();

  const [customization, setCustomization] = useState<ChartCustomizationOptions>(
    initialCustomization || {
      colorScheme: COLOR_SCHEMES[0],
      showGrid: true,
      showTooltips: true,
      showAnimations: true,
      animationDuration: 1000,
      chartTheme: 'auto',
      showDataLabels: true,
      showLegend: true,
      legendPosition: 'bottom',
      gridOpacity: 0.3,
      borderRadius: 8,
      shadowEnabled: true,
      gradientEnabled: false,
      hapticFeedback: true,
      accessibilityMode: false,
    }
  );

  const updateCustomization = async (
    updates: Partial<ChartCustomizationOptions>
  ) => {
    await buttonTap();
    const newCustomization = { ...customization, ...updates };
    setCustomization(newCustomization);
    onCustomizationChange(newCustomization);
  };

  const renderColorSchemeSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Color Scheme
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {COLOR_SCHEMES.map((scheme, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorSchemeCard,
              customization.colorScheme.name === scheme.name &&
                styles.selectedColorScheme,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => updateCustomization({ colorScheme: scheme })}
          >
            <Text
              style={[styles.colorSchemeName, { color: theme.colors.text }]}
            >
              {scheme.name}
            </Text>
            <View style={styles.colorPreview}>
              {scheme.colors.slice(0, 3).map((color, colorIndex) => (
                <View
                  key={colorIndex}
                  style={[styles.colorDot, { backgroundColor: color }]}
                />
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderToggleOptions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Display Options
      </Text>

      {[
        { key: 'showGrid', label: 'Show Grid' },
        { key: 'showTooltips', label: 'Show Tooltips' },
        { key: 'showAnimations', label: 'Animations' },
        { key: 'showDataLabels', label: 'Data Labels' },
        { key: 'showLegend', label: 'Legend' },
        { key: 'shadowEnabled', label: 'Shadows' },
        { key: 'gradientEnabled', label: 'Gradients' },
        { key: 'hapticFeedback', label: 'Haptic Feedback' },
        { key: 'accessibilityMode', label: 'Accessibility Mode' },
      ].map(option => (
        <View key={option.key} style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
            {option.label}
          </Text>
          <Switch
            value={
              customization[
                option.key as keyof ChartCustomizationOptions
              ] as boolean
            }
            onValueChange={value =>
              updateCustomization({ [option.key]: value })
            }
            trackColor={{
              false: theme.colors.surface,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.onPrimary}
          />
        </View>
      ))}
    </View>
  );

  const renderSliderOptions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Appearance
      </Text>

      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color: theme.colors.text }]}>
          Animation Duration: {customization.animationDuration}ms
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={500}
          maximumValue={3000}
          step={100}
          value={customization.animationDuration}
          onValueChange={value =>
            updateCustomization({ animationDuration: value })
          }
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surface}
          thumbTintColor={theme.colors.primary}
        />
      </View>

      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color: theme.colors.text }]}>
          Grid Opacity: {Math.round(customization.gridOpacity * 100)}%
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.1}
          value={customization.gridOpacity}
          onValueChange={value => updateCustomization({ gridOpacity: value })}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surface}
          thumbTintColor={theme.colors.primary}
        />
      </View>

      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color: theme.colors.text }]}>
          Border Radius: {customization.borderRadius}px
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={20}
          step={1}
          value={customization.borderRadius}
          onValueChange={value => updateCustomization({ borderRadius: value })}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.surface}
          thumbTintColor={theme.colors.primary}
        />
      </View>
    </View>
  );

  const renderThemeSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Chart Theme
      </Text>
      <View style={styles.themeSelector}>
        {['light', 'dark', 'auto'].map(themeOption => (
          <TouchableOpacity
            key={themeOption}
            style={[
              styles.themeButton,
              customization.chartTheme === themeOption &&
                styles.selectedThemeButton,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() =>
              updateCustomization({ chartTheme: themeOption as any })
            }
          >
            <Icon
              name={
                themeOption === 'light'
                  ? 'sun'
                  : themeOption === 'dark'
                    ? 'moon'
                    : 'smartphone'
              }
              size={16}
              color={
                customization.chartTheme === themeOption
                  ? theme.colors.onPrimary
                  : theme.colors.text
              }
            />
            <Text
              style={[
                styles.themeButtonText,
                customization.chartTheme === themeOption &&
                  styles.selectedThemeButtonText,
                {
                  color:
                    customization.chartTheme === themeOption
                      ? theme.colors.onPrimary
                      : theme.colors.text,
                },
              ]}
            >
              {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLegendPositionSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Legend Position
      </Text>
      <View style={styles.legendSelector}>
        {['top', 'bottom', 'left', 'right'].map(position => (
          <TouchableOpacity
            key={position}
            style={[
              styles.legendButton,
              customization.legendPosition === position &&
                styles.selectedLegendButton,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() =>
              updateCustomization({ legendPosition: position as any })
            }
          >
            <Text
              style={[
                styles.legendButtonText,
                customization.legendPosition === position &&
                  styles.selectedLegendButtonText,
                {
                  color:
                    customization.legendPosition === position
                      ? theme.colors.onPrimary
                      : theme.colors.text,
                },
              ]}
            >
              {position.charAt(0).toUpperCase() + position.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Chart Customization
          </Text>
        </View>

        {renderColorSchemeSelector()}
        {renderThemeSelector()}
        {renderToggleOptions()}
        {renderSliderOptions()}
        {renderLegendPositionSelector()}

        <View style={styles.actions}>
          <Button
            title='Reset to Default'
            variant='outline'
            onPress={() => {
              const defaultCustomization: ChartCustomizationOptions = {
                colorScheme: COLOR_SCHEMES[0],
                showGrid: true,
                showTooltips: true,
                showAnimations: true,
                animationDuration: 1000,
                chartTheme: 'auto',
                showDataLabels: true,
                showLegend: true,
                legendPosition: 'bottom',
                gridOpacity: 0.3,
                borderRadius: 8,
                shadowEnabled: true,
                gradientEnabled: false,
                hapticFeedback: true,
                accessibilityMode: false,
              };
              setCustomization(defaultCustomization);
              onCustomizationChange(defaultCustomization);
            }}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorSchemeCard: {
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorScheme: {
    borderColor: '#007AFF',
  },
  colorSchemeName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
  },
  sliderRow: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  selectedThemeButton: {
    backgroundColor: '#007AFF',
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedThemeButtonText: {
    color: '#FFFFFF',
  },
  legendSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  legendButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedLegendButton: {
    backgroundColor: '#007AFF',
  },
  legendButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedLegendButtonText: {
    color: '#FFFFFF',
  },
  actions: {
    marginTop: 24,
  },
});
