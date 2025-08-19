import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../src/theme/ThemeProvider';
import { Skeleton, SkeletonText } from '../../src/ui/Skeleton';
import { EmptyState } from '../../src/ui/States';

function AccountsSkeleton() {
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
      <View style={{ gap: 16 }}>
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
      </View>
    </View>
  );
}

function AccountsContent() {
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
        title='No accounts'
        description='Add your first account to get started'
        actionLabel='Add account'
        onAction={() => {}}
      />
    </View>
  );
}

export default function AccountsScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate boot loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <AccountsSkeleton /> : <AccountsContent />;
}
