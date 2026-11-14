import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isFeatured } from '@/data/shared';
import { useColors } from '@/hooks/use-colors';
import { businessCategory, neighborNeed } from '@/lib/categories';
import { distanceMiles, formatDistance } from '@/lib/geo';
import { Brand, Radius, Space } from '@/lib/theme';
import type { Business, BusinessStatus, LatLng, NeighborRequest, Sponsor } from '@/lib/types';
import { useApp } from '@/state/app-state';

import { Initials, Pill, ProgressBar } from './ui';

export const STATUS_LABEL: Record<BusinessStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: Brand.green },
  reopening: { label: 'Reopening', color: Brand.blue },
  struggling: { label: 'Needs support', color: '#D97706' },
  temporarily_closed: { label: 'Temporarily closed', color: '#6B7280' },
};

export function BusinessCard({ business, center }: { business: Business; center: LatLng | null }) {
  const colors = useColors();
  const { activity, toggleFollow } = useApp();
  const cat = businessCategory(business.category);
  const following = activity.followingIds.includes(business.id);
  const featured = isFeatured(business);
  const status = STATUS_LABEL[business.status];

  return (
    <Link href={`/business/${business.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: featured ? colors.accent : colors.border,
            borderWidth: featured ? 2 : StyleSheet.hairlineWidth,
            opacity: pressed ? 0.9 : 1,
          },
        ]}>
        {featured ? (
          <View style={[styles.featuredRibbon, { backgroundColor: colors.accent }]}>
            <Ionicons name="star" size={11} color="#1C1717" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          {business.imageUrl ? (
            <Image source={{ uri: business.imageUrl }} style={styles.thumb} contentFit="cover" />
          ) : (
            <Initials name={business.name} color={cat.color} />
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {business.name}
              {business.isPro ? '  ' : ''}
              {business.isPro ? <Ionicons name="checkmark-circle" size={15} color={colors.primary} /> : null}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {business.kind} · {business.city}, {business.state}
              {center ? ` · ${formatDistance(distanceMiles(center, business))}` : ''}
            </Text>
          </View>
          <Pressable
            hitSlop={10}
            accessibilityLabel={following ? `Unfollow ${business.name}` : `Follow ${business.name}`}
            onPress={(e) => {
              e.preventDefault();
              toggleFollow(business.id);
            }}>
            <Ionicons name={following ? 'heart' : 'heart-outline'} size={24} color={following ? Brand.red : colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[styles.desc, { color: colors.text }]} numberOfLines={2}>
          {business.description}
        </Text>
        <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
          <Pill label={status.label} color={status.color} />
          {business.ownershipTags.slice(0, 2).map((t) => (
            <Pill key={t} label={t} color={colors.muted} textColor={colors.text} />
          ))}
          {business.supporterCount > 0 ? (
            <Text style={[styles.meta, { color: colors.textSecondary, marginLeft: 'auto' }]}>
              💛 {business.supporterCount} supporters
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

export function NeighborCard({ neighbor, center }: { neighbor: NeighborRequest; center: LatLng | null }) {
  const colors = useColors();
  const need = neighborNeed(neighbor.need);
  return (
    <Link href={`/neighbor/${neighbor.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
        ]}>
        <View style={styles.row}>
          <View style={[styles.needIcon, { backgroundColor: need.color }]}>
            <Ionicons name={need.icon} size={24} color="#fff" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {neighbor.title}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {need.label} · {neighbor.city}, {neighbor.state}
              {center ? ` · ${formatDistance(distanceMiles(center, neighbor))}` : ''}
            </Text>
          </View>
        </View>
        <Text style={[styles.desc, { color: colors.text }]} numberOfLines={2}>
          {neighbor.story}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          💛 {neighbor.supporterCount} {neighbor.supporterCount === 1 ? 'neighbor has' : 'neighbors have'} helped
          {neighbor.goalAmount ? ` · Goal $${neighbor.goalAmount.toLocaleString()}` : ''}
        </Text>
      </Pressable>
    </Link>
  );
}

export function SponsorCard({ sponsor, onPress }: { sponsor: Sponsor; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.accentSoft, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}>
      <Text style={[styles.sponsorLabel, { color: colors.textSecondary }]}>COMMUNITY SPONSOR</Text>
      <Text style={[styles.name, { color: colors.text }]}>{sponsor.name}</Text>
      <Text style={[styles.desc, { color: colors.text }]}>{sponsor.tagline}</Text>
    </Pressable>
  );
}

export function CommunityBanner() {
  const { stats } = useApp();
  if (!stats) return null;
  const items = [
    { n: stats.businessesHelped, label: 'businesses\nhelped' },
    { n: stats.neighborsHelped, label: 'neighbors\nhelped' },
    { n: stats.members, label: 'builders\njoined' },
    { n: stats.wishes, label: 'wishes\nshared' },
  ];
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>Together we’ve built back</Text>
      <View style={styles.bannerRow}>
        {items.map((i) => (
          <View key={i.label} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.bannerNumber}>{i.n.toLocaleString()}</Text>
            <Text style={styles.bannerLabel}>{i.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MyProgressStrip() {
  const colors = useColors();
  const { impact, profile } = useApp();
  if (!profile) return null;
  return (
    <Link href="/impact" asChild>
      <Pressable style={StyleSheet.flatten([styles.card, { backgroundColor: colors.card, borderColor: colors.border }])}>
        <View style={styles.row}>
          <Text style={{ fontSize: 26 }}>{impact.level.emoji}</Text>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[styles.name, { color: colors.text }]}>
              {impact.level.name} · {impact.points} pts
            </Text>
            <ProgressBar value={impact.progress} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              You’ve helped {impact.businessesHelped} {impact.businessesHelped === 1 ? 'business' : 'businesses'} and{' '}
              {impact.neighborsHelped} {impact.neighborsHelped === 1 ? 'neighbor' : 'neighbors'}
              {impact.nextLevel ? ` · ${impact.nextLevel.min - impact.points} pts to ${impact.nextLevel.name}` : ''}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.md, padding: Space.lg, gap: Space.sm, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  thumb: { width: 52, height: 52, borderRadius: 16 },
  name: { fontSize: 17, fontWeight: '700' },
  meta: { fontSize: 13 },
  desc: { fontSize: 15, lineHeight: 21 },
  needIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  featuredRibbon: {
    position: 'absolute',
    top: -1,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  featuredText: { fontSize: 11, fontWeight: '800', color: '#1C1717' },
  sponsorLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  banner: {
    borderRadius: Radius.lg,
    padding: Space.lg,
    gap: Space.md,
    backgroundColor: Brand.blue,
  },
  bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bannerNumber: { color: Brand.gold, fontSize: 24, fontWeight: '900' },
  bannerLabel: { color: '#E4E7FF', fontSize: 12, textAlign: 'center' },
});
