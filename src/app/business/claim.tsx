import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useCelebrate } from '@/components/celebration';
import { Body, Button, Card, Chip, EmptyState, Field, Screen, Title } from '@/components/ui';
import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { Space } from '@/lib/theme';
import type { Business } from '@/lib/types';
import { useApp } from '@/state/app-state';

const ROLES = ['Owner', 'Co-owner', 'Manager'];

export default function ClaimScreen() {
  const { id, code: codeParam } = useLocalSearchParams<{ id: string; code?: string }>();
  const colors = useColors();
  const celebrate = useCelebrate();
  const { ready, profile, requireAccount, touch } = useApp();

  const [business, setBusiness] = useState<Business | null | undefined>(undefined);
  const [nameInput, setName] = useState<string | null>(null);
  const [role, setRole] = useState('Owner');
  const [emailInput, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [code, setCode] = useState(codeParam ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const claimantName = nameInput ?? profile?.displayName ?? '';
  const email = emailInput ?? profile?.email ?? '';

  useEffect(() => {
    backend.getBusiness(id).then(setBusiness);
  }, [id]);

  useEffect(() => {
    if (ready && !profile) {
      requireAccount('Create a free account (or sign in) to claim your business. It takes less than a minute.');
    }
  }, [ready, profile, requireAccount]);

  async function submit() {
    setError(null);
    if (!profile) {
      requireAccount('Create a free account (or sign in) to claim your business.');
      return;
    }
    if (!claimantName.trim()) return setError('Please add your name.');
    if (!email.includes('@')) return setError('Please add an email we can reach you at.');
    setSaving(true);
    try {
      const result = await backend.claimBusiness(id, {
        claimantName: claimantName.trim(),
        role,
        email: email.trim(),
        phone: phone.trim() || null,
        note: note.trim() || null,
        code: code.trim() || null,
      });
      touch();
      if (result === 'claimed') {
        router.replace(`/business/${id}`);
        celebrate({
          style: 'confetti',
          emoji: '🔑',
          title: `${business?.name ?? 'Your business'} is yours!`,
          message:
            'Welcome to BuildBack. Add your photos, your story and a support link, and post an update to say hello to the neighbors who nominated you.',
          cta: 'Set up my listing',
        });
      } else {
        router.back();
        celebrate({
          style: 'confetti',
          emoji: '📨',
          title: 'Claim received',
          message:
            'Our team will verify that you run this business, usually within 1–2 days, using the contact details on file. We’ll let you know as soon as it’s yours.',
          cta: 'Sounds good',
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (business === undefined) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (business === null || business.claimStatus !== 'unclaimed') {
    return (
      <Screen edges={[]}>
        <EmptyState
          icon="key-outline"
          title="This listing can’t be claimed"
          message="It may already belong to its owner. If you think that’s a mistake, email support@buildback.app."
        />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <View style={{ gap: Space.xs }}>
        <Title>Claim {business.name}</Title>
        <Body muted>
          Neighbors nominated your business on BuildBack. Claim it for free to add your own photos and story, post
          updates, and let customers support you directly.
        </Body>
      </View>

      <Card style={{ borderColor: colors.accent }}>
        <Text style={{ color: colors.text, fontWeight: '800' }}>Got an invite code?</Text>
        <Body muted style={{ fontSize: 13 }}>
          It’s in the message we sent to your business. With it, the listing is yours right away. No code? Leave it blank
          and our team will verify you.
        </Body>
        <Field label="Invite code" value={code} onChangeText={setCode} placeholder="ABC123" autoCapitalize="characters" maxLength={12} />
      </Card>

      <Field label="Your name" value={claimantName} onChangeText={setName} placeholder="Pearl Johnson" />
      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Your role</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {ROLES.map((r) => (
            <Chip key={r} label={r} selected={role === r} onPress={() => setRole(r)} />
          ))}
        </View>
      </View>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@business.com"
        autoCapitalize="none"
        keyboardType="email-address"
        hint="A business email address helps us verify you faster."
      />
      <Field label="Business phone (optional)" value={phone} onChangeText={setPhone} placeholder="(478) 555-0117" keyboardType="phone-pad" />
      <Field
        label="Anything that helps us verify you? (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="e.g. I’m listed as the owner on our Google page"
        multiline
        maxLength={500}
      />

      {error ? <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text> : null}
      <Button label={code.trim() ? 'Claim my business' : 'Send my claim for review'} onPress={submit} loading={saving} />
      <Body muted style={{ fontSize: 12, textAlign: 'center' }}>
        Only the real owner or manager should claim a business. False claims are removed.
      </Body>
    </Screen>
  );
}
