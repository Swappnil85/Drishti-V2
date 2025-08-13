import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTokens, lightTokens, Mode, SemanticTokens } from './tokens';
import { logEvent } from '../telemetry';

export interface ThemePrefs {
  mode: Mode;
  reducedMotion: boolean;
}

interface ThemeContextValue extends ThemePrefs {
  tokens: SemanticTokens;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<Mode>('system');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load prefs
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('theme_prefs');
        if (raw) {
          const parsed: ThemePrefs = JSON.parse(raw);
          setModeState(parsed.mode);
        }
      } catch {}
    })();
  }, []);

  // Reduced motion detection
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(v => {
      setReducedMotion(v);
      logEvent('motion_pref_detected', { reducedMotion: v });
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => {
      setReducedMotion(v);
      logEvent('motion_pref_detected', { reducedMotion: v });
    });
    return () => sub.remove();
  }, []);

  // Persist mode
  const setMode = (m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(
      'theme_prefs',
      JSON.stringify({ mode: m, reducedMotion })
    );
    logEvent('theme_change', { mode: m });
  };

  const systemIsDark = Appearance.getColorScheme() === 'dark';
  const effectiveMode =
    mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;

  const tokens = useMemo(
    () => (effectiveMode === 'dark' ? darkTokens : lightTokens),
    [effectiveMode]
  );

  const value = useMemo(
    () => ({ mode, reducedMotion, tokens, setMode }),
    [mode, reducedMotion, tokens]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
};
