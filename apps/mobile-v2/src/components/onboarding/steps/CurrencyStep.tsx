/**
 * Currency Step for E5-S1 Onboarding
 * Allows user to select their preferred currency
 */

import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { OnboardingStepTemplate } from '../OnboardingStepTemplate';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useThemeContext } from '../../../theme/ThemeProvider';
import { SUPPORTED_CURRENCIES } from '../../../types/onboarding';
import { logEvent } from '../../../telemetry';

export function CurrencyStep() {
  const { nextStep, currentStepData, profile, updateProfile } = useOnboarding();
  const { tokens } = useThemeContext();
  const [selectedCurrency, setSelectedCurrency] = useState(
    profile.currency || 'AUD'
  );

  if (!currentStepData) {
    return null;
  }

  const handleCurrencySelect = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    updateProfile({ currency: currencyCode });
    logEvent('pref_currency_set', { currency: currencyCode });
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <OnboardingStepTemplate
      title={currentStepData.title}
      subtitle={currentStepData.subtitle}
      description={currentStepData.description}
      primaryButtonText='Continue'
      onPrimaryPress={handleContinue}
    >
      <View style={{ marginVertical: 16 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: tokens.text,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Select your preferred currency:
        </Text>

        <ScrollView
          style={{ maxHeight: 300 }}
          showsVerticalScrollIndicator={false}
        >
          {SUPPORTED_CURRENCIES.map(currency => {
            const isSelected = selectedCurrency === currency.code;

            return (
              <Pressable
                key={currency.code}
                onPress={() => handleCurrencySelect(currency.code)}
                accessibilityRole='radio'
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${currency.name}, ${currency.symbol}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  marginVertical: 4,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? tokens.primary : tokens.border,
                  backgroundColor: isSelected
                    ? `${tokens.primary}10`
                    : tokens.surface,
                  minHeight: 64,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isSelected
                      ? tokens.primary
                      : tokens.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: isSelected ? '#FFFFFF' : tokens.textMuted,
                    }}
                  >
                    {currency.symbol}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: tokens.text,
                      marginBottom: 2,
                    }}
                  >
                    {currency.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: tokens.textMuted,
                    }}
                  >
                    {currency.code}
                  </Text>
                </View>

                {isSelected && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: tokens.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel='Selected'
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={{
            backgroundColor: tokens.surface,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: tokens.textMuted,
              textAlign: 'center',
              lineHeight: 16,
            }}
          >
            You can change this later in Settings
          </Text>
        </View>
      </View>
    </OnboardingStepTemplate>
  );
}
