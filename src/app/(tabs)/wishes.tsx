import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { LocationBar } from '@/components/location-bar';
import { Body, Button, Card, EmptyState, Row, Screen, Title } from '@/components/ui';
import { backend } from '@/data';
import { groupWishes } from '@/data/shared';
import { useColors } from '@/hooks/use-colors';
import { businessCategory } from '@/lib/categories';
import { formatDistance } from '@/lib/geo';
import { shareLink } from '@/lib/links';
import { Radius, Space } from '@/lib/theme';
import type { Wish } from '@/lib/types';
import { useApp } from '@/state/app-state';

export default function WishesScreen() {
  const colors = useColors();
  const { place, radiusMiles, dataVersion, profile } = useApp();
  const [wishes, setWishes] = useState<Wish[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    backend.listWishes({ center: place, radiusMiles: place ? radiusMiles : null }).then((w) => {
      if (!cancelled) setWishes(w);
    });
    return () => {
      cancelled = true;
    };
  }, [place, radiusMiles, dataVersion]);

  const groups = useMemo(
    () => (wishes ? groupWishes(wishes, place, profile?.id ?? null) : []),
    [wishes, place, profile?.id]
  );
  const top = groups[0]?.count ?? 1;

  return (
    <Screen>
      <View style={{ gap: Space.xs }}>
        <Title>What’s missing?</Title>
        <Body muted>
          Tell us what your community needs — a barber, a grocery store, an Irish pub, anything. When enough neighbors
          ask, we show business owners and future entrepreneurs where they’re wanted.
        </Body>
      </View>

      <Link href="/wish/new" asChild>
        <Button label="Make a wish" icon="sparkles" variant="gold" />
      </Link>

      <LocationBar />

      {wishes === null ? (
        <ActivityIndicator style={{ marginTop: Space.xl }} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="sparkles-outline"
          title="No wishes here yet"
          message="Be the first to say what your community is missing."
        />
      ) : (
        <View style={{ gap: Space.md }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {place && radiusMiles !== null ? `MOST WANTED WITHIN ${radiusMiles} MILES` : 'MOST WANTED ACROSS THE COUNTRY'}
          </Text>
          {groups.slice(0, 40).map((g) => {
            const cat = businessCategory(g.category);
            return (
              <Card key={g.key}>
                <Row>
                  <View style={[styles.icon, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.kind, { color: colors.text }]}>{g.kind}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {g.placeLabel}
                      {g.distanceMiles !== null ? ` · ${formatDistance(g.distanceMiles)}` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.count, { color: colors.primary }]}>{g.count}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {g.count === 1 ? 'neighbor' : 'neighbors'}
                    </Text>
                  </View>
                </Row>
                <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                  <View style={[styles.barFill, { width: `${(g.count / top) * 100}%`, backgroundColor: cat.color }]} />
                </View>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {g.wishedByMe ? '✅ You wished for this' : 'Want this too?'}
                  </Text>
                  <Row>
                    {!g.wishedByMe ? (
                      <Link href={{ pathname: '/wish/new', params: { kind: g.kind, category: g.category } }} asChild>
                        <Button label="+1" small variant="secondary" />
                      </Link>
                    ) : null}
                    <Button
                      label="Share"
                      icon="share-outline"
                      small
                      variant="ghost"
                      onPress={() =>
                        shareLink('/wishes', `${g.count} neighbors near ${g.placeLabel} want ${/^[aeiou]/i.test(g.kind) ? 'an' : 'a'} ${g.kind}. Add your voice on BuildBack!`)
                      }
                    />
                  </Row>
                </Row>
              </Card>
            );
          })}
          <Card style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent }}>
            <Text style={[styles.kind, { color: colors.text }]}>Thinking of opening a business?</Text>
            <Body>
              These wishes are real demand. List your business and we’ll let neighbors who asked for it know you’re here.
            </Body>
            <Link href="/business/new" asChild>
              <Button label="List a business" icon="storefront" small style={{ alignSelf: 'flex-start' }} />
            </Link>
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  kind: { fontSize: 17, fontWeight: '700' },
  count: { fontSize: 24, fontWeight: '900' },
  barTrack: { height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.pill },
});
