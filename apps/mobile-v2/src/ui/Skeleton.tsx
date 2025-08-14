import { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useThemeContext } from '../theme/ThemeProvider';

export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  rounded?: number;
  style?: ViewStyle;
  'aria-label'?: string;
};

// Simple pulse animation (shimmer avoided to keep dep-free)
export const Skeleton = ({
  width = '100%',
  height = 16,
  rounded = 8,
  style,
  'aria-label': ariaLabel = 'Loading',
}: SkeletonProps) => {
  const { tokens, reducedMotion } = useThemeContext();
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Disable animation in tests or when user prefers reduced motion
    if (reducedMotion || process.env.JEST_WORKER_ID) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  const opacityStyle = process.env.JEST_WORKER_ID ? 0.8 : (opacity as any);
  const Container: any = process.env.JEST_WORKER_ID ? View : Animated.View;
  return (
    <Container
      accessibilityRole='progressbar'
      accessibilityLabel={ariaLabel}
      style={[
        {
          width,
          height,
          borderRadius: rounded,
          backgroundColor: tokens.surface,
          opacity: opacityStyle,
        },
        style,
      ]}
    />
  );
};

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => {
  const gap = 10;
  return (
    <View accessibilityRole='progressbar' accessibilityLabel='Loading content'>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={`${80 - i * 10}%`}
          style={{ marginBottom: i === lines - 1 ? 0 : gap }}
        />
      ))}
    </View>
  );
};
