import { View, Text, Pressable } from 'react-native';
import { useThemeContext } from '../theme/ThemeProvider';

const Btn = ({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) => (
  <Pressable
    accessibilityRole='button'
    accessibilityLabel={label}
    onPress={onPress}
    style={{
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginVertical: 6,
      minWidth: 200,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: active ? '#0D6EFD' : '#DFE3E8',
      alignItems: 'center',
    }}
  >
    <Text style={{ fontSize: 16 }}>{label}</Text>
  </Pressable>
);

const SettingsScreen = () => {
  const { mode, reducedMotion, setMode } = useThemeContext();

  return (
    <View
      accessibilityRole='summary'
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Text
        accessibilityRole='header'
        style={{ fontSize: 20, marginBottom: 12 }}
      >
        Settings
      </Text>
      <Text accessibilityLabel='theme-mode-label'>Theme mode: {mode}</Text>
      <Text accessibilityLabel='reduced-motion-label'>
        Reduced motion: {reducedMotion ? 'on' : 'off'}
      </Text>

      <View style={{ height: 12 }} />
      <Btn
        label='Use System'
        onPress={() => setMode('system')}
        active={mode === 'system'}
      />
      <Btn
        label='Light Mode'
        onPress={() => setMode('light')}
        active={mode === 'light'}
      />
      <Btn
        label='Dark Mode'
        onPress={() => setMode('dark')}
        active={mode === 'dark'}
      />
    </View>
  );
};
export default SettingsScreen;
