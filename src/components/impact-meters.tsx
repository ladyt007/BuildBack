/** Visual tallies for the Impact tab: a brick wall of lives built up, and a giving meter. */
import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { formatMoney, type ImpactSummary } from '@/lib/gamification';
import type { GivingDisplay } from '@/lib/types';
import { Brand, Space } from '@/lib/theme';

import { ProgressBar } from './ui';

const WALL_GOALS = [10, 25, 50, 100, 250, 500, 1000];
const PER_ROW = 5;
const SHADES = [Brand.gold, '#F2C935', '#C4940A'];

/** The next wall size to fill: 10, then 25, 50, 100… */
function wallSize(count: number): number {
  return WALL_GOALS.find((g) => count < g) ?? Math.ceil((count + 1) / 100) * 100;
}

/**
 * A wall that gets one gold brick for every life built up. Empty slots show how far it is to the
 * next full wall. The newest brick drops in when the screen opens.
 */
export function LivesWall({ count }: { count: number }) {
  const colors = useColors();
  const size = wallSize(count);
  // Large walls are drawn in groups of 5 so they stay a reasonable height.
  const unit = size > 50 ? Math.ceil(size / 50) : 1;
  const slots = Math.ceil(size / unit);
  const filled = Math.floor(count / unit);
  const rows = Math.ceil(slots / PER_ROW);
  const [drop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    drop.setValue(0);
    Animated.spring(drop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [count, drop]);

  // Bottom row first, like a real wall.
  const wall = Array.from({ length: rows }, (_, r) => {
    const rowFromBottom = rows - 1 - r;
    const start = rowFromBottom * PER_ROW;
    return Array.from({ length: PER_ROW }, (_, c) => start + c).filter((i) => i < slots);
  });

  return (
    <View style={{ gap: Space.sm }} accessibilityLabel={`${count} lives built up. ${size - count} more to fill this wall.`}>
      <View style={{ gap: 4 }}>
        {wall.map((row, r) => (
          <View key={r} style={[styles.row, { marginLeft: (rows - 1 - r) % 2 ? 14 : 0, marginRight: (rows - 1 - r) % 2 ? 0 : 14 }]}>
            {row.map((i) => {
              const isFilled = i < filled;
              const isNewest = i === filled - 1;
              const brick = (
                <View
                  style={[
                    styles.brick,
                    isFilled
                      ? { backgroundColor: SHADES[i % SHADES.length] }
                      : { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1.5, borderStyle: 'dashed' },
                  ]}>
                  {isFilled ? <View style={styles.highlight} /> : null}
                </View>
              );
              return isNewest ? (
                <Animated.View
                  key={i}
                  style={{
                    flex: 1,
                    transform: [
                      { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
                      { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '0deg'] }) },
                    ],
                    opacity: drop.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
                  }}>
                  {brick}
                </Animated.View>
              ) : (
                <View key={i} style={{ flex: 1 }}>
                  {brick}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
        {unit > 1 ? `Each brick is ${unit} lives. ` : ''}
        {count >= size ? 'Wall complete!' : `${size - count} more to finish this wall of ${size}.`}
      </Text>
    </View>
  );
}

export function GivingMeter({ impact }: { impact: ImpactSummary }) {
  const colors = useColors();
  const { totalGiven, givingTier, nextGivingTier, givingProgress } = impact;
  return (
    <View style={{ gap: Space.sm }}>
      <View style={styles.meterHead}>
        <Text style={[styles.big, { color: colors.success }]}>{formatMoney(totalGiven)}</Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {givingTier.emoji} {givingTier.name}
        </Text>
      </View>
      <ProgressBar value={givingProgress} color={colors.success} height={12} />
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
        {nextGivingTier
          ? `${formatMoney(nextGivingTier.min - totalGiven)} more to ${nextGivingTier.emoji} ${nextGivingTier.name}`
          : 'You’re a Community Pillar. Thank you!'}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
        Based on the amounts you reported after giving. Only you can see them.
      </Text>
    </View>
  );
}

/** One line for the public summary, following what the business or neighbor chose to show. */
export function givingSummary(
  display: GivingDisplay,
  total: number,
  supporters: number,
  goal: number | null | undefined
): string | null {
  const people = `${supporters.toLocaleString()} ${supporters === 1 ? 'neighbor' : 'neighbors'}`;
  switch (display) {
    case 'hidden':
      return null;
    case 'count':
      if (supporters === 0) return goal ? `Working toward a ${formatMoney(goal)} goal` : null;
      return `${people} ${supporters === 1 ? 'has' : 'have'} given${goal ? ` · goal ${formatMoney(goal)}` : ''}`;
    case 'amount':
      if (total === 0) return goal ? `Goal ${formatMoney(goal)}` : null;
      return `${formatMoney(total)} given${goal ? ` of ${formatMoney(goal)}` : ' through BuildBack'}`;
    default:
      if (supporters === 0 && total === 0) return goal ? `Goal ${formatMoney(goal)}` : null;
      return `${total > 0 ? `${formatMoney(total)} given by ` : ''}${people}${goal ? ` · goal ${formatMoney(goal)}` : ' through BuildBack'}`;
  }
}

/**
 * The public giving summary on a business or neighbor page, respecting their privacy choice.
 * The owner always sees their full totals, marked as only visible to them.
 */
export function CommunityGiving({
  total,
  supporters,
  goal,
  display = 'amount_and_count',
  isOwner = false,
}: {
  total: number;
  supporters: number;
  goal?: number | null;
  display?: GivingDisplay;
  isOwner?: boolean;
}) {
  const colors = useColors();
  const summary = givingSummary(display, total, supporters, goal);
  // A bar would reveal roughly how much was given, so only show it when the amount is public.
  const showBar = !!goal && (display === 'amount_and_count' || display === 'amount');
  const reached = showBar && !!goal && total >= goal;

  if (!summary && !isOwner) return null;
  return (
    <View style={{ gap: 6 }}>
      {summary ? (
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          💛 {summary}
          {reached ? <Text style={{ color: colors.success }}>  🎉 Goal reached!</Text> : null}
        </Text>
      ) : null}
      {showBar ? <ProgressBar value={total / goal!} color={colors.success} /> : null}
      {summary && display !== 'count' ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Amounts are reported by the people who gave.</Text>
      ) : null}
      {isOwner ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          🔒 Only you see this: {formatMoney(total)} from {supporters} {supporters === 1 ? 'supporter' : 'supporters'}
          {goal ? ` toward your ${formatMoney(goal)} goal` : ''}.
          {display === 'hidden' ? ' Your page keeps these private.' : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  brick: { height: 18, borderRadius: 4, overflow: 'hidden' },
  highlight: {
    position: 'absolute',
    top: 3,
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  meterHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  big: { fontSize: 32, fontWeight: '900' },
});

