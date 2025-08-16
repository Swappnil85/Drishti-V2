// React import not required with react-jsx runtime
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '@drishti/shared';
import { EmptyState } from '../ui/States';

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole='summary'
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <Text accessibilityRole='header' style={{ marginBottom: 12 }}>
        Accounts
      </Text>

      {/* Demo currency formatting - E4-S7 */}
      <View style={{ marginBottom: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
          Currency Formatting Demo (E4-S7):
        </Text>
        <Text style={{ fontSize: 14 }}>
          AUD: {formatCurrency(1234.56)} | USD: {formatCurrency(1234.56, 'USD')}{' '}
          | EUR: {formatCurrency(1234.56, 'EUR')}
        </Text>
      </View>

      <EmptyState
        title='No accounts'
        description='Add your first account to get started'
        actionLabel='Add account'
        onAction={() => {}}
      />
    </View>
  );
}
