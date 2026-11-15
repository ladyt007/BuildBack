import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { STATUS_LABEL } from '@/components/cards';
import { SettingsCard } from '@/components/settings-card';
import { Body, Button, Card, Pill, Row, Screen, Title, type IconName } from '@/components/ui';
import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { isDemoMode } from '@/lib/config';
import { Space } from '@/lib/theme';
import type { Business, NeighborRequest } from '@/lib/types';
import { useApp } from '@/state/app-state';

const REQUEST_STATUS: Record<NeighborRequest['status'], string> = {
  pending: '⏳ Waiting for review',
  approved: '✅ Live',
  rejected: 'Not approved',
  fulfilled: '🎉 Fulfilled',
};

export default function ProfileScreen() {
  const colors = useColors();
  const { profile, signOut, dataVersion } = useApp();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [requests, setRequests] = useState<NeighborRequest[]>([]);

  useEffect(() => {
    if (!profile) return;
    backend.myBusinesses().then(setBusinesses).catch(() => {});
    backend.myNeighborRequests().then(setRequests).catch(() => {});
  }, [profile, dataVersion]);

  if (!profile) {
    return (
      <Screen>
        <Title>Welcome, neighbor</Title>
        <Body muted>Sign in to follow businesses, help neighbors, make wishes and track your impact.</Body>
        <Link href="/auth?mode=signup" asChild>
          <Button label="Create a free account" />
        </Link>
        <Link href="/auth?mode=signin" asChild>
          <Button label="I already have an account" variant="secondary" />
        </Link>
        <SettingsCard />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <Title>{profile.displayName || 'Builder'}</Title>
        <Body muted>
          Builder #{profile.memberNumber.toLocaleString()} · joined{' '}
          {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Body>
      </View>

      <Card>
        <Text style={[styles.section, { color: colors.text }]}>My businesses</Text>
        {businesses.length === 0 ? (
          <Body muted>Own a business? List it for free so neighbors can find and support you.</Body>
        ) : (
          businesses.map((b) => (
            <Link key={b.id} href={`/business/${b.id}`} asChild>
              <Pressable style={styles.item}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{b.name}</Text>
                <Pill label={STATUS_LABEL[b.status].label} color={STATUS_LABEL[b.status].color} />
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
              </Pressable>
            </Link>
          ))
        )}
        <Row style={{ flexWrap: 'wrap' }}>
          <Link href="/business/new" asChild>
            <Button label="List a business" icon="add" small />
          </Link>
          {businesses.length > 0 ? (
            <Link href="/promote" asChild>
              <Button label="Get featured" icon="star" small variant="gold" />
            </Link>
          ) : null}
        </Row>
      </Card>

      <Card>
        <Text style={[styles.section, { color: colors.text }]}>My help requests</Text>
        {requests.length === 0 ? (
          <Body muted>If you’re going through a hard time, your community wants to help.</Body>
        ) : (
          requests.map((r) => (
            <Link key={r.id} href={`/neighbor/${r.id}`} asChild>
              <Pressable style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{REQUEST_STATUS[r.status]}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            </Link>
          ))
        )}
        <Link href="/neighbor/new" asChild>
          <Button label="Ask for help" icon="hand-left" small variant="secondary" style={{ alignSelf: 'flex-start' }} />
        </Link>
      </Card>

      <Card style={{ gap: 0, paddingVertical: Space.xs }}>
        <MenuItem icon="trophy-outline" label="My impact & badges" href="/impact" />
        <MenuItem icon="rocket-outline" label="Grow your business with BuildBack" href="/promote" />
        {profile.isAdmin ? <MenuItem icon="shield-checkmark-outline" label="Review help requests" href="/admin" /> : null}
      </Card>

      <SettingsCard />

      {isDemoMode ? (
        <Body muted>
          Preview mode: your account and activity are stored on this device only. In preview mode every account can
          review help requests so you can try it out.
        </Body>
      ) : null}

      <Button label="Sign out" variant="secondary" icon="log-out-outline" onPress={signOut} />
    </Screen>
  );
}

function MenuItem({ icon, label, href }: { icon: IconName; label: string; href: Href }) {
  const colors = useColors();
  return (
    <Link href={href} asChild>
      <Pressable style={StyleSheet.flatten([styles.item, { paddingVertical: Space.md }])}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 18, fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, paddingVertical: Space.sm },
  itemTitle: { fontSize: 16, fontWeight: '600' },
});
