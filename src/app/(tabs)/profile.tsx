import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { STATUS_LABEL } from '@/components/cards';
import { AvatarPicker } from '@/components/photos';
import { SettingsCard } from '@/components/settings-card';
import { Body, Button, Card, Pill, Row, Screen, Title, type IconName } from '@/components/ui';
import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { Config, isDemoMode } from '@/lib/config';
import { Space } from '@/lib/theme';
import type { Business, NeighborRequest } from '@/lib/types';
import { useApp } from '@/state/app-state';

const REQUEST_STATUS: Record<NeighborRequest['status'], string> = {
  pending: '⏳ Waiting for review',
  approved: '✅ Live',
  rejected: 'Not approved',
  fulfilled: '🎉 Fulfilled',
};

function nominationStatus(b: Business): string {
  if (b.reviewStatus === 'pending') return '⏳ Waiting for review';
  if (b.reviewStatus === 'rejected') return 'Not approved';
  if (b.claimStatus === 'claimed') return '🎉 Claimed by the owner';
  return '🌟 Live · waiting for the owner to claim it';
}

export default function ProfileScreen() {
  const colors = useColors();
  const { profile, signOut, dataVersion, updateProfile, activity, setBlocked } = useApp();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [requests, setRequests] = useState<NeighborRequest[]>([]);
  const [nominated, setNominated] = useState<Business[]>([]);

  useEffect(() => {
    if (!profile) return;
    backend.myBusinesses().then(setBusinesses).catch(() => {});
    backend.myNeighborRequests().then(setRequests).catch(() => {});
    Promise.all(activity.nominationIds.map((id) => backend.getBusiness(id)))
      .then((list) => setNominated(list.filter((b): b is Business => !!b)))
      .catch(() => {});
  }, [profile, dataVersion, activity.nominationIds]);

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
        <LegalLinks />
      </Screen>
    );
  }

  return (
    <Screen>
      <Row style={{ gap: Space.lg }}>
        <AvatarPicker
          uri={profile.avatarUrl}
          name={profile.displayName}
          onChange={(url) => updateProfile({ avatarUrl: url })}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Title>{profile.displayName || 'Builder'}</Title>
          <Body muted>
            Builder #{profile.memberNumber.toLocaleString()} · joined{' '}
            {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Body>
        </View>
      </Row>

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
          {businesses.length > 0 && Config.showPaidPlans ? (
            <Link href="/promote" asChild>
              <Button label="Get featured" icon="star" small variant="gold" />
            </Link>
          ) : null}
        </Row>
      </Card>

      <Card>
        <Text style={[styles.section, { color: colors.text }]}>My nominations</Text>
        {nominated.length === 0 ? (
          <Body muted>Know a great business that isn’t on BuildBack? Nominate it and we’ll invite the owner.</Body>
        ) : (
          nominated.map((b) => (
            <Link key={b.id} href={`/business/${b.id}`} asChild>
              <Pressable style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                    {b.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{nominationStatus(b)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            </Link>
          ))
        )}
        <Link href="/business/nominate" asChild>
          <Button label="Nominate a business" icon="telescope-outline" small variant="secondary" style={{ alignSelf: 'flex-start' }} />
        </Link>
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
        {Config.showPaidPlans ? (
          <MenuItem icon="rocket-outline" label="Grow your business with BuildBack" href="/promote" />
        ) : null}
        {profile.isAdmin ? <MenuItem icon="shield-checkmark-outline" label="Review requests" href="/admin" /> : null}
      </Card>

      <SettingsCard />

      {activity.blockedUserIds.length > 0 ? (
        <Card>
          <Text style={[styles.section, { color: colors.text }]}>Blocked</Text>
          <Body muted>
            You’ve blocked {activity.blockedUserIds.length} {activity.blockedUserIds.length === 1 ? 'person' : 'people'}. You
            won’t see their listings or requests.
          </Body>
          <Button
            label="Unblock everyone"
            small
            variant="secondary"
            style={{ alignSelf: 'flex-start' }}
            onPress={async () => {
              for (const id of activity.blockedUserIds) await setBlocked(id, false);
            }}
          />
        </Card>
      ) : null}

      {isDemoMode ? (
        <Body muted>
          Preview mode: your account and activity are stored on this device only. In preview mode every account can
          review help requests so you can try it out.
        </Body>
      ) : null}

      <Button label="Sign out" variant="secondary" icon="log-out-outline" onPress={signOut} />
      <DeleteAccount />
      <LegalLinks />
    </Screen>
  );
}

function LegalLinks() {
  const colors = useColors();
  return (
    <Row style={{ justifyContent: 'center', gap: Space.lg, paddingVertical: Space.sm }}>
      <Link href="/terms">
        <Text style={{ color: colors.textSecondary, textDecorationLine: 'underline' }}>Terms of Use</Text>
      </Link>
      <Link href="/privacy">
        <Text style={{ color: colors.textSecondary, textDecorationLine: 'underline' }}>Privacy Policy</Text>
      </Link>
    </Row>
  );
}

/** Permanently deletes the account, after a clear confirmation. Required by the App Store and Google Play. */
function DeleteAccount() {
  const colors = useColors();
  const { deleteAccount } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      setConfirming(false);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button label="Delete my account" variant="ghost" small onPress={() => setConfirming(true)} />
      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.dialog, { backgroundColor: colors.card }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Delete your account?</Text>
            <Body>
              This permanently deletes your account, your profile and photos, businesses you’ve listed, help requests,
              wishes, follows and your giving history. It can’t be undone.
            </Body>
            <Body muted style={{ fontSize: 13 }}>Gifts you made through outside links aren’t affected.</Body>
            {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
            <Button label="Delete forever" variant="danger" onPress={confirm} loading={busy} />
            <Button label="Keep my account" variant="secondary" onPress={() => setConfirming(false)} />
          </View>
        </View>
      </Modal>
    </>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: Space.lg },
  dialog: { borderRadius: 20, padding: Space.xl, gap: Space.md, width: '100%', maxWidth: 440, alignSelf: 'center' },
  dialogTitle: { fontSize: 22, fontWeight: '800' },
  section: { fontSize: 18, fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, paddingVertical: Space.sm },
  itemTitle: { fontSize: 16, fontWeight: '600' },
});
