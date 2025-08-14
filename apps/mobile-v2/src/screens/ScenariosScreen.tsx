// React import not required with react-jsx runtime
import { View, Text } from 'react-native';

export default function ScenariosScreen() {
  return (
    <View
      accessibilityRole='summary'
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text accessibilityRole='header'>Scenarios</Text>
    </View>
  );
}
