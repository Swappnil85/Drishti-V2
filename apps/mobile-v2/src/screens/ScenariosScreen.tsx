// React import not required with react-jsx runtime
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../ui/States';

export default function ScenariosScreen() {
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
