import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTokens, lightTokens, Mode, SemanticTokens } from './tokens';
import { logEvent } from '../telemetry';

export interface ThemePrefs {
  mode: Mode;
  reducedMotion: boolean;
  reducedMotionOverride?: 'system' | 'on' | 'off';
}

interface ThemeContextValue extends ThemePrefs {
  tokens: SemanticTokens;
  setMode: (mode: Mode) => void;
  setReducedMotionOverride: (override: 'system' | 'on' | 'off') => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = { children: React.ReactNode };
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setModeState] = useState<Mode>('system');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reducedMotionOverride, setReducedMotionOverrideState] = useState<
    'system' | 'on' | 'off'
  >('system');

  // Load prefs (skip in Jest to avoid act warnings)
  useEffect(() => {
    if ((globalThis as any)?.process?.env?.JEST_WORKER_ID) {
      return;
    }
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('theme_prefs');
        if (raw) {
          const parsed: ThemePrefs = JSON.parse(raw);
          setModeState(parsed.mode);
          if (parsed.reducedMotionOverride) {
            setReducedMotionOverrideState(parsed.reducedMotionOverride);
          }
        }
      } catch {
        // ignore persisted read error
      }
    })();
  }, []);

  // Reduced motion detection (skip in Jest; guard native calls)
  useEffect(() => {
    if ((globalThis as any)?.process?.env?.JEST_WORKER_ID) {
      return;
    }
    try {
      // Some test environments stub AccessibilityInfo
      if (
        typeof (AccessibilityInfo as any)?.isReduceMotionEnabled === 'function'
      ) {
        (AccessibilityInfo as any)
          .isReduceMotionEnabled()
          .then((v: boolean) => {
            setReducedMotion(!!v);
            logEvent('motion_pref_detected', { reducedMotion: !!v });
          })
          .catch(() => {});
      }
      const sub = (AccessibilityInfo as any)?.addEventListener?.(
        'reduceMotionChanged',
        (v: boolean) => {
          setReducedMotion(!!v);
          logEvent('motion_pref_detected', { reducedMotion: !!v });
        }
      );
      return () => sub?.remove?.();
    } catch {
      // ignore in non-native test env
      return () => undefined;
    }
  }, []);

  // Persist mode
  const setMode = (m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(
      'theme_prefs',
      JSON.stringify({ mode: m, reducedMotion, reducedMotionOverride })
    ).catch(() => {});
    logEvent('theme_change', { mode: m });
  };

  // Persist reduced motion override
  const setReducedMotionOverride = (override: 'system' | 'on' | 'off') => {
    setReducedMotionOverrideState(override);
    AsyncStorage.setItem(
      'theme_prefs',
      JSON.stringify({ mode, reducedMotion, reducedMotionOverride: override })
    ).catch(() => {});
    logEvent('motion_pref_changed', { reducedMotionOverride: override });
  };

  const systemIsDark = (() => {
    try {
      return Appearance.getColorScheme() === 'dark';
    } catch {
      return false;
    }
  })();
  const effectiveMode =
    mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;

  const tokens = useMemo(
    () => (effectiveMode === 'dark' ? darkTokens : lightTokens),
    [effectiveMode]
  );

  const effectiveReducedMotion = useMemo(() => {
    if (reducedMotionOverride === 'on') {
      return true;
    }
    if (reducedMotionOverride === 'off') {
      return false;
    }
    return reducedMotion; // system default
  }, [reducedMotionOverride, reducedMotion]);

  const value = useMemo(
    () => ({
      mode,
      reducedMotion: effectiveReducedMotion,
      reducedMotionOverride,
      tokens,
      setMode,
      setReducedMotionOverride,
    }),
    [
      mode,
      effectiveReducedMotion,
      reducedMotionOverride,
      tokens,
      setMode,
      setReducedMotionOverride,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
};
