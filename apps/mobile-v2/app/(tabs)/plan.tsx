import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../src/theme/ThemeProvider';
import { Skeleton } from '../../src/ui/Skeleton';
import { EmptyState } from '../../src/ui/States';

function PlanSkeleton() {
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
      <View style={{ gap: 12 }}>
        <Skeleton height={120} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </View>
    </View>
  );
}

function PlanContent() {
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
        title='No plan'
        description='Create your financial plan to get started'
        actionLabel='Create plan'
        onAction={() => {}}
      />
    </View>
  );
}

export default function PlanScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <PlanSkeleton /> : <PlanContent />;
}
