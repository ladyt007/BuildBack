/**
 * Animated opening screen: the brick B is built row by row from the bottom up,
 * the last brick drops into place, then the name fades in and the app appears.
 * Layers come from scripts/generate-logo.py (assets/images/intro).
 */
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';

import { Brand } from '@/lib/theme';

const ROWS = [
  require('@/assets/images/intro/row-0.png'),
  require('@/assets/images/intro/row-1.png'),
  require('@/assets/images/intro/row-2.png'),
  require('@/assets/images/intro/row-3.png'),
  require('@/assets/images/intro/row-4.png'),
  require('@/assets/images/intro/row-5.png'),
  require('@/assets/images/intro/row-6.png'),
  require('@/assets/images/intro/row-7.png'),
  require('@/assets/images/intro/row-8.png'),
];
const LAST_BRICK = require('@/assets/images/intro/last-brick.png');
const NEW_BRICK = require('@/assets/images/intro/new-brick.png');

const useNative = Platform.OS !== 'web';
const ROW_STAGGER = 90;
const ROW_DURATION = 300;

export function IntroAnimation({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.8, 360);

  const [rows] = useState(() => ROWS.map(() => new Animated.Value(0)));
  const [drop] = useState(() => new Animated.Value(0));
  const [settle] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [words] = useState(() => new Animated.Value(0));
  const [exit] = useState(() => new Animated.Value(1));
  const [built, setBuilt] = useState(false);

  // Build the B.
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          [...rows, drop, settle, words].forEach((v) => v.setValue(1));
          setBuilt(true);
          return;
        }
        const timing = (v: Animated.Value, duration: number, easing = Easing.out(Easing.cubic)) =>
          Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: useNative });

        Animated.sequence([
          Animated.delay(150),
          // Bottom row first, like a real wall.
          Animated.stagger(
            ROW_STAGGER,
            [...rows].reverse().map((v) => timing(v, ROW_DURATION, Easing.out(Easing.back(1.4))))
          ),
          // The last brick drops into the top corner…
          timing(drop, 480, Easing.bounce),
        ]).start(({ finished }) => {
          if (!finished || cancelled) return;
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          // …settles in, and the name appears.
          Animated.parallel([
            Animated.sequence([timing(pulse, 160), Animated.timing(pulse, { toValue: 0, duration: 220, useNativeDriver: useNative })]),
            Animated.sequence([Animated.delay(120), timing(settle, 260)]),
            Animated.sequence([Animated.delay(150), timing(words, 380)]),
          ]).start(() => {
            if (!cancelled) setBuilt(true);
          });
        });
      });
    return () => {
      cancelled = true;
    };
  }, [rows, drop, settle, pulse, words]);

  // Fade away once the B is built and the app has loaded.
  useEffect(() => {
    if (!built || !ready) return;
    const t = setTimeout(() => {
      Animated.timing(exit, { toValue: 0, duration: 380, useNativeDriver: useNative }).start(() => onDone());
    }, 450);
    return () => clearTimeout(t);
  }, [built, ready, exit, onDone]);

  const layer = { position: 'absolute' as const, width: size, height: size, top: 0, left: 0 };
  const rowStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.12, 0] }) }],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: exit }]}>
      <LinearGradient colors={[Brand.blueDeep, Brand.blueDeep, Brand.blue]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Pressable
        style={styles.fill}
        accessibilityLabel="BuildBack is loading. Tap to skip."
        onPress={() => {
          if (ready) onDone();
        }}>
        <Animated.View
          style={{
            width: size,
            height: size,
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
          }}>
          {rows.map((v, i) => (
            <Animated.View key={i} style={[layer, rowStyle(v)]}>
              <Image source={ROWS[i]} style={{ width: size, height: size }} />
            </Animated.View>
          ))}
          <Animated.View style={[layer, { opacity: settle }]}>
            <Image source={LAST_BRICK} style={{ width: size, height: size }} />
          </Animated.View>
          <Animated.View
            style={[
              layer,
              {
                opacity: Animated.multiply(
                  drop.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 1, 1] }),
                  settle.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
                ),
                transform: [
                  { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.5, 0] }) },
                  { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '0deg'] }) },
                ],
              },
            ]}>
            <Image source={NEW_BRICK} style={{ width: size, height: size }} />
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={{
            alignItems: 'center',
            opacity: words,
            transform: [{ translateY: words.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}>
          <Text style={styles.name}>
            Build<Text style={{ color: Brand.gold }}>Back</Text>
          </Text>
          <Text style={styles.tagline}>One store at a time. One person at a time.</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: Brand.blueDeep, zIndex: 1000 },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  name: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  tagline: { color: '#DDE2FF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
