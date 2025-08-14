// React import not required with react-jsx runtime
import { View, Text } from 'react-native';
import { EmptyState } from '../ui/States';

export default function ScenariosScreen() {
  return (
    <View
      accessibilityRole='summary'
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text accessibilityRole='header' style={{ marginBottom: 12 }}>
        Scenarios
      </Text>
      <EmptyState
        title='No scenarios'
        description='Create what-if scenarios'
        actionLabel='New scenario'
        onAction={() => {}}
      />
    </View>
  );
}
