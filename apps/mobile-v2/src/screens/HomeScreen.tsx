// React import not required with react-jsx runtime
import { View, Text, Pressable } from 'react-native';
import { SkeletonText } from '../ui/Skeleton';
import { useToast } from '../ui/overlays/ToastProvider';
import { useSheet } from '../ui/overlays/SheetProvider';

export default function HomeScreen() {
  const { showToast } = useToast();
  const { openSheet } = useSheet();
  return (
    <View
      accessibilityRole='summary'
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <Text accessibilityRole='header' style={{ marginBottom: 12 }}>
        Home Screen
      </Text>
      <SkeletonText lines={3} />
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Show toast'
        onPress={() => showToast('Hello from toast!')}
        style={({ pressed }) => ({
          padding: 12,
          backgroundColor: '#0D6EFD',
          borderRadius: 8,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: 'white' }}>Show toast</Text>
      </Pressable>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Open sheet'
        onPress={() =>
          openSheet(close => (
            <View>
              <Text accessibilityRole='header' style={{ marginBottom: 8 }}>
                Example Sheet
              </Text>
              <Text style={{ marginBottom: 12 }}>
                Drag down, tap outside, or press escape to close.
              </Text>
              <Pressable
                accessibilityRole='button'
                onPress={close}
                style={{
                  padding: 10,
                  backgroundColor: '#0D6EFD',
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: 'white' }}>Close</Text>
              </Pressable>
            </View>
          ))
        }
        style={({ pressed }) => ({
          padding: 12,
          backgroundColor: '#198754',
          borderRadius: 8,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: 'white' }}>Open sheet</Text>
      </Pressable>
    </View>
  );
}
