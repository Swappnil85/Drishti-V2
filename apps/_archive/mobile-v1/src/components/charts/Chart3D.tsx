/**
 * Chart3D Component
 * Epic 10, Story 1: Goal Progress Visual Charts - 3D visualization options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import Svg, { 
  Path, 
  Circle, 
  Ellipse, 
  G, 
  Defs, 
  LinearGradient, 
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Card, Icon } from '../ui';
import { useHaptic } from '../../hooks/useHaptic';
import { useTheme } from '../../contexts/ThemeContext';

interface Chart3DProps {
  data: ChartData[];
  type: '3d-bar' | '3d-pie' | '3d-cylinder';
  height?: number;
  width?: number;
  rotationX?: number;
  rotationY?: number;
  depth?: number;
  onDataPointPress?: (dataPoint: ChartData) => void;
  showAnimations?: boolean;
  interactive?: boolean;
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
  metadata?: any;
}

const { width: screenWidth } = Dimensions.get('window');

export const Chart3D: React.FC<Chart3DProps> = ({
  data,
  type,
  height = 300,
  width = screenWidth - 40,
  rotationX = 15,
  rotationY = 0,
  depth = 30,
  onDataPointPress,
  showAnimations = true,
  interactive = true,
}) => {
  const [rotation] = useState(new Animated.ValueXY({ x: rotationX, y: rotationY }));
  const [animatedValues] = useState(data.map(() => new Animated.Value(0)));
  const { impactLight } = useHaptic();
  const { theme } = useTheme();

  useEffect(() => {
    if (showAnimations) {
      const animations = animatedValues.map((animValue, index) =>
        Animated.timing(animValue, {
          toValue: data[index].value,
          duration: 1500 + index * 200,
          useNativeDriver: false,
        })
      );
      
      Animated.stagger(100, animations).start();
    }
  }, [data, showAnimations]);

  const handlePanGesture = (event: any) => {
    if (!interactive) return;
    
    const { translationX, translationY, state } = event.nativeEvent;
    
    if (state === State.ACTIVE) {
      rotation.setValue({
        x: rotationX + translationY * 0.1,
        y: rotationY + translationX * 0.1,
      });
    }
  };

  const handleDataPointPress = async (dataPoint: ChartData) => {
    if (interactive && onDataPointPress) {
      await impactLight();
      onDataPointPress(dataPoint);
    }
  };

  const render3DBar = (dataPoint: ChartData, index: number, maxValue: number) => {
    const barWidth = (width - 80) / data.length - 10;
    const barHeight = (dataPoint.value / maxValue) * (height - 100);
    const x = 40 + index * (barWidth + 10);
    const y = height - 50 - barHeight;
    
    const color = dataPoint.color || theme.colors.primary;
    const shadowColor = adjustColorBrightness(color, -30);
    const topColor = adjustColorBrightness(color, 20);

    return (
      <G key={index}>
        {/* Shadow/depth */}
        <Path
          d={`M ${x + depth} ${y - depth} L ${x + barWidth + depth} ${y - depth} L ${x + barWidth + depth} ${y + barHeight - depth} L ${x + depth} ${y + barHeight - depth} Z`}
          fill={shadowColor}
        />
        
        {/* Top face */}
        <Path
          d={`M ${x} ${y} L ${x + depth} ${y - depth} L ${x + barWidth + depth} ${y - depth} L ${x + barWidth} ${y} Z`}
          fill={topColor}
        />
        
        {/* Front face */}
        <TouchableOpacity onPress={() => handleDataPointPress(dataPoint)}>
          <Path
            d={`M ${x} ${y} L ${x + barWidth} ${y} L ${x + barWidth} ${y + barHeight} L ${x} ${y + barHeight} Z`}
            fill={color}
          />
        </TouchableOpacity>
        
        {/* Label */}
        <SvgText
          x={x + barWidth / 2}
          y={y + barHeight + 20}
          textAnchor="middle"
          fontSize="12"
          fill={theme.colors.text}
        >
          {dataPoint.label}
        </SvgText>
        
        {/* Value */}
        <SvgText
          x={x + barWidth / 2}
          y={y - 10}
          textAnchor="middle"
          fontSize="10"
          fill={theme.colors.text}
          fontWeight="bold"
        >
          {dataPoint.value}
        </SvgText>
      </G>
    );
  };

  const render3DPie = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    let currentAngle = 0;
    
    return data.map((dataPoint, index) => {
      const sliceAngle = (dataPoint.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      
      const color = dataPoint.color || theme.colors.primary;
      const shadowColor = adjustColorBrightness(color, -30);
      
      currentAngle += sliceAngle;
      
      return (
        <G key={index}>
          {/* Shadow slice */}
          <Path
            d={`M ${centerX} ${centerY + depth} L ${x1} ${y1 + depth} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2 + depth} Z`}
            fill={shadowColor}
          />
          
          {/* Main slice */}
          <TouchableOpacity onPress={() => handleDataPointPress(dataPoint)}>
            <Path
              d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
              fill={color}
            />
          </TouchableOpacity>
          
          {/* Label */}
          <SvgText
            x={centerX + (radius * 0.7) * Math.cos(startAngle + sliceAngle / 2)}
            y={centerY + (radius * 0.7) * Math.sin(startAngle + sliceAngle / 2)}
            textAnchor="middle"
            fontSize="10"
            fill={theme.colors.onPrimary}
            fontWeight="bold"
          >
            {dataPoint.label}
          </SvgText>
        </G>
      );
    });
  };

  const render3DCylinder = (dataPoint: ChartData, index: number, maxValue: number) => {
    const cylinderWidth = (width - 80) / data.length - 10;
    const cylinderHeight = (dataPoint.value / maxValue) * (height - 100);
    const x = 40 + index * (cylinderWidth + 10);
    const y = height - 50 - cylinderHeight;
    const rx = cylinderWidth / 2;
    const ry = 8;
    
    const color = dataPoint.color || theme.colors.primary;
    const shadowColor = adjustColorBrightness(color, -30);
    const topColor = adjustColorBrightness(color, 20);

    return (
      <G key={index}>
        {/* Cylinder body */}
        <TouchableOpacity onPress={() => handleDataPointPress(dataPoint)}>
          <Path
            d={`M ${x} ${y + ry} L ${x} ${y + cylinderHeight - ry} A ${rx} ${ry} 0 0 0 ${x + cylinderWidth} ${y + cylinderHeight - ry} L ${x + cylinderWidth} ${y + ry} A ${rx} ${ry} 0 0 0 ${x} ${y + ry} Z`}
            fill={color}
          />
        </TouchableOpacity>
        
        {/* Top ellipse */}
        <Ellipse
          cx={x + rx}
          cy={y + ry}
          rx={rx}
          ry={ry}
          fill={topColor}
        />
        
        {/* Bottom ellipse */}
        <Ellipse
          cx={x + rx}
          cy={y + cylinderHeight - ry}
          rx={rx}
          ry={ry}
          fill={shadowColor}
        />
        
        {/* Label */}
        <SvgText
          x={x + rx}
          y={y + cylinderHeight + 20}
          textAnchor="middle"
          fontSize="12"
          fill={theme.colors.text}
        >
          {dataPoint.label}
        </SvgText>
      </G>
    );
  };

  const renderChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    switch (type) {
      case '3d-bar':
        return data.map((dataPoint, index) => render3DBar(dataPoint, index, maxValue));
      case '3d-pie':
        return render3DPie();
      case '3d-cylinder':
        return data.map((dataPoint, index) => render3DCylinder(dataPoint, index, maxValue));
      default:
        return null;
    }
  };

  const adjustColorBrightness = (color: string, amount: number): string => {
    // Simple color brightness adjustment
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          3D Visualization
        </Text>
        <TouchableOpacity style={styles.resetButton}>
          <Icon name="rotate-ccw" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <PanGestureHandler onGestureEvent={handlePanGesture}>
        <Animated.View style={[styles.chartContainer, { height, width }]}>
          <Svg height={height} width={width}>
            <Defs>
              <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="1" />
                <Stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            {renderChart()}
          </Svg>
        </Animated.View>
      </PanGestureHandler>
      
      {interactive && (
        <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
          Drag to rotate • Tap data points for details
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    padding: 8,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 12,
  },
});
