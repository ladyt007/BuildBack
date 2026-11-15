import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { CoverPhotoField } from '@/components/photos';
import { PlaceField, splitPlaceLabel } from '@/components/place-field';
import { Body, Button, Card, Chip, Field, Screen } from '@/components/ui';
import { useColors } from '@/hooks/use-colors';
import { BUSINESS_CATEGORIES, OWNERSHIP_TAGS, businessCategory } from '@/lib/categories';
import { looksLikeUrl } from '@/lib/links';
import { Space } from '@/lib/theme';
import type { NominatorRelationship, Place } from '@/lib/types';
import { useApp } from '@/state/app-state';

const RELATIONSHIPS: { id: NominatorRelationship; label: string }[] = [
  { id: 'customer', label: 'I’m a customer' },
  { id: 'neighbor', label: 'It’s in my neighborhood' },
  { id: 'friend_family', label: 'Friend or family of the owner' },
  { id: 'employee', label: 'I work there' },
  { id: 'other', label: 'Other' },
];

export default function NominateScreen() {
  const colors = useColors();
  const { ready, profile, place: myPlace, requireAccount, nominate } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('food');
  const [kind, setKind] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [relationship, setRelationship] = useState<NominatorRelationship>('customer');
  const [placeInput, setPlace] = useState<Place | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSocial, setContactSocial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const place = placeInput ?? myPlace;

  useEffect(() => {
    if (ready && !profile) {
      requireAccount('Create a free account to nominate a business you love. You’ll earn points and the Talent Scout badge.', {
        leaveIfDismissed: true,
      });
    }
  }, [ready, profile, requireAccount]);

  async function submit() {
    setError(null);
    if (!name.trim()) return setError('What’s the business called?');
    if (!kind.trim()) return setError('What kind of business is it?');
    if (!place) return setError('Where is it? Add a ZIP code.');
    if (reason.trim().length < 15) return setError('Tell neighbors a little about why you love it.');
    if (website && !looksLikeUrl(website)) return setError('The website should start with https://');
    if (!contactEmail.trim() && !contactPhone.trim() && !contactSocial.trim()) {
      return setError('Add at least one way for us to reach the owner (email, phone or social media).');
    }
    const { city, state } = splitPlaceLabel(place.label);
    setSaving(true);
    try {
      const business = await nominate({
        name: name.trim(),
        category,
        kind: kind.trim(),
        ownershipTags: tags,
        description: reason.trim(),
        city,
        state,
        lat: Math.round(place.lat * 200) / 200,
        lng: Math.round(place.lng * 200) / 200,
        website: website.trim() || null,
        phone: null,
        imageUrl,
        photos: [],
        relationship,
        reason: reason.trim(),
        contactName: contactName.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactSocial: contactSocial.trim() || null,
      });
      router.replace(`/business/${business.id}`);
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
        Know a business that deserves to be found? Add it here. Our team reviews every nomination, then reaches out so
        the owner can claim their free listing.
      </Body>

      <Field label="Business name" value={name} onChangeText={setName} placeholder="Auntie Pearl’s Hot Tamales" />

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

      <PlaceField label="Where is it?" value={place} onChange={setPlace} />

      <Field
        label="Why do you love it?"
        value={reason}
        onChangeText={setReason}
        placeholder="People drive in from two towns over for her tamales…"
        multiline
        maxLength={600}
        hint="This is shown on the listing until the owner claims it and writes their own."
      />

      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>How do you know this business?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {RELATIONSHIPS.map((r) => (
            <Chip key={r.id} label={r.label} selected={relationship === r.id} onPress={() => setRelationship(r.id)} />
          ))}
        </View>
      </View>

      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Ownership (optional, if you know)</Text>
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

      <CoverPhotoField value={imageUrl} onChange={setImageUrl} />
      <Field label="Their website (optional)" value={website} onChangeText={setWebsite} placeholder="https://" autoCapitalize="none" keyboardType="url" />

      <Card style={{ borderColor: colors.accent }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>🔒 How can we reach the owner?</Text>
        <Body muted style={{ fontSize: 13 }}>
          Private — only the BuildBack team sees this. We use it once to invite them to claim their listing. Please use
          the business’s public contact details.
        </Body>
        <Field label="Owner’s name (if you know it)" value={contactName} onChangeText={setContactName} placeholder="Pearl Johnson" />
        <Field
          label="Business email"
          value={contactEmail}
          onChangeText={setContactEmail}
          placeholder="hello@business.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field label="Business phone" value={contactPhone} onChangeText={setContactPhone} placeholder="(478) 555-0117" keyboardType="phone-pad" />
        <Field
          label="Instagram, Facebook or other"
          value={contactSocial}
          onChangeText={setContactSocial}
          placeholder="@business"
          autoCapitalize="none"
        />
      </Card>

      {error ? <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text> : null}
      <Button label="Nominate this business 🔭" variant="gold" onPress={submit} loading={saving} />
    </Screen>
  );
}
