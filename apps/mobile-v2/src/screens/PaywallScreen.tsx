// React import not required with react-jsx runtime
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/ThemeProvider';
import { logEvent } from '../telemetry';
import {
  touchTargetStyle,
  headerA11yProps,
  buttonA11yProps,
  formatCurrencyA11y,
} from '../utils/accessibility';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useThemeContext();

  const handlePlanSelect = (plan: string) => {
    logEvent('paywall_cta_click', { plan });
    // TODO: Implement IAP flow in E11
  };

  return (
    <View
      accessibilityRole='none'
      style={{
        flex: 1,
        padding: 24,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingLeft: insets.left + 24,
        paddingRight: insets.right + 24,
        backgroundColor: tokens.bg,
      }}
    >
      <Text
        {...headerA11yProps}
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: tokens.text,
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        Upgrade to Pro
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: tokens.textMuted,
          marginBottom: 32,
          textAlign: 'center',
          lineHeight: 24,
        }}
      >
        Unlock unlimited accounts, scenarios, and premium insights
      </Text>

      <View style={{ gap: 16, marginBottom: 32 }}>
        <Pressable
          onPress={() => handlePlanSelect('monthly')}
          {...buttonA11yProps}
          accessibilityLabel={`Monthly plan ${formatCurrencyA11y(5.99)} per month`}
          style={{
            backgroundColor: tokens.primary,
            padding: 16,
            borderRadius: 8,
            ...touchTargetStyle,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            Monthly - A$5.99/month
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handlePlanSelect('annual')}
          {...buttonA11yProps}
          accessibilityLabel={`Annual plan ${formatCurrencyA11y(59.99)} per year, save 17 percent`}
          style={{
            backgroundColor: tokens.success,
            padding: 16,
            borderRadius: 8,
            ...touchTargetStyle,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            Annual - A$59.99/year
          </Text>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Save 17%
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 12, marginBottom: 24 }}>
        <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '600' }}>
          Pro Benefits:
        </Text>
        <Text style={{ color: tokens.textMuted, fontSize: 14 }}>
          • Unlimited accounts and scenarios
        </Text>
        <Text style={{ color: tokens.textMuted, fontSize: 14 }}>
          • Extended projections
        </Text>
        <Text style={{ color: tokens.textMuted, fontSize: 14 }}>
          • Premium insights (when available)
        </Text>
      </View>

      <Pressable
        onPress={() => {
          // TODO: Implement restore purchases in E11
          logEvent('paywall_restore_click');
        }}
        {...buttonA11yProps}
        accessibilityLabel='Restore previous purchases'
        accessibilityHint='Restores any previous Pro purchases you have made'
        style={{
          padding: 12,
          ...touchTargetStyle,
        }}
      >
        <Text
          style={{
            color: tokens.primary,
            fontSize: 16,
            textAlign: 'center',
          }}
        >
          Restore Purchases
        </Text>
      </Pressable>
    </View>
  );
}
