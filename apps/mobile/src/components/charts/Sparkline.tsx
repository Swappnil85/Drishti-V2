import React from 'react';
import { View, StyleSheet } from 'react-native';

export interface SparklineProps {
  data: number[];
  height?: number;
  barWidth?: number;
  gap?: number;
  color?: string;
  backgroundColor?: string;
  style?: any;
}

// Simple bar sparkline (no external deps)
const Sparkline: React.FC<SparklineProps> = ({
  data,
  height = 60,
  barWidth = 6,
  gap = 2,
  color = '#4CAF50',
  backgroundColor = 'transparent',
  style,
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);

  return (
    <View style={[{ height, backgroundColor, flexDirection: 'row', alignItems: 'flex-end' }, style]}>
      {data.map((v, i) => {
        const h = Math.max(2, ((v - min) / range) * (height - 6));
        return (
          <View
            key={i}
            style={{
              width: barWidth,
              height: h,
              marginRight: i === data.length - 1 ? 0 : gap,
              borderRadius: 2,
              backgroundColor: color,
              opacity: 0.85,
            }}
          />
        );
      })}
    </View>
  );
};

export default Sparkline;

