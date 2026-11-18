import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { GivingSettings, givingSettingsFrom, parseGoal } from '@/components/giving-settings';
import { CommunityGiving } from '@/components/impact-meters';
import { Body, Button, Card, EmptyState, Screen, Title } from '@/components/ui';
import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { neighborNeed } from '@/lib/categories';
import { distanceMiles, formatDistance } from '@/lib/geo';
import { openExternal, shareLink } from '@/lib/links';
import { Space } from '@/lib/theme';
import type { NeighborRequest } from '@/lib/types';
import { useApp } from '@/state/app-state';

export default function NeighborScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { place, give, activity, profile, dataVersion } = useApp();
  const [n, setN] = useState<NeighborRequest | null | undefined>(undefined);

  useEffect(() => {
    backend.getNeighbor(id).then(setN);
  }, [id, dataVersion]);

  if (n === undefined) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (n === null) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="heart-outline" title="Request not found" message="It may have been fulfilled or removed." />
      </Screen>
    );
  }

  const need = neighborNeed(n.need);
  const helped = activity.supports.some((s) => s.targetId === n.id);
  const isOwner = profile?.id === n.ownerId;

  function report() {
    const subject = encodeURIComponent(`Report: neighbor request ${n!.id}`);
    const url = `mailto:safety@buildback.app?subject=${subject}`;
    if (Platform.OS === 'web') {
      openExternal(url);
    } else {
      Alert.alert('Report this request?', 'Our team will review it. Thank you for keeping BuildBack safe.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => openExternal(url) },
      ]);
    }
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: n.firstName }} />
      <View style={[styles.hero, { backgroundColor: need.color }]}>
        <Ionicons name={need.icon} size={56} color="#fff" />
        <Text style={styles.heroLabel}>{need.label}</Text>
      </View>

      <Title style={{ fontSize: 24 }}>{n.title}</Title>
      <Body muted>
        {n.firstName} · {n.city}, {n.state}
        {place ? ` · ${formatDistance(distanceMiles(place, n))}` : ''}
      </Body>

      {isOwner && n.status !== 'approved' ? (
        <Card style={{ borderColor: colors.accent }}>
          <Body>
            {n.status === 'pending'
              ? '⏳ Your request is waiting for review. Only you can see it right now.'
              : n.status === 'rejected'
                ? 'This request wasn’t approved. Reach out to support@buildback.app if you have questions.'
                : '🎉 This request has been fulfilled.'}
          </Body>
        </Card>
      ) : null}

      <Body>{n.story}</Body>

      <Card>
        {!isOwner && nobodyHasGivenYet(n) ? (
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>
            Be the first to help {n.firstName}
            {n.goalAmount && n.givingDisplay !== 'hidden' ? ` · goal $${n.goalAmount.toLocaleString()}` : ''}
          </Text>
        ) : (
          <CommunityGiving
            total={n.reportedTotal ?? 0}
            supporters={n.supporterCount}
            goal={n.goalAmount}
            display={n.givingDisplay}
            isOwner={isOwner}
          />
        )}
        <Body muted style={{ fontSize: 13 }}>
          Reviewed by the BuildBack team. Your gift goes directly to {n.firstName}’s fundraiser.
        </Body>
      </Card>

      {isOwner ? <NeighborGivingEditor request={n} onSaved={setN} /> : null}

      {n.status === 'approved' ? (
        <View style={{ gap: Space.sm }}>
          <Button
            label={helped ? `Help ${n.firstName} again` : `Help ${n.firstName}`}
            icon="heart"
            variant="gold"
            onPress={() => give({ type: 'neighbor', id: n.id, name: n.firstName, url: n.fundraiserUrl })}
          />
          <Button
            label="Share their story"
            icon="share-outline"
            variant="secondary"
            onPress={() => shareLink(`/neighbor/${n.id}`, `Help ${n.firstName}: ${n.title}`)}
          />
          <Button label="Report a concern" icon="flag-outline" variant="ghost" small onPress={report} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, height: 150, alignItems: 'center', justifyContent: 'center', gap: Space.sm },
  heroLabel: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

/** Lets the person who asked for help change their goal and what their page shows. */
function NeighborGivingEditor({ request, onSaved }: { request: NeighborRequest; onSaved: (n: NeighborRequest) => void }) {
  const colors = useColors();
  const { touch } = useApp();
  const [value, setValue] = useState(givingSettingsFrom(request.givingDisplay, request.goalAmount));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    const goal = parseGoal(value);
    if (goal.error) return setMessage(goal.error);
    setSaving(true);
    setMessage(null);
    try {
      onSaved(await backend.updateNeighborRequest(request.id, { goalAmount: goal.goalAmount, givingDisplay: value.display }));
      touch();
      setMessage('Saved ✓');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={{ gap: Space.md, borderColor: colors.accent }}>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>Your page settings</Text>
      <GivingSettings value={value} onChange={setValue} />
      <Button label="Save" small onPress={save} loading={saving} style={{ alignSelf: 'flex-start' }} />
      {message ? <Text style={{ color: message.startsWith('Saved') ? colors.success : colors.danger }}>{message}</Text> : null}
    </Card>
  );
}

/** Uses only what the person chose to show (with "amount only", the supporter count is hidden). */
function nobodyHasGivenYet(n: NeighborRequest): boolean {
  if (n.givingDisplay === 'hidden') return false;
  if (n.givingDisplay === 'amount') return n.reportedTotal === 0;
  return n.supporterCount === 0;
}
