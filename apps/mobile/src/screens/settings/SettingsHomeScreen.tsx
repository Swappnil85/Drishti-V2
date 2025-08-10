/**
 * SettingsHomeScreen Component
 * Settings screen
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { SettingsStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { Switch } from '../../components/ui';
import { COLORS } from '../../constants/design';

type Props = SettingsStackScreenProps<'SettingsHome'>;

const SettingsHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark, toggleTheme, colors, togglePalette } = useTheme();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Settings
          </Text>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Dark Mode
            </Text>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Sun Palette
            </Text>
            <Switch
              value={colors.background.primary === COLORS.sun.background}
              onValueChange={togglePalette!}
            />
          </View>

          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            More settings coming soon…
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
});

export default SettingsHomeScreen;
