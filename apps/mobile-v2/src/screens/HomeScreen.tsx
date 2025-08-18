import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Appearance,
  useWindowDimensions,
} from 'react-native';
import { useThemeContext } from '../theme/ThemeProvider';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { LucideProps } from 'lucide-react-native';
// lazily require icons to avoid type mismatch between React 18/19 typings in CI
// use any to sidestep JSX component type mismatch while keeping runtime intact
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  Wifi,
  WifiOff,
  Moon,
  Sun,
  Star,
  Trophy,
  Plus,
  GitBranch,
}: any = require('lucide-react-native');
// Use untyped requires to avoid React 18/19 type mismatch in CI
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Svg: any = require('react-native-svg').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Path, Circle }: any = require('react-native-svg');

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
    if (i < actual9.length) {
      value = actual9[i];
    } else if (i < 11) {
      prev = prev + avgDelta;
      value = Math.round(prev);
    } else {
      value = null;
    }
    out.push({ m: i, month: MONTHS[i], value, target: Math.round(step * i) });
  }
  return out;
}

export default function HomeScreen() {
  const { tokens, mode } = useThemeContext();
  const sysDark = Appearance.getColorScheme() === 'dark';
  const dark = mode === 'dark' || (mode === 'system' && sysDark);
  const [offline, setOffline] = useState(false);
  const series12m = useMemo(() => buildSeries12m(APP_ACTUAL_9M), []);
  const { width } = useWindowDimensions();

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
              /* Theme via Settings */
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
              {/* Lightweight SVG chart to avoid native Skia dependency */}
              {(() => {
                const h = 220;
                const w = width - 48;
                const pad = 24;
                const innerW = Math.max(1, w - pad * 2);
                const innerH = Math.max(1, h - pad * 2);
                const maxV = Math.max(
                  ...series12m.map(p => Math.max(p.target, p.value ?? 0)),
                  TARGET_DEC
                );
                const minV = 0;
                const xAt = (i: number) =>
                  pad + (i / (series12m.length - 1)) * innerW;
                const yAt = (v: number) =>
                  pad + innerH - ((v - minV) / (maxV - minV)) * innerH;

                const pathFor = (arr: Array<number | null>) => {
                  let d = '';
                  let penUp = true;
                  arr.forEach((v, i) => {
                    if (v === null) {
                      penUp = true;
                    } else {
                      const x = xAt(i);
                      const y = yAt(v);
                      d += `${penUp ? 'M' : 'L'}${x},${y} `;
                      penUp = false;
                    }
                  });
                  return d.trim();
                };

                const targetPath = pathFor(series12m.map(p => p.target));
                const actualPath = pathFor(series12m.map(p => p.value));

                return (
                  <Svg width={w} height={h}>
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((g, idx) => (
                      <Path
                        key={idx}
                        d={`M${pad},${pad + innerH * g} L${pad + innerW},${pad + innerH * g}`}
                        stroke={chartGrid}
                        strokeWidth={1}
                      />
                    ))}
                    {/* Axes (x baseline and y axis) */}
                    <Path
                      d={`M${pad},${pad + innerH} L${pad + innerW},${pad + innerH}`}
                      stroke={chartColorAxis}
                      strokeWidth={1}
                    />
                    <Path
                      d={`M${pad},${pad} L${pad},${pad + innerH}`}
                      stroke={chartColorAxis}
                      strokeWidth={1}
                    />

                    {/* Target dashed */}
                    <Path
                      d={targetPath}
                      stroke={targetStroke}
                      strokeDasharray='4 4'
                      strokeWidth={1.5}
                      fill='none'
                    />
                    {/* Actual line */}
                    <Path
                      d={actualPath}
                      stroke={tokens.primary}
                      strokeWidth={2}
                      fill='none'
                    />
                    {/* Actual points */}
                    {series12m.map((p, i) =>
                      p.value === null ? null : (
                        <Circle
                          key={i}
                          cx={xAt(i)}
                          cy={yAt(p.value)}
                          r={3}
                          fill={tokens.primary}
                        />
                      )
                    )}
                  </Svg>
                );
              })()}

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
