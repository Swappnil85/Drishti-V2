// React import not required with react-jsx runtime
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../ui/States';

export default function PlanScreen() {
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
        Plan
      </Text>
      <EmptyState
        title='No plan yet'
        description='Create a plan to see projections'
        actionLabel='Create plan'
        onAction={() => {}}
      />
    </View>
  );
}
