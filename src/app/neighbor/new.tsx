import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { useCelebrate } from '@/components/celebration';
import { PlaceField, splitPlaceLabel } from '@/components/place-field';
import { Body, Button, Card, Chip, Field, Screen } from '@/components/ui';
import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { NEIGHBOR_NEEDS } from '@/lib/categories';
import { looksLikeUrl } from '@/lib/links';
import { Space } from '@/lib/theme';
import type { Place } from '@/lib/types';
import { useApp } from '@/state/app-state';

export default function AskForHelpScreen() {
  const colors = useColors();
  const celebrate = useCelebrate();
  const { ready, profile, place: myPlace, requireAccount, touch } = useApp();
  const [firstNameInput, setFirstName] = useState<string | null>(null);
  const [need, setNeed] = useState('rent');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [goal, setGoal] = useState('');
  const [link, setLink] = useState('');
  const [placeInput, setPlace] = useState<Place | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && !profile) requireAccount();
  }, [ready, profile, requireAccount]);

  // Default to the person's name and area until they change them.
  const firstName = firstNameInput ?? profile?.displayName.split(' ')[0] ?? '';
  const place = placeInput ?? myPlace;

  async function submit() {
    setError(null);
    if (!firstName.trim()) return setError('Please add your first name (or your family’s name).');
    if (title.trim().length < 8) return setError('Give your request a short title.');
    if (story.trim().length < 40) return setError('Share a little more of your story (at least a few sentences).');
    if (!looksLikeUrl(link)) return setError('Please add the link to your fundraiser (it should start with https://).');
    if (!place) return setError('Please add your ZIP code.');
    if (!agreed) return setError('Please confirm the statement below.');
    const { city, state } = splitPlaceLabel(place.label);
    const parsedGoal = parseFloat(goal.replace(/[^0-9.]/g, ''));
    setSaving(true);
    try {
      await backend.createNeighborRequest({
        firstName: firstName.trim(),
        title: title.trim(),
        story: story.trim(),
        need,
        goalAmount: Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : null,
        fundraiserUrl: link.trim(),
        city,
        state,
        // Only the general area is stored.
        lat: Math.round(place.lat * 50) / 50,
        lng: Math.round(place.lng * 50) / 50,
      });
      touch();
      router.back();
      celebrate({
        style: 'confetti',
        emoji: '💛',
        title: 'Your request was sent',
        message:
          'Asking for help takes courage. Our team will review your request (usually within a day) and you’ll see it on your profile once it’s live.',
        cta: 'Thank you',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={[]}>
      <Body muted>
        Share what you’re going through and link to your own fundraiser (GoFundMe, Cash App, PayPal, etc.). Gifts go
        straight to you. A BuildBack team member reviews every request before it’s shared, to keep the community safe.
      </Body>

      <Field label="First name (or family name)" value={firstName} onChangeText={setFirstName} placeholder="Denise" />

      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>What do you need help with?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {NEIGHBOR_NEEDS.map((n) => (
            <Chip key={n.id} label={n.label} icon={n.icon} selected={need === n.id} onPress={() => setNeed(n.id)} />
          ))}
        </View>
      </View>

      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Help me keep my home after surgery" maxLength={90} />
      <Field
        label="Your story"
        value={story}
        onChangeText={setStory}
        placeholder="What happened, what you need, and how it will help."
        multiline
        maxLength={2000}
      />
      <Field label="Goal (optional)" value={goal} onChangeText={setGoal} placeholder="$1,500" keyboardType="decimal-pad" />
      <Field
        label="Link to your fundraiser"
        value={link}
        onChangeText={setLink}
        placeholder="https://gofund.me/…"
        autoCapitalize="none"
        keyboardType="url"
        hint="Don't have one yet? GoFundMe and similar sites take a few minutes to set up."
      />
      <PlaceField label="Your ZIP code" value={place} onChange={setPlace} hint="Only your city is shown — never your address." />

      <Card>
        <Chip
          label={agreed ? '✓ I confirm' : 'Tap to confirm'}
          selected={agreed}
          onPress={() => setAgreed(!agreed)}
        />
        <Body style={{ fontSize: 13 }}>
          Everything I’ve shared is true, the fundraiser belongs to me or my family, and I understand BuildBack may ask
          for more information or decline a request.
        </Body>
      </Card>

      {error ? <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text> : null}
      <Button label="Send for review" onPress={submit} loading={saving} />
    </Screen>
  );
}
