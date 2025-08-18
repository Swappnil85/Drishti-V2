import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Appearance,
  useWindowDimensions,
} from 'react-native';
import { useThemeContext } from '../../src/theme/ThemeProvider';
import {
  Wifi,
  WifiOff,
  Moon,
  Sun,
  Star,
  Trophy,
  Plus,
  GitBranch,
} from 'lucide-react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryAxis,
  VictoryVoronoiContainer,
  VictoryTooltip,
  VictoryLegend,
} from 'victory-native';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const TARGET_DEC = 150000;
const APP_ACTUAL_9M = [
  12000, 17500, 25500, 34000, 46000, 61000, 73000, 86000, 99000,
];

function buildSeries12m(actual9: number[]) {
  const out: {
    m: number;
    month: string;
    value: number | null;
    target: number;
  }[] = [];
  const total = 12;
  const step = TARGET_DEC / (total - 1);
  const last3 = actual9.slice(-3);
  const avgDelta = (last3[2] - last3[0]) / 2;
  let prev = actual9[actual9.length - 1];
  for (let i = 0; i < total; i++) {
    let value: number | null;
    if (i < actual9.length) value = actual9[i];
    else if (i < 11) {
      prev = prev + avgDelta;
      value = Math.round(prev);
    } else value = null;
    out.push({ m: i, month: MONTHS[i], value, target: Math.round(step * i) });
  }
  return out;
}

export default function Home() {
  const { tokens, mode } = useThemeContext();
  const sysDark = Appearance.getColorScheme() === 'dark';
  const dark = mode === 'dark' || (mode === 'system' && sysDark);
  const [offline, setOffline] = useState(false);
  const series12m = useMemo(() => buildSeries12m(APP_ACTUAL_9M), []);
  const { width } = useWindowDimensions();

  // Simple wrappers to match design primitives
  const Section = ({
    title,
    right,
    children,
  }: {
    title: string;
    right?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <View style={{ marginBottom: title === 'Quick Actions' ? 8 : 20 }}>
      <View
        style={{
          marginBottom: 8,
          paddingHorizontal: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.6,
            color: tokens.textSecondary,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
        {right}
      </View>
      <View style={{ paddingHorizontal: 8 }}>{children}</View>
    </View>
  );

  const Card = ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.surface,
        padding: 12,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      {children}
    </Pressable>
  );

  const chartColorAxis = dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const chartGrid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const targetStroke = dark ? '#facc15' : '#a16207';

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: tokens.text, fontWeight: '700' }}>
          Home <Text style={{ opacity: 0.6, fontSize: 10 }}>v2</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setOffline(v => !v)}
            accessibilityLabel='Toggle offline'
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: tokens.border,
              paddingHorizontal: 8,
              paddingVertical: 6,
              backgroundColor: tokens.surface,
            }}
          >
            {offline ? (
              <WifiOff color={tokens.text} size={16} />
            ) : (
              <Wifi color={tokens.text} size={16} />
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              /* Theme handled in Settings */
            }}
            accessibilityLabel='Theme'
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: tokens.border,
              paddingHorizontal: 8,
              paddingVertical: 6,
              backgroundColor: tokens.surface,
            }}
          >
            {dark ? (
              <Moon color={tokens.text} size={16} />
            ) : (
              <Sun color={tokens.text} size={16} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
        {/* Offline banner */}
        {offline && (
          <View
            style={{
              marginHorizontal: 8,
              marginTop: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: 12,
              padding: 12,
              backgroundColor: dark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
            }}
          >
            <WifiOff color={dark ? '#f59e0b' : '#b45309'} size={16} />
            <Text style={{ color: tokens.text, fontSize: 12 }}>
              Offline mode: syncing when you're back ✈️
            </Text>
          </View>
        )}

        {/* Net Worth */}
        <Section title='Net Worth'>
          <Card>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <View>
                <Text style={{ color: tokens.textSecondary, fontSize: 12 }}>
                  Current
                </Text>
                <Text
                  style={{
                    color: tokens.text,
                    fontSize: 26,
                    fontWeight: '700',
                  }}
                >
                  $120,000
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#16a34a', fontSize: 12 }}>
                  + $4,320 (30d)
                </Text>
                <Text style={{ color: tokens.textSecondary, fontSize: 10 }}>
                  Updated just now
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 10 }}>
              <VictoryChart
                width={width - 48}
                height={220}
                theme={VictoryTheme.material}
                containerComponent={
                  <VictoryVoronoiContainer
                    voronoiDimension='x'
                    labels={({ datum }) => {
                      const p: any = datum;
                      const value = p.value;
                      const target = p.target;
                      const month = p.month;
                      const prev = p.m > 0 ? series12m[p.m - 1]?.value : null;
                      const delta =
                        prev == null || value == null
                          ? null
                          : value - (prev as number);
                      const sign = delta == null ? '' : delta >= 0 ? '+' : '−';
                      const fmt = (n: number) =>
                        new Intl.NumberFormat('en-AU', {
                          style: 'currency',
                          currency: 'AUD',
                        }).format(n);
                      const line1 = `${month}`;
                      const line2 = `Target: ${fmt(target)}`;
                      const line3 =
                        value == null
                          ? 'Actual: —'
                          : `Actual: ${fmt(value)}${delta == null ? '' : ` (${sign}${fmt(Math.abs(delta))} m/m)`}`;
                      const gap =
                        value == null
                          ? ''
                          : `${value - target >= 0 ? 'Above' : 'Below'} by ${fmt(Math.abs(value - target))}`;
                      return `${line1}\n${line2}\n${line3}${gap ? `\n${gap}` : ''}`;
                    }}
                    labelComponent={
                      <VictoryTooltip
                        flyoutStyle={{
                          fill: dark
                            ? 'rgba(31,41,55,0.95)'
                            : 'rgba(255,255,255,0.95)',
                        }}
                        style={{
                          fontSize: 10,
                          fill: dark ? '#E5E7EB' : '#111827',
                        }}
                      />
                    }
                  />
                }
              >
                <VictoryAxis
                  style={{
                    tickLabels: { fill: chartColorAxis, fontSize: 10 },
                    grid: { stroke: 'transparent' },
                  }}
                  tickValues={MONTHS}
                  tickFormat={(t, i) => MONTHS[i]}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    tickLabels: { fill: chartColorAxis, fontSize: 10 },
                    grid: { stroke: chartGrid },
                  }}
                  tickFormat={(v: number) =>
                    new Intl.NumberFormat('en-AU', {
                      notation: 'compact',
                    }).format(v)
                  }
                />
                <VictoryLegend
                  x={width - 220}
                  y={0}
                  orientation='horizontal'
                  gutter={12}
                  style={{ labels: { fill: chartColorAxis, fontSize: 10 } }}
                  data={[{ name: 'Target' }, { name: 'Actual' }]}
                />
                <VictoryLine
                  name='Target'
                  data={series12m as any}
                  x='month'
                  y='target'
                  style={{
                    data: { stroke: targetStroke, strokeDasharray: '4,4' },
                  }}
                />
                <VictoryLine
                  name='Actual'
                  data={series12m as any}
                  x='month'
                  y='value'
                  style={{ data: { stroke: tokens.primary, strokeWidth: 2 } }}
                />
              </VictoryChart>
              <Text
                style={{
                  marginTop: 4,
                  paddingHorizontal: 4,
                  color: tokens.textSecondary,
                  fontSize: 10,
                }}
              >
                Gold = target. Tap any point for m/m delta & target gap.
              </Text>
            </View>
          </Card>
        </Section>

        {/* Streaks & Wins */}
        <Section
          title='Streaks & Wins'
          right={
            <Text style={{ color: tokens.textSecondary, fontSize: 12 }}>
              Private by default
            </Text>
          }
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Card>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Star size={16} color={tokens.text} />
                  <View>
                    <Text style={{ color: tokens.text, fontSize: 14 }}>
                      7‑day Save Streak
                    </Text>
                    <Text style={{ color: tokens.textSecondary, fontSize: 12 }}>
                      Nice consistency 🔥
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
            <View style={{ flex: 1 }}>
              <Card>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Trophy size={16} color={tokens.text} />
                  <View>
                    <Text style={{ color: tokens.text, fontSize: 14 }}>
                      +$500 this week
                    </Text>
                    <Text style={{ color: tokens.textSecondary, fontSize: 12 }}>
                      Auto‑sweep + roundup
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          </View>
        </Section>

        {/* Quick Actions */}
        <Section title='Quick Actions'>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Card onPress={() => {}}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Plus size={18} color={tokens.text} />
                  <Text style={{ color: tokens.text, fontSize: 12 }}>
                    Add Account
                  </Text>
                </View>
              </Card>
            </View>
            <View style={{ flex: 1 }}>
              <Card onPress={() => {}}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <GitBranch size={18} color={tokens.text} />
                  <Text style={{ color: tokens.text, fontSize: 12 }}>
                    New Scenario
                  </Text>
                </View>
              </Card>
            </View>
            <View style={{ flex: 1 }}>
              <Card onPress={() => {}}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Trophy size={18} color={tokens.text} />
                  <Text style={{ color: tokens.text, fontSize: 12 }}>
                    Adjust Plan
                  </Text>
                </View>
              </Card>
            </View>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}
