import React from 'react';
import { View, Text } from 'react-native';

const PlanScreen: React.FC = () => {
  return (
    <View accessibilityRole="summary" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text accessibilityRole="header">Plan</Text>
    </View>
  );
};
export default PlanScreen;

