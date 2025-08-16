import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../theme/ThemeProvider';
import { useHaptics } from '../../utils/haptics';

export type Toast = { id: number; message: string; duration?: number };

type ToastContextValue = {
  showToast: (message: string, duration?: number) => number;
  hideToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { tokens } = useThemeContext();
  const { success: hSuccess } = useHaptics();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const timers = useRef<Record<number, any>>({});

  const hideToast = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message: string, duration = 3000) => {
      const id = idRef.current++;
      setToasts(t => [{ id, message, duration }, ...t].slice(0, 3));
      if (!(globalThis as any)?.process?.env?.JEST_WORKER_ID) {
        timers.current[id] = setTimeout(() => hideToast(id), duration);
      }
      // Trigger a light success haptic for user feedback on toast show
      // (AC: success states). We use success pattern; honor reduced-motion in hook.
      hSuccess();
      return id;
    },
    [hideToast, hSuccess]
  );

  const value = useMemo(
    () => ({ showToast, hideToast }),
    [showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        accessibilityLiveRegion='polite'
        style={{
          position: 'absolute',
          bottom: Math.max(24, insets.bottom + 8),
          left: insets.left,
          right: insets.right,
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
        pointerEvents='none'
      >
        {toasts.map(t => (
          <View
            key={t.id}
            accessibilityRole='alert'
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              marginTop: 8,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              maxWidth: '90%',
            }}
          >
            <Text style={{ color: tokens.text }}>{t.message}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};
