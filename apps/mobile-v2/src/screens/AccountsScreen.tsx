import { View, Text } from 'react-native';

const AccountsScreen = () => {
  return (
    <View
      accessibilityRole='summary'
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text accessibilityRole='header'>Accounts</Text>
    </View>
  );
};
export default AccountsScreen;
