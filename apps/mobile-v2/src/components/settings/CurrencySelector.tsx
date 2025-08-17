/**
 * Currency Selector Component for E5-S2
 * Modal component for selecting currency preference
 */

import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../theme/ThemeProvider';
import { usePreferences } from '../../contexts/PreferencesContext';
import { SUPPORTED_CURRENCIES } from '../../types/onboarding';
import { triggerHaptic } from '../../utils/haptics';

interface CurrencySelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function CurrencySelector({ visible, onClose }: CurrencySelectorProps) {
  const { tokens, reducedMotion } = useThemeContext();
  const { profile, updateCurrency } = usePreferences();
  const insets = useSafeAreaInsets();
  const [selectedCurrency, setSelectedCurrency] = useState(profile.currency);

  const handleCurrencySelect = async (currencyCode: string) => {
    setSelectedCurrency(currencyCode);

    if (!reducedMotion) {
      triggerHaptic('light');
    }

    await updateCurrency(currencyCode);
    onClose();
  };

  const handleClose = () => {
    if (!reducedMotion) {
      triggerHaptic('light');
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={handleClose}
    >
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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: tokens.border,
          }}
        >
          <Text
            accessibilityRole='header'
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: tokens.text,
            }}
          >
            Select Currency
          </Text>

          <Pressable
            onPress={handleClose}
            accessibilityRole='button'
            accessibilityLabel='Close currency selector'
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: tokens.primary,
                fontWeight: '500',
              }}
            >
              Done
            </Text>
          </Pressable>
        </View>

        {/* Currency List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {SUPPORTED_CURRENCIES.map((currency, index) => {
            const isSelected = selectedCurrency === currency.code;
            const isLast = index === SUPPORTED_CURRENCIES.length - 1;

            return (
              <Pressable
                key={currency.code}
                onPress={() => handleCurrencySelect(currency.code)}
                accessibilityRole='radio'
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${currency.name}, ${currency.symbol}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: pressed
                    ? `${tokens.primary}08`
                    : isSelected
                      ? `${tokens.primary}10`
                      : tokens.surface,
                  marginBottom: isLast ? 0 : 8,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? tokens.primary : tokens.border,
                })}
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
      </View>
    </Modal>
  );
}
