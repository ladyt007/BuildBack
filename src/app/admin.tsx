import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Share, Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, Row, Screen } from '@/components/ui';
import { backend, type NominationForReview } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { neighborNeed } from '@/lib/categories';
import { Config } from '@/lib/config';
import { Space } from '@/lib/theme';
import type { BusinessClaim, NeighborRequest, Nomination } from '@/lib/types';
import { useApp } from '@/state/app-state';

const RELATIONSHIP_LABEL: Record<Nomination['relationship'], string> = {
  customer: 'Customer',
  neighbor: 'Neighbor',
  friend_family: 'Friend or family of the owner',
  employee: 'Works there',
  other: 'Other',
};

function claimLink(n: Nomination): string {
  return `${Config.siteUrl}/business/claim?id=${encodeURIComponent(n.businessId)}&code=${encodeURIComponent(n.inviteCode)}`;
}

/** The "you were added" message we send to a nominated business. */
function inviteMessage(n: Nomination): string {
  const hello = n.contactName ? `Hi ${n.contactName.trim()}!` : 'Hi there!';
  return `${hello} Great news: a neighbor nominated ${n.businessName} on BuildBack, a free app that helps communities find and support local businesses.

Claim your free listing to add your own photos and story, post updates and let customers support you directly:
${claimLink(n)}

Your invite code is ${n.inviteCode}. It takes about a minute.

— The BuildBack team`;
}

/** Review area for the BuildBack team. Only reviewers (is_admin) can use it. */
export default function AdminScreen() {
  const colors = useColors();
  const { profile, touch, dataVersion } = useApp();
  const [neighbors, setNeighbors] = useState<NeighborRequest[] | null>(null);
  const [nominations, setNominations] = useState<NominationForReview[] | null>(null);
  const [claims, setClaims] = useState<BusinessClaim[] | null>(null);

  // Reloads whenever something changes (touch() bumps dataVersion).
  useEffect(() => {
    if (!profile?.isAdmin) return;
    let cancelled = false;
    Promise.all([backend.listPendingNeighbors(), backend.listNominations(), backend.listPendingClaims()])
      .then(([n, nom, c]) => {
        if (cancelled) return;
        setNeighbors(n);
        setNominations(nom);
        setClaims(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile?.isAdmin, dataVersion]);

  if (!profile?.isAdmin) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="lock-closed-outline" title="Reviewers only" message="This page is for the BuildBack team." />
      </Screen>
    );
  }

  async function act(fn: () => Promise<void>) {
    await fn();
    touch();
  }

  async function sendInvite(n: Nomination, via: 'email' | 'text' | 'share') {
    const body = inviteMessage(n);
    const subject = `${n.businessName} was nominated on BuildBack`;
    if (via === 'email' && n.contactEmail) {
      await Linking.openURL(`mailto:${n.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } else if (via === 'text' && n.contactPhone) {
      const separator = Platform.OS === 'ios' ? '&' : '?';
      await Linking.openURL(`sms:${n.contactPhone.replace(/[^0-9+]/g, '')}${separator}body=${encodeURIComponent(body)}`);
    } else if (Platform.OS === 'web') {
      await window.navigator.clipboard?.writeText(body);
      window.alert('Invite message copied. Paste it into a DM or message.');
    } else {
      await Share.share({ message: body });
    }
    await act(() => backend.markInvited(n.businessId));
  }

  const toReview = nominations?.filter((n) => n.business.reviewStatus === 'pending') ?? [];
  const toInvite = nominations?.filter((n) => n.business.reviewStatus === 'approved') ?? [];

  return (
    <Screen edges={[]}>
      <Section title="New nominations" count={toReview.length}>
        <Body muted>Make sure it’s a real, local business and the details look right. Approved listings go live as a “Community pick”.</Body>
        {toReview.length === 0 ? <Body muted>Nothing to review.</Body> : null}
        {toReview.map(({ business: b, nomination: n }) => (
          <Card key={b.id}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{b.name}</Text>
            <Body muted>
              {b.kind} · {b.city}, {b.state}
            </Body>
            <Body>“{n.reason}”</Body>
            <Body muted style={{ fontSize: 13 }}>Nominator: {RELATIONSHIP_LABEL[n.relationship]}</Body>
            <ContactDetails n={n} />
            <Row style={{ flexWrap: 'wrap' }}>
              <Button label="Approve" icon="checkmark" small onPress={() => act(() => backend.reviewNomination(b.id, true))} />
              <Button label="Decline" icon="close" small variant="secondary" onPress={() => act(() => backend.reviewNomination(b.id, false))} />
              <Link href={`/business/${b.id}`} asChild>
                <Button label="Preview" small variant="ghost" />
              </Link>
            </Row>
          </Card>
        ))}
      </Section>

      <Section title="Invite the owner" count={toInvite.filter((n) => !n.nomination.invitedAt).length}>
        <Body muted>These listings are live but unclaimed. Send the owner their claim link — it includes a one-time code that hands them the listing.</Body>
        {toInvite.length === 0 ? <Body muted>No unclaimed listings.</Body> : null}
        {toInvite.map(({ business: b, nomination: n }) => (
          <Card key={b.id}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{b.name}</Text>
            <Body muted>
              {b.city}, {b.state} ·{' '}
              {n.invitedAt ? `Invited ${new Date(n.invitedAt).toLocaleDateString()}` : 'Not invited yet'} · Code{' '}
              <Text style={{ fontWeight: '800', color: colors.text }}>{n.inviteCode}</Text>
            </Body>
            <ContactDetails n={n} />
            <Row style={{ flexWrap: 'wrap' }}>
              {n.contactEmail ? <Button label="Email invite" icon="mail-outline" small onPress={() => sendInvite(n, 'email')} /> : null}
              {n.contactPhone ? <Button label="Text invite" icon="chatbubble-outline" small onPress={() => sendInvite(n, 'text')} /> : null}
              <Button
                label={Platform.OS === 'web' ? 'Copy message' : 'Share message'}
                icon="copy-outline"
                small
                variant="secondary"
                onPress={() => sendInvite(n, 'share')}
              />
            </Row>
          </Card>
        ))}
      </Section>

      <Section title="Claims to verify" count={claims?.length ?? 0}>
        <Body muted>
          Someone says they run a listed business but didn’t have the invite code. Before approving, contact the business
          using the details from the nomination or its public website — not the details in the claim.
        </Body>
        {claims && claims.length === 0 ? <Body muted>No claims waiting.</Body> : null}
        {claims?.map((c) => (
          <Card key={c.id}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{c.businessName}</Text>
            <Body>
              {c.claimantName} · {c.role}
            </Body>
            <Body muted style={{ fontSize: 13 }}>
              {c.email}
              {c.phone ? ` · ${c.phone}` : ''}
            </Body>
            {c.note ? <Body>“{c.note}”</Body> : null}
            <Row style={{ flexWrap: 'wrap' }}>
              <Button label="Approve" icon="checkmark" small onPress={() => act(() => backend.reviewClaim(c.id, true))} />
              <Button label="Decline" icon="close" small variant="secondary" onPress={() => act(() => backend.reviewClaim(c.id, false))} />
            </Row>
          </Card>
        ))}
      </Section>

      <Section title="Help requests" count={neighbors?.length ?? 0}>
        <Body muted>
          Check that each story makes sense, the fundraiser link works and belongs to the person, and nothing looks like a
          scam. When in doubt, reach out to them before approving.
        </Body>
        {neighbors && neighbors.length === 0 ? <Body muted>No requests waiting.</Body> : null}
        {neighbors?.map((n) => (
          <Card key={n.id}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{n.title}</Text>
            <Body muted>
              {n.firstName} · {neighborNeed(n.need).label} · {n.city}, {n.state}
              {n.goalAmount ? ` · Goal $${n.goalAmount.toLocaleString()}` : ''}
            </Body>
            <Body>{n.story}</Body>
            <Body muted style={{ fontSize: 13 }}>
              Fundraiser: {n.fundraiserUrl}
            </Body>
            <Row style={{ flexWrap: 'wrap' }}>
              <Button label="Approve" icon="checkmark" small onPress={() => act(() => backend.reviewNeighbor(n.id, true))} />
              <Button label="Decline" icon="close" small variant="secondary" onPress={() => act(() => backend.reviewNeighbor(n.id, false))} />
              <Link href={`/neighbor/${n.id}`} asChild>
                <Button label="Preview" small variant="ghost" />
              </Link>
            </Row>
          </Card>
        ))}
      </Section>
    </Screen>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ gap: Space.sm }}>
      <Row>
        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>{title}</Text>
        {count > 0 ? (
          <View style={{ backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 }}>
            <Text style={{ fontWeight: '800', color: '#1C1717' }}>{count}</Text>
          </View>
        ) : null}
      </Row>
      {children}
    </View>
  );
}

function ContactDetails({ n }: { n: Nomination }) {
  const colors = useColors();
  const lines = [
    n.contactName && `👤 ${n.contactName}`,
    n.contactEmail && `✉️ ${n.contactEmail}`,
    n.contactPhone && `📞 ${n.contactPhone}`,
    n.contactSocial && `💬 ${n.contactSocial}`,
  ].filter(Boolean);
  return (
    <View style={{ backgroundColor: colors.muted, borderRadius: 8, padding: Space.sm, gap: 2 }}>
      {lines.map((l) => (
        <Text key={l as string} style={{ color: colors.text, fontSize: 13 }}>
          {l}
        </Text>
      ))}
    </View>
  );
}
