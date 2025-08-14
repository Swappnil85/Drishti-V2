// React import not required with react-jsx runtime
import { View, Text } from 'react-native';
import { EmptyState } from '../ui/States';

export default function PlanScreen() {
  return (
    <View
      accessibilityRole='summary'
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
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
