import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Flex, Icon } from '../ui';

export interface StreaksWinsProps {
  // Input: monthly net worth changes (oldest -> newest)
  monthlyChanges: Array<{ change: number; month: string; year: number }>;
}

function computeStreaksAndWins(monthlyChanges: Array<{ change: number; month: string; year: number }>) {
  let currentStreak = 0;
  let bestStreak = 0;
  let wins = 0;

  for (let i = 0; i < monthlyChanges.length; i++) {
    const ch = monthlyChanges[i].change;
    if (ch > 0) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      wins += 1;
    } else if (ch < 0) {
      currentStreak = 0;
    }
  }

  // Recent win: last positive change month
  const lastWinIndex = [...monthlyChanges].reverse().findIndex(m => m.change > 0);
  const lastWin = lastWinIndex >= 0 ? monthlyChanges[monthlyChanges.length - 1 - lastWinIndex] : null;

  return { currentStreak, bestStreak, wins, lastWin };
}

const HomeStreaksWins: React.FC<StreaksWinsProps> = ({ monthlyChanges }) => {
  const summary = useMemo(() => computeStreaksAndWins(monthlyChanges), [monthlyChanges]);

  return (
    <Card variant='outlined' padding='lg'>
      <Flex direction='row' justify='space-between' align='center'>
        <View style={styles.item}>
          <Text style={styles.label}>Current Streak</Text>
          <Flex direction='row' align='center' gap='xs'>
            <Icon name='flame' size='sm' color='warning' />
            <Text style={styles.value}>{summary.currentStreak} mo</Text>
          </Flex>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>Best Streak</Text>
          <Flex direction='row' align='center' gap='xs'>
            <Icon name='trophy' size='sm' color='success' />
            <Text style={styles.value}>{summary.bestStreak} mo</Text>
          </Flex>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>Wins</Text>
          <Flex direction='row' align='center' gap='xs'>
            <Icon name='checkmark-circle' size='sm' color='success' />
            <Text style={styles.value}>{summary.wins}</Text>
          </Flex>
          {summary.lastWin && (
            <Text style={styles.subtle}>Last: {summary.lastWin.month} {summary.lastWin.year}</Text>
          )}
        </View>
      </Flex>
    </Card>
  );
};

const styles = StyleSheet.create({
  item: { alignItems: 'center' },
  label: { fontSize: 12, opacity: 0.7 },
  value: { fontSize: 16, fontWeight: '600' },
  subtle: { fontSize: 12, opacity: 0.6 },
});

export default HomeStreaksWins;

