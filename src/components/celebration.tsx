import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { Brand, Radius, Space } from '@/lib/theme';

export type CelebrationStyle = 'money' | 'confetti';

export type Celebration = {
  title: string;
  message?: string;
  emoji?: string;
  style?: CelebrationStyle;
  /** Extra lines, e.g. newly earned badges. */
  extras?: string[];
  cta?: string;
};

type Ctx = { celebrate: (c: Celebration) => void };

const CelebrationContext = createContext<Ctx>({ celebrate: () => {} });

export function useCelebrate() {
  return useContext(CelebrationContext).celebrate;
}

const CONFETTI_COLORS = [Brand.blue, Brand.gold, '#E4572E', '#1E9E5A', '#B04BE0', '#FFFFFF'];
const MONEY = ['💵', '💵', '💸', '💰', '🪙'];
const useNative = Platform.OS !== 'web';

type Piece = {
  x: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  size: number;
  color: string;
  glyph: string | null;
};

function makePieces(style: CelebrationStyle, width: number): Piece[] {
  const count = style === 'money' ? 46 : 60;
  return Array.from({ length: count }, (_, i) => {
    const isGlyph = style === 'money' ? i % 3 !== 0 : i % 9 === 0;
    return {
      x: Math.random() * width,
      delay: Math.random() * 900,
      duration: 2200 + Math.random() * 1600,
      drift: (Math.random() - 0.5) * 140,
      spin: (Math.random() - 0.5) * 900,
      size: isGlyph ? 22 + Math.random() * 16 : 7 + Math.random() * 7,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      glyph: isGlyph ? (style === 'money' ? MONEY[i % MONEY.length] : '🎉') : null,
    };
  });
}

function FallingPiece({ piece, height }: { piece: Piece; height: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: useNative,
    }).start();
  }, [piece, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-60, height + 60] });
  const translateX = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, piece.drift, piece.drift * 0.4] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: piece.x, top: 0, transform: [{ translateY }, { translateX }, { rotate }] }}>
      {piece.glyph ? (
        <Text style={{ fontSize: piece.size }}>{piece.glyph}</Text>
      ) : (
        <View style={{ width: piece.size, height: piece.size * 0.45, backgroundColor: piece.color, borderRadius: 2 }} />
      )}
    </Animated.View>
  );
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Celebration | null>(null);
  const [runId, setRunId] = useState(0);
  const { width, height } = useWindowDimensions();
  const colors = useColors();
  const [pop] = useState(() => new Animated.Value(0));

  const celebrate = useCallback(
    (c: Celebration) => {
      setCurrent(c);
      setRunId((n) => n + 1);
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: useNative }).start();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    },
    [pop]
  );

  const pieces = useMemo(
    () => (current ? makePieces(current.style ?? 'confetti', width) : []),
    // A new burst every time celebrate() is called.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runId, width]
  );

  const value = useMemo(() => ({ celebrate }), [celebrate]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <Modal visible={!!current} transparent animationType="fade" onRequestClose={() => setCurrent(null)}>
        <View style={styles.backdrop}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {pieces.map((p, i) => (
              <FallingPiece key={`${runId}-${i}`} piece={p} height={height} />
            ))}
          </View>
          {current && (
            <Animated.View
              style={[
                styles.card,
                { backgroundColor: colors.card, transform: [{ scale }], opacity: pop },
              ]}>
              <Text style={styles.emoji}>{current.emoji ?? '🎉'}</Text>
              <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
              {current.message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{current.message}</Text>
              ) : null}
              {current.extras?.map((line) => (
                <View key={line} style={[styles.extra, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.extraText, { color: colors.text }]}>{line}</Text>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() => setCurrent(null)}
                style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
                <Text style={styles.buttonText}>{current.cta ?? 'Keep building'}</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Modal>
    </CelebrationContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 40, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.lg,
    padding: Space.xl,
    alignItems: 'center',
    gap: Space.md,
  },
  emoji: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  extra: { borderRadius: Radius.pill, paddingVertical: Space.sm, paddingHorizontal: Space.lg },
  extraText: { fontSize: 15, fontWeight: '700' },
  button: {
    marginTop: Space.sm,
    borderRadius: Radius.pill,
    paddingVertical: Space.md,
    paddingHorizontal: Space.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
