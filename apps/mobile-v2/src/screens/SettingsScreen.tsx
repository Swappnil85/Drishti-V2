/**
 * Settings Screen for E5-S2
 * Enhanced settings with currency, theme, and privacy preferences
 */

import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/ThemeProvider';
import { usePreferences } from '../contexts/PreferencesContext';
import { SettingsSection } from '../components/settings/SettingsSection';
import { SettingsRow } from '../components/settings/SettingsRow';
import { CurrencySelector } from '../components/settings/CurrencySelector';
import { ToggleSwitch } from '../components/settings/ToggleSwitch';
import { SUPPORTED_CURRENCIES } from '../types/onboarding';
import { triggerHaptic } from '../utils/haptics';

export default function SettingsScreen() {
  const { mode, reducedMotion, setMode, tokens } = useThemeContext();
  const {
    profile,
    updatePrivacyMode,
    updateSampleDataSetting,
    resetPreferences,
    isLoading,
  } = usePreferences();
  const insets = useSafeAreaInsets();
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);

  // Get currency display info
  const selectedCurrency = SUPPORTED_CURRENCIES.find(
    c => c.code === profile.currency
  );
  const currencyDisplay = selectedCurrency
    ? `${selectedCurrency.name} (${selectedCurrency.symbol})`
    : profile.currency;

  const handleThemeChange = (newMode: 'system' | 'light' | 'dark') => {
    if (!reducedMotion) {
      triggerHaptic('light');
    }
    setMode(newMode);
  };

  const handleCurrencyPress = () => {
    if (!reducedMotion) {
      triggerHaptic('light');
    }
    setShowCurrencySelector(true);
  };

  const handlePrivacyToggle = async (localOnly: boolean) => {
    await updatePrivacyMode(localOnly);
  };

  const handleSampleDataToggle = async (hasSampleData: boolean) => {
    await updateSampleDataSetting(hasSampleData);
  };

  const handleResetPreferences = async () => {
    if (!reducedMotion) {
      triggerHaptic('light');
    }
    await resetPreferences();
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: tokens.textMuted,
          }}
        >
          Loading preferences...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
        }}
      >
        <Text
          accessibilityRole='header'
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: tokens.text,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Currency Section */}
        <SettingsSection
          title='Currency'
          description='Choose your preferred currency for displaying amounts'
        >
          <SettingsRow
            title='Currency'
            value={currencyDisplay}
            onPress={handleCurrencyPress}
            accessibilityLabel={`Currency: ${currencyDisplay}`}
            accessibilityHint='Tap to change currency'
            showBorder={false}
          />
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection
          title='Appearance'
          description="Customize the app's appearance and accessibility"
        >
          <SettingsRow
            title='Theme'
            subtitle='Choose your preferred color scheme'
            showBorder={true}
          >
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'system', label: 'Auto' },
                { key: 'light', label: 'Light' },
                { key: 'dark', label: 'Dark' },
              ].map(option => (
                <Pressable
                  key={option.key}
                  onPress={() => handleThemeChange(option.key as any)}
                  accessibilityRole='radio'
                  accessibilityState={{ checked: mode === option.key }}
                  accessibilityLabel={`${option.label} theme`}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      mode === option.key ? tokens.primary : tokens.border,
                    backgroundColor:
                      mode === option.key
                        ? `${tokens.primary}10`
                        : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: mode === option.key ? '600' : '400',
                      color: mode === option.key ? tokens.primary : tokens.text,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SettingsRow>

          <SettingsRow
            title='Reduced Motion'
            subtitle={`Motion effects are ${reducedMotion ? 'disabled' : 'enabled'} (system setting)`}
            showBorder={false}
            disabled={true}
          />
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection
          title='Privacy'
          description='Control how your data is stored and synced'
        >
          <SettingsRow
            title='Local Only Mode'
            subtitle='Store all data on this device only'
            showBorder={false}
            accessibilityLabel={`Local only mode: ${profile.privacyLocalOnly ? 'enabled' : 'disabled'}`}
            accessibilityHint='Toggle to change privacy mode'
          >
            <ToggleSwitch
              value={profile.privacyLocalOnly}
              onValueChange={handlePrivacyToggle}
              accessibilityLabel='Local only mode toggle'
            />
          </SettingsRow>
        </SettingsSection>

        {/* Data Section */}
        <SettingsSection
          title='Data'
          description='Manage your app data and sample content'
        >
          <SettingsRow
            title='Sample Data'
            subtitle='Use demo data to explore app features'
            showBorder={true}
            accessibilityLabel={`Sample data: ${profile.hasSampleData ? 'enabled' : 'disabled'}`}
            accessibilityHint='Toggle to enable or disable sample data'
          >
            <ToggleSwitch
              value={profile.hasSampleData}
              onValueChange={handleSampleDataToggle}
              accessibilityLabel='Sample data toggle'
            />
          </SettingsRow>

          <SettingsRow
            title='Reset All Preferences'
            subtitle='Restore all settings to their default values'
            onPress={handleResetPreferences}
            accessibilityLabel='Reset all preferences'
            accessibilityHint='Tap to reset all preferences to default'
            showBorder={false}
          >
            <Text
              style={{
                fontSize: 16,
                color: tokens.critical,
                fontWeight: '500',
              }}
            >
              Reset
            </Text>
          </SettingsRow>
        </SettingsSection>
      </ScrollView>

      {/* Currency Selector Modal */}
      <CurrencySelector
        visible={showCurrencySelector}
        onClose={() => setShowCurrencySelector(false)}
      />
    </View>
  );
}
