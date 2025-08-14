import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View, Pressable, AccessibilityInfo } from 'react-native';
import { useThemeContext } from '../../theme/ThemeProvider';

export type SheetOptions = {
  onClose?: () => void;
};

export type OpenSheetArg = React.ReactNode | ((close: () => void) => React.ReactNode);

type SheetContextValue = {
  openSheet: (content: OpenSheetArg, opts?: SheetOptions) => void;
  closeSheet: () => void;
  isOpen: boolean;
};

const SheetContext = createContext<SheetContextValue | undefined>(undefined);

export const useSheet = () => {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('useSheet must be used within SheetProvider');
  return ctx;
};

export const SheetProvider = ({ children }: { children: React.ReactNode }) => {
  const { tokens, reducedMotion } = useThemeContext();
  const [isOpen, setOpen] = useState(false);
  const [content, setContent] = useState<OpenSheetArg | null>(null);
  const onCloseRef = useRef<(() => void) | undefined>();
  const translateY = useRef(new Animated.Value(300)).current; // off-screen start

  const animateTo = (toValue: number, cb?: () => void) => {
    if (process.env.JEST_WORKER_ID || reducedMotion) {
      // jump
      (translateY as any).setValue(toValue);
      cb?.();
      return;
    }
    Animated.timing(translateY, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start(() => cb?.());
  };

  const closeSheet = useCallback(() => {
    animateTo(300, () => {
      setOpen(false);
      setContent(null);
      onCloseRef.current?.();
    });
  }, [animateTo]);

  const openSheet = useCallback(
    (c: OpenSheetArg, opts?: SheetOptions) => {
      onCloseRef.current = opts?.onClose;
      setContent(() => c);
      setOpen(true);
      // announcer for a11y
      try { AccessibilityInfo.announceForAccessibility?.('Sheet opened'); } catch {}
      animateTo(0);
    },
    [animateTo]
  );

  const panResponder = useMemo(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: Animated.event([null, { dy: translateY }], {
        useNativeDriver: false,
        listener: (_, g) => {
          const val = Math.max(0, g.dy);
          (translateY as any).setValue(val);
        },
      }),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) closeSheet();
        else animateTo(0);
      },
    }),
  [closeSheet]);

  const value = useMemo(() => ({ openSheet, closeSheet, isOpen }), [openSheet, closeSheet, isOpen]);

  const Container: any = process.env.JEST_WORKER_ID ? View : Animated.View;

  return (
    <SheetContext.Provider value={value}>
      {children}
      {isOpen && (
        <View style={{ position: 'absolute', inset: 0 }} pointerEvents='box-none'>
          {/* backdrop */}
          <Pressable
            accessibilityLabel='Close sheet'
            accessibilityRole='button'
            onPress={closeSheet}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          {/* sheet */}
          <Container
            accessibilityRole='dialog'
            accessibilityViewIsModal
            onAccessibilityEscape={closeSheet}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: tokens.surface,
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              transform: [{ translateY }],
            }}
            {...panResponder.panHandlers}
          >
            {typeof content === 'function' ? (content as any)(closeSheet) : content}
          </Container>
        </View>
      )}
    </SheetContext.Provider>
  );
};

