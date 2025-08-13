import React from 'react';
import { View, Text } from 'react-native';

const HomeScreen: React.FC = () => {
  return (
    <View
      accessibilityRole='summary'
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text accessibilityRole='header'>Home Screen</Text>
    </View>
  );
};
export default HomeScreen;
