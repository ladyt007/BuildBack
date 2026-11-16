import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { CoverPhotoField, GalleryField } from '@/components/photos';
import { PlaceField, splitPlaceLabel } from '@/components/place-field';
import { Body, Button, Chip, Field, Screen } from '@/components/ui';
import { backend, type NewBusiness } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { BUSINESS_CATEGORIES, OWNERSHIP_TAGS, businessCategory } from '@/lib/categories';
import { looksLikeUrl } from '@/lib/links';
import { Space } from '@/lib/theme';
import type { BusinessStatus, Place } from '@/lib/types';
import { useApp } from '@/state/app-state';

const STATUSES: { id: BusinessStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'reopening', label: 'Reopening soon' },
  { id: 'struggling', label: 'Open, but needs support' },
  { id: 'temporarily_closed', label: 'Temporarily closed' },
];

export default function BusinessFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const colors = useColors();
  const { ready, profile, requireAccount, touch, listBusiness } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('beauty');
  const [kind, setKind] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [status, setStatus] = useState<BusinessStatus>('open');
  const [supportUrl, setSupportUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && !profile) requireAccount('Create a free account to list your business so neighbors can find and support you.', { leaveIfDismissed: true });
  }, [ready, profile, requireAccount]);

  useEffect(() => {
    if (!id) return;
    backend.getBusiness(id).then((b) => {
      if (!b) return;
      setName(b.name);
      setCategory(b.category);
      setKind(b.kind);
      setTags(b.ownershipTags);
      setDescription(b.description);
      setImageUrl(b.imageUrl);
      setPhotos(b.photos ?? []);
      setPlace({ lat: b.lat, lng: b.lng, label: `${b.city}, ${b.state}` });
      setStatus(b.status);
      setSupportUrl(b.supportUrl ?? '');
      setWebsite(b.website ?? '');
      setPhone(b.phone ?? '');
    });
  }, [id]);

  async function save() {
    setError(null);
    if (!name.trim()) return setError('Please add your business name.');
    if (!kind.trim()) return setError('Tell people what kind of business it is.');
    if (!place) return setError('Please add your location so neighbors can find you.');
    if (supportUrl && !looksLikeUrl(supportUrl)) return setError('Your support link should start with https://');
    if (website && !looksLikeUrl(website)) return setError('Your website should start with https://');
    const { city, state } = splitPlaceLabel(place.label);
    const input: NewBusiness = {
      name: name.trim(),
      category,
      kind: kind.trim(),
      ownershipTags: tags,
      description: description.trim(),
      city,
      state,
      // Rounded so a home-based business doesn't reveal a home address.
      lat: Math.round(place.lat * 200) / 200,
      lng: Math.round(place.lng * 200) / 200,
      status,
      supportUrl: supportUrl.trim() || null,
      website: website.trim() || null,
      phone: phone.trim() || null,
      imageUrl,
      photos,
    };
    setSaving(true);
    try {
      if (editing) {
        await backend.updateBusiness(id!, input);
        touch();
        router.back();
      } else {
        const b = await listBusiness(input);
        router.replace(`/business/${b.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  const examples = businessCategory(category).examples;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: editing ? 'Edit listing' : 'List a business' }} />
      {!editing ? (
        <Body muted>
          Listing is free. Any kind of business is welcome. Neighbors can follow you, see your updates and support you
          directly.
        </Body>
      ) : null}

      <Field label="Business name" value={name} onChangeText={setName} placeholder="Fresh Fade Barbershop" />

      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {BUSINESS_CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} icon={c.icon} selected={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </View>
      </View>

      <Field label="What kind of business?" value={kind} onChangeText={setKind} placeholder={examples[0] ?? 'Describe it in a few words'} />
      {examples.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {examples.map((e) => (
            <Chip key={e} label={e} selected={kind === e} onPress={() => setKind(e)} />
          ))}
        </View>
      ) : null}

      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Ownership (optional)</Text>
        <Body muted style={{ fontSize: 13 }}>Helps people who want to support businesses like yours find you.</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {OWNERSHIP_TAGS.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={tags.includes(t)}
              onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}
            />
          ))}
        </View>
      </View>

      <Field
        label="About your business"
        value={description}
        onChangeText={setDescription}
        placeholder="What you offer, your story, what makes you special"
        multiline
        maxLength={600}
      />

      <CoverPhotoField value={imageUrl} onChange={setImageUrl} />
      <GalleryField value={photos} onChange={setPhotos} />

      <PlaceField label="Location" value={place} onChange={setPlace} hint="We show your city and approximate distance, not your street address." />

      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>How’s business?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {STATUSES.map((s) => (
            <Chip key={s.id} label={s.label} selected={status === s.id} onPress={() => setStatus(s.id)} />
          ))}
        </View>
      </View>

      <Field
        label="Your support link (optional)"
        value={supportUrl}
        onChangeText={setSupportUrl}
        placeholder="https://"
        autoCapitalize="none"
        keyboardType="url"
        hint="A Stripe, PayPal, Cash App, Venmo or GoFundMe link. Gifts go straight to you — BuildBack never touches the money."
      />
      <Field label="Website (optional)" value={website} onChangeText={setWebsite} placeholder="https://" autoCapitalize="none" keyboardType="url" />
      <Field label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="(478) 555-0123" keyboardType="phone-pad" />

      {error ? <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text> : null}
      <Button label={editing ? 'Save changes' : 'Publish my business'} onPress={save} loading={saving} />
    </Screen>
  );
}
