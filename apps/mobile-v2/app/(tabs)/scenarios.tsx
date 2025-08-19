import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../src/theme/ThemeProvider';
import { Skeleton } from '../../src/ui/Skeleton';
import { EmptyState } from '../../src/ui/States';

function ScenariosSkeleton() {
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
      <Skeleton height={24} width='40%' style={{ marginBottom: 24 }} />
      <View style={{ gap: 12 }}>
        <Skeleton height={100} />
        <Skeleton height={100} />
        <Skeleton height={100} />
      </View>
    </View>
  );
}

function ScenariosContent() {
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
        title='No scenarios'
        description='Create scenarios to explore different financial outcomes'
        actionLabel='Create scenario'
        onAction={() => {}}
      />
    </View>
  );
}

export default function ScenariosScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <ScenariosSkeleton /> : <ScenariosContent />;
}
