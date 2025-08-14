import { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeContext } from '../theme/ThemeProvider';

export type StateBaseProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  testID?: string;
};

const container = (bg: string) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: bg });

export const EmptyState = ({ title, description, actionLabel, onAction, icon, testID }: StateBaseProps) => {
  const { tokens } = useThemeContext();
  return (
    <View style={container(tokens.bg)} accessibilityRole="summary" accessibilityLabel={title} testID={testID}>
      {icon}
      <Text accessibilityRole="header" style={{ color: tokens.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{title}</Text>
      {!!description && <Text style={{ color: tokens.textMuted, textAlign: 'center', marginBottom: actionLabel ? 16 : 0 }}>{description}</Text>}
      {!!actionLabel && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => ({
            minWidth: 120,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: tokens.primary,
            opacity: pressed ? 0.85 : 1,
            marginTop: 8,
          })}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

export const ErrorState = ({ title, description, actionLabel = 'Retry', onAction, icon, testID }: StateBaseProps) => {
  const { tokens } = useThemeContext();
  return (
    <View style={container(tokens.bg)} accessibilityRole="alert" accessibilityLabel={title} testID={testID}>
      {icon}
      <Text accessibilityRole="header" style={{ color: tokens.critical, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{title}</Text>
      {!!description && <Text style={{ color: tokens.textMuted, textAlign: 'center' }}>{description}</Text>}
      {!!actionLabel && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => ({
            minWidth: 120,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: tokens.critical,
            opacity: pressed ? 0.85 : 1,
            marginTop: 12,
          })}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

