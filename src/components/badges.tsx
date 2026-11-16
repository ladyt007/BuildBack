import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { BADGE_CATEGORIES, formatMoney, type Badge } from '@/lib/gamification';
import { Brand, Radius, Space } from '@/lib/theme';

import { ProgressBar } from './ui';

/** Ring colours by step in a ladder: bronze, silver, gold, diamond, then royal purple. */
const RINGS = ['#C47F3D', '#A7B0BC', Brand.gold, '#56C7E8', '#9B6BFF'];

function ringColor(badge: Badge): string {
  if (badge.category === 'community') return Brand.blue;
  return RINGS[Math.min(badge.rank, RINGS.length - 1)];
}

export function BadgeMedal({ badge }: { badge: Badge }) {
  const colors = useColors();
  const ring = ringColor(badge);
  const progress = Math.min(1, badge.current / badge.target);
  const count = badge.money
    ? `${formatMoney(Math.min(badge.current, badge.target))} of ${formatMoney(badge.target)}`
    : `${Math.min(badge.current, badge.target).toLocaleString()} of ${badge.target.toLocaleString()}`;

  return (
    <View
      accessibilityLabel={`${badge.name}: ${badge.description}. ${badge.earned ? 'Earned' : `Progress ${count}`}`}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: badge.earned ? ring : colors.border },
      ]}>
      <View
        style={[
          styles.medal,
          {
            borderColor: badge.earned ? ring : colors.border,
            backgroundColor: badge.earned ? `${ring}22` : colors.muted,
          },
        ]}>
        <Text style={[styles.emoji, !badge.earned && styles.locked]}>{badge.emoji}</Text>
        {badge.earned ? (
          <View style={[styles.check, { backgroundColor: ring, borderColor: colors.card }]}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {badge.name}
      </Text>
      <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
        {badge.description}
      </Text>
      {badge.earned ? (
        <Text style={[styles.earned, { color: colors.success }]}>Earned</Text>
      ) : (
        <View style={{ alignSelf: 'stretch', gap: 3 }}>
          <ProgressBar value={progress} color={ring} height={6} />
          <Text style={[styles.count, { color: colors.textSecondary }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

/** All badges, grouped into their ladders. */
export function BadgeCollection({ badges }: { badges: Badge[] }) {
  const colors = useColors();
  const earned = badges.filter((b) => b.earned).length;
  return (
    <View style={{ gap: Space.lg }}>
      <Text style={[styles.title, { color: colors.text }]}>
        Badges <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>{earned} of {badges.length}</Text>
      </Text>
      {BADGE_CATEGORIES.map((cat) => {
        const list = badges.filter((b) => b.category === cat.id);
        if (list.length === 0) return null;
        const got = list.filter((b) => b.earned).length;
        return (
          <View key={cat.id} style={{ gap: Space.sm }}>
            <View>
              <Text style={[styles.section, { color: colors.text }]}>
                {cat.title}{' '}
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                  {got}/{list.length}
                </Text>
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{cat.blurb}</Text>
            </View>
            <View style={styles.grid}>
              {list.map((b) => (
                <BadgeMedal key={b.id} badge={b} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900' },
  section: { fontSize: 17, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  card: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
    maxWidth: 180,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Space.sm,
    alignItems: 'center',
    gap: 4,
  },
  medal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emoji: { fontSize: 26 },
  locked: { opacity: 0.35 },
  check: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  name: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  desc: { fontSize: 11, textAlign: 'center' },
  earned: { fontSize: 12, fontWeight: '800' },
  count: { fontSize: 10, textAlign: 'center' },
});
