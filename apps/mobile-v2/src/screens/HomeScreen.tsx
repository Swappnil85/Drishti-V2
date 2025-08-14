// React import not required with react-jsx runtime
import { View, Text } from 'react-native';
import { SkeletonText } from '../ui/Skeleton';

export default function HomeScreen() {
  return (
    <View
      accessibilityRole='summary'
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text accessibilityRole='header' style={{ marginBottom: 12 }}>
        Home Screen
      </Text>
      <SkeletonText lines={3} />
    </View>
  );
}
