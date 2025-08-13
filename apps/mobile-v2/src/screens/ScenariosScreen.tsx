import React from 'react';
import { View, Text } from 'react-native';

const ScenariosScreen: React.FC = () => {
  return (
    <View accessibilityRole="summary" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text accessibilityRole="header">Scenarios</Text>
    </View>
  );
};
export default ScenariosScreen;

