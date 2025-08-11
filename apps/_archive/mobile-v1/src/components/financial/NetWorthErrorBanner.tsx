import React from 'react';
import { View, Text as RNText, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export interface NetWorthErrorBannerProps {
  message: string;
  onRetry: () => void;
}

const NetWorthErrorBanner: React.FC<NetWorthErrorBannerProps> = ({
  message,
  onRetry,
}) => {
  const theme = useTheme();
  return (
    <View
      style={{
        marginTop: 6,
        alignSelf: 'stretch',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: theme.colors.warning[50],
        borderRadius: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.warning[200],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      accessibilityRole='alert'
      accessibilityLabel='Net worth error'
    >
      <RNText style={{ color: theme.colors.text.primary, flex: 1 }}>
        {message}
      </RNText>
      <TouchableOpacity
        onPress={onRetry}
        accessibilityRole='button'
        accessibilityLabel='Retry'
        style={{
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 4,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.warning[200],
          marginLeft: 10,
        }}
      >
        <RNText style={{ color: theme.colors.text.primary }}>Retry</RNText>
      </TouchableOpacity>
    </View>
  );
};

export default NetWorthErrorBanner;
