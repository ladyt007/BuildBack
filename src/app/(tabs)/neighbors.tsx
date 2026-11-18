import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { NeighborCard } from '@/components/cards';
import { LocationBar } from '@/components/location-bar';
import { Body, Button, Card, EmptyState, Screen, Title } from '@/components/ui';
import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { Space } from '@/lib/theme';
import type { NeighborRequest } from '@/lib/types';
import { useApp } from '@/state/app-state';

export default function NeighborsScreen() {
  const colors = useColors();
  const { place, radiusMiles, dataVersion, activity } = useApp();
  const [items, setItems] = useState<NeighborRequest[] | null>(null);
  const [fellBack, setFellBack] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const area = { center: place, radiusMiles: place ? radiusMiles : null };
      let list = await backend.listNeighbors(area);
      let fell = false;
      if (list.length === 0 && area.radiusMiles !== null) {
        list = await backend.listNeighbors({ center: place, radiusMiles: null });
        fell = true;
      }
      if (!cancelled) {
        setItems(list);
        setFellBack(fell);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [place, radiusMiles, dataVersion]);

  return (
    <Screen>
      <View style={{ gap: Space.xs }}>
        <Title>Build Our Neighbors</Title>
        <Body muted>
          Real people in our communities going through a hard time. Every request is reviewed by the BuildBack team
          before it appears here. Gifts go straight to the person’s own fundraiser.
        </Body>
      </View>

      <Card style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Going through something?</Text>
        <Body>You don’t have to carry it alone. Share your story and let your community lift you up.</Body>
        <Link href="/neighbor/new" asChild>
          <Button label="Ask for help" icon="hand-left" variant="primary" small style={{ alignSelf: 'flex-start' }} />
        </Link>
      </Card>

      <LocationBar />

      {fellBack ? <Body muted>No requests near you right now — here are neighbors across the country.</Body> : null}

      {items === null ? (
        <ActivityIndicator style={{ marginTop: Space.xl }} />
      ) : items.length === 0 ? (
        <EmptyState icon="heart-outline" title="No open requests" message="Check back soon." />
      ) : (
        <View style={{ gap: Space.md }}>
          {items.filter((n) => !activity.blockedUserIds.includes(n.ownerId)).map((n) => (
            <NeighborCard key={n.id} neighbor={n} center={place} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 18, fontWeight: '800' },
});
