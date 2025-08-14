// React import not required with react-jsx runtime
import { View, Text } from 'react-native';
import { EmptyState } from '../ui/States';

export default function AccountsScreen() {
  return (
    <View
      accessibilityRole='summary'
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text accessibilityRole='header' style={{ marginBottom: 12 }}>
        Accounts
      </Text>
      <EmptyState
        title='No accounts'
        description='Add your first account to get started'
        actionLabel='Add account'
        onAction={() => {}}
      />
    </View>
  );
}
