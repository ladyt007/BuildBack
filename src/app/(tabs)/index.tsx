import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BusinessCard, CommunityBanner, MyProgressStrip, SponsorCard } from '@/components/cards';
import { LocationBar } from '@/components/location-bar';
import { Body, Button, Card, Chip, EmptyState, Row, Screen } from '@/components/ui';
import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { BUSINESS_CATEGORIES, OWNERSHIP_TAGS } from '@/lib/categories';
import { Config, isDemoMode } from '@/lib/config';
import { openExternal } from '@/lib/links';
import { Radius, Space } from '@/lib/theme';
import type { Business, Sponsor } from '@/lib/types';
import { useApp } from '@/state/app-state';

type Filter = { kind: 'all' } | { kind: 'following' } | { kind: 'category'; id: string };

export default function BusinessesScreen() {
  const colors = useColors();
  const { place, radiusMiles, activity, profile, dataVersion } = useApp();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [fellBackToNationwide, setFellBack] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const area = { center: place, radiusMiles: place ? radiusMiles : null };
      let list = await backend.listBusinesses(area);
      let fell = false;
      // Nothing nearby yet? Show every participating business instead.
      if (list.length === 0 && area.radiusMiles !== null) {
        list = await backend.listBusinesses({ center: place, radiusMiles: null });
        fell = true;
      }
      const s = await backend.listSponsors(area);
      if (!cancelled) {
        setBusinesses(list);
        setFellBack(fell);
        setSponsors(s);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [place, radiusMiles, dataVersion]);

  const visible = useMemo(() => {
    if (!businesses) return [];
    const q = query.trim().toLowerCase();
    return businesses.filter((b) => {
      if (filter.kind === 'following' && !activity.followingIds.includes(b.id)) return false;
      if (filter.kind === 'category' && b.category !== filter.id) return false;
      if (tag && !b.ownershipTags.includes(tag)) return false;
      if (q && !`${b.name} ${b.kind} ${b.city} ${b.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [businesses, filter, tag, query, activity.followingIds]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          <View>
            <Text style={[styles.brand, { color: colors.text }]}>BuildBack</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              One store at a time. One person at a time.
            </Text>
          </View>
        </Row>
      </Row>

      {isDemoMode ? (
        <View style={[styles.demo, { backgroundColor: colors.accentSoft }]}>
          <Text style={{ color: colors.text, fontSize: 13 }}>
            👋 Preview mode — these are sample businesses. Everything you do is saved on this device only.
          </Text>
        </View>
      ) : null}

      {!profile ? (
        <Card style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent }}>
          <Text style={[styles.joinTitle, { color: colors.text }]}>Join the movement 🧱</Text>
          <Body>Follow local businesses, help neighbors and tell us what your community is missing.</Body>
          <Link href="/auth?mode=signup" asChild>
            <Button label="Become a Builder" variant="primary" />
          </Link>
        </Card>
      ) : (
        <MyProgressStrip />
      )}

      <CommunityBanner />

      <LocationBar />

      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          placeholder="Search barbers, bakeries, Irish pubs…"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: colors.text }]}
          accessibilityLabel="Search businesses"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" selected={filter.kind === 'all'} onPress={() => setFilter({ kind: 'all' })} />
        <Chip
          label="Following"
          icon="heart"
          selected={filter.kind === 'following'}
          onPress={() => setFilter({ kind: 'following' })}
        />
        {BUSINESS_CATEGORIES.filter((c) => c.id !== 'other').map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            icon={c.icon}
            selected={filter.kind === 'category' && filter.id === c.id}
            onPress={() => setFilter({ kind: 'category', id: c.id })}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {OWNERSHIP_TAGS.map((t) => (
          <Chip key={t} label={t} selected={tag === t} onPress={() => setTag(tag === t ? null : t)} />
        ))}
      </ScrollView>

      {fellBackToNationwide ? (
        <Card>
          <Text style={[styles.joinTitle, { color: colors.text }]}>No BuildBack businesses near you yet</Text>
          <Body muted>
            Here’s the whole BuildBack community instead. Know a business that belongs here, or wish one existed?
          </Body>
          <Row style={{ flexWrap: 'wrap' }}>
            <Link href="/wish/new" asChild>
              <Button label="Make a wish" icon="sparkles" variant="gold" small />
            </Link>
            <Link href="/business/new" asChild>
              <Button label="List a business" icon="add" variant="secondary" small />
            </Link>
          </Row>
        </Card>
      ) : null}

      {businesses === null ? (
        <ActivityIndicator style={{ marginTop: Space.xl }} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={filter.kind === 'following' ? 'heart-outline' : 'storefront-outline'}
          title={filter.kind === 'following' ? 'You’re not following anyone yet' : 'No matches'}
          message={
            filter.kind === 'following'
              ? 'Tap the heart on any business to see their updates here.'
              : 'Try a wider area or a different filter.'
          }
        />
      ) : (
        <View style={{ gap: Space.md }}>
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {visible.length} {visible.length === 1 ? 'business' : 'businesses'}
            {place && !fellBackToNationwide && radiusMiles !== null ? ` within ${radiusMiles} miles` : ' across the country'}
          </Text>
          {visible.map((b, i) => (
            <View key={b.id} style={{ gap: Space.md }}>
              <BusinessCard business={b} center={place} />
              {sponsors.length > 0 && (i + 1) % Config.sponsorEvery === 0 ? (
                <SponsorCard
                  sponsor={sponsors[Math.floor(i / Config.sponsorEvery) % sponsors.length]}
                  onPress={() => openExternal(sponsors[Math.floor(i / Config.sponsorEvery) % sponsors.length].url)}
                />
              ) : null}
            </View>
          ))}
          <Card style={{ alignItems: 'center' }}>
            <Body style={{ textAlign: 'center' }}>Own a business? Get found by neighbors looking for you.</Body>
            <Link href="/business/new" asChild>
              <Button label="List your business — it’s free" icon="storefront" small />
            </Link>
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 44, height: 44, borderRadius: 12 },
  brand: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  tagline: { fontSize: 13 },
  demo: { borderRadius: Radius.sm, padding: Space.sm },
  joinTitle: { fontSize: 18, fontWeight: '800' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Space.lg,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  chips: { gap: Space.sm, paddingRight: Space.lg },
  count: { fontSize: 13, fontWeight: '600' },
});
