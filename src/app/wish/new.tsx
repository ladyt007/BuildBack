import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { PlaceField } from '@/components/place-field';
import { Body, Button, Chip, Field, Screen } from '@/components/ui';
import { useColors } from '@/hooks/use-colors';
import { BUSINESS_CATEGORIES, businessCategory } from '@/lib/categories';
import { Space } from '@/lib/theme';
import type { Place } from '@/lib/types';
import { useApp } from '@/state/app-state';

export default function MakeWishScreen() {
  const params = useLocalSearchParams<{ kind?: string; category?: string }>();
  const colors = useColors();
  const { ready, profile, place: myPlace, requireAccount, addWish } = useApp();
  const [category, setCategory] = useState(params.category ?? 'beauty');
  const [kind, setKind] = useState(params.kind ?? '');
  const [note, setNote] = useState('');
  const [placeInput, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && !profile) requireAccount('Create a free account to tell us what your community is missing.', { leaveIfDismissed: true });
  }, [ready, profile, requireAccount]);

  // Default to the person's area until they change it.
  const place = placeInput ?? myPlace;

  async function submit() {
    setError(null);
    if (kind.trim().length < 2) return setError('What kind of place do you wish was here?');
    if (!place) return setError('Please add your ZIP code so we know where.');
    setSaving(true);
    try {
      await addWish({
        category,
        kind: kind.trim(),
        note: note.trim() || null,
        lat: place.lat,
        lng: place.lng,
        placeLabel: place.label,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  const examples = businessCategory(category).examples;

  return (
    <Screen edges={[]}>
      <Body muted>
        What do you wish was in your community? Any kind of business counts. We’ll add your voice to your neighbors’ and
        show business owners where they’re needed.
      </Body>

      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {BUSINESS_CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} icon={c.icon} selected={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </View>
      </View>

      <Field label="I wish there was a…" value={kind} onChangeText={setKind} placeholder="Black-owned barber shop, Irish pub, bookstore…" maxLength={80} />
      {examples.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {examples.map((e) => (
            <Chip key={e} label={e} selected={kind === e} onPress={() => setKind(e)} />
          ))}
        </View>
      ) : null}

      <Field
        label="Anything else? (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="I drive 35 miles to get my hair done…"
        multiline
        maxLength={300}
      />
      <PlaceField label="Where?" value={place} onChange={setPlace} />

      {error ? <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text> : null}
      <Button label="Send my wish ✨" variant="gold" onPress={submit} loading={saving} />
    </Screen>
  );
}
