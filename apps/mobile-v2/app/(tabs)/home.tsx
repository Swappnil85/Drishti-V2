import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../src/theme/ThemeProvider';
import { Skeleton } from '../../src/ui/Skeleton';
import { EmptyState } from '../../src/ui/States';

function HomeSkeleton() {
  const { tokens } = useThemeContext();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
      }}
    >
      <Skeleton height={24} width='30%' style={{ marginBottom: 24 }} />
      <View style={{ gap: 16 }}>
        <Skeleton height={200} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton height={80} style={{ flex: 1 }} />
          <Skeleton height={80} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton height={60} style={{ flex: 1 }} />
          <Skeleton height={60} style={{ flex: 1 }} />
          <Skeleton height={60} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

function HomeContent() {
  const { tokens } = useThemeContext();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        paddingTop: insets.top,
        paddingHorizontal: 16,
      }}
    >
      <EmptyState
        title='Welcome to Drishti'
        description='Your financial dashboard will appear here once you add accounts'
        actionLabel='Get started'
        onAction={() => {}}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <HomeSkeleton /> : <HomeContent />;
}
