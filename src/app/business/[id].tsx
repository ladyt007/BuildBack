import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { STATUS_LABEL } from '@/components/cards';
import { CommunityGiving } from '@/components/impact-meters';
import { PhotoGallery } from '@/components/photos';
import { Body, Button, Card, EmptyState, Field, Initials, Pill, Row, Screen, Title } from '@/components/ui';
import { backend } from '@/data';
import { isFeatured } from '@/data/shared';
import { useColors } from '@/hooks/use-colors';
import { businessCategory } from '@/lib/categories';
import { distanceMiles, formatDistance } from '@/lib/geo';
import { openExternal, shareLink } from '@/lib/links';
import { Brand, Space } from '@/lib/theme';
import type { Business, BusinessClaim, StatusUpdate } from '@/lib/types';
import { useApp } from '@/state/app-state';

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function BusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { profile, place, activity, toggleFollow, give, dataVersion, touch } = useApp();
  const [business, setBusiness] = useState<Business | null | undefined>(undefined);
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [claim, setClaim] = useState<BusinessClaim | null>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([backend.getBusiness(id), backend.listStatusUpdates(id), backend.myClaim(id)]).then(([b, u, c]) => {
      if (cancelled) return;
      setBusiness(b);
      setUpdates(u);
      setClaim(c);
    });
    return () => {
      cancelled = true;
    };
  }, [id, dataVersion]);

  if (business === undefined) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (business === null) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="storefront-outline" title="Business not found" message="It may have been removed." />
      </Screen>
    );
  }

  const cat = businessCategory(business.category);
  const status = STATUS_LABEL[business.status];
  const following = activity.followingIds.includes(business.id);
  const isOwner = !!profile && business.ownerId === profile.id;
  const helped = activity.supports.some((s) => s.targetId === business.id);

  async function post() {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await backend.postStatusUpdate(business!.id, draft);
      setDraft('');
      touch();
    } finally {
      setPosting(false);
    }
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: business.name }} />

      {business.imageUrl ? (
        <Image source={{ uri: business.imageUrl }} style={styles.hero} contentFit="cover" />
      ) : (
        <View style={[styles.hero, { backgroundColor: cat.color, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name={cat.icon} size={64} color="rgba(255,255,255,0.9)" />
        </View>
      )}

      <Row style={{ alignItems: 'flex-start' }}>
        <Initials name={business.name} color={cat.color} size={44} />
        <View style={{ flex: 1, gap: 4 }}>
          <Title style={{ fontSize: 24 }}>{business.name}</Title>
          <Body muted>
            {business.kind} · {business.city}, {business.state}
            {place ? ` · ${formatDistance(distanceMiles(place, business))}` : ''}
          </Body>
        </View>
      </Row>

      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
        <Pill label={status.label} color={status.color} />
        {isFeatured(business) ? <Pill label="★ Featured" color={Brand.gold} textColor="#1C1717" /> : null}
        {business.isPro ? <Pill label="✓ Verified" color={colors.primary} /> : null}
        {business.claimStatus === 'unclaimed' ? <Pill label="Community pick" color={colors.muted} textColor={colors.text} /> : null}
        {business.ownershipTags.map((t) => (
          <Pill key={t} label={t} color={colors.muted} textColor={colors.text} />
        ))}
      </Row>

      {business.reviewStatus === 'pending' ? (
        <Card style={{ borderColor: colors.accent }}>
          <Body>⏳ Thanks for your nomination! Our team is reviewing it. Only you can see this listing for now.</Body>
        </Card>
      ) : null}

      {business.claimStatus === 'unclaimed' && business.reviewStatus === 'approved' ? (
        <Card style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent }}>
          <Text style={[styles.section, { color: colors.text, fontSize: 17 }]}>🌟 Community pick</Text>
          <Body>
            A neighbor nominated this business because they love it. The owner hasn’t claimed this listing yet, so
            details may be incomplete.
          </Body>
          {claim?.status === 'pending' ? (
            <Body muted>📨 Your claim is being reviewed. We’ll let you know soon.</Body>
          ) : (
            <Link href={{ pathname: '/business/claim', params: { id: business.id } }} asChild>
              <Button label="Is this your business? Claim it free" icon="key-outline" small style={{ alignSelf: 'flex-start' }} />
            </Link>
          )}
        </Card>
      ) : null}

      <Body>{business.description}</Body>

      <PhotoGallery photos={business.photos ?? []} />

      <Text style={{ color: colors.textSecondary }}>❤️ {business.followerCount} followers</Text>
      <CommunityGiving
        total={business.reportedTotal ?? 0}
        supporters={business.supporterCount}
        goal={business.goalAmount}
        display={business.givingDisplay}
        isOwner={isOwner}
      />

      <View style={{ gap: Space.sm }}>
        {business.supportUrl ? (
          <Button
            label={helped ? 'Support again' : business.name.length <= 24 ? `Support ${business.name}` : 'Support this business'}
            icon="cash-outline"
            variant="gold"
            onPress={() => give({ type: 'business', id: business.id, name: business.name, url: business.supportUrl! })}
          />
        ) : (
          <Body muted>This business hasn’t added a way to give yet. Following and visiting them helps too!</Body>
        )}
        <Row>
          <Button
            label={following ? 'Following' : 'Follow'}
            icon={following ? 'heart' : 'heart-outline'}
            variant={following ? 'secondary' : 'primary'}
            onPress={() => toggleFollow(business.id)}
            style={{ flex: 1 }}
          />
          <Button
            label="Share"
            icon="share-outline"
            variant="secondary"
            onPress={() => shareLink(`/business/${business.id}`, `Support ${business.name} on BuildBack!`)}
            style={{ flex: 1 }}
          />
        </Row>
        {business.website ? (
          <Button label="Website" icon="globe-outline" variant="ghost" onPress={() => openExternal(business.website!)} />
        ) : null}
        {business.phone ? <Body muted>📞 {business.phone}</Body> : null}
      </View>

      {isOwner ? (
        <Card style={{ borderColor: colors.accent }}>
          <Text style={[styles.section, { color: colors.text }]}>Post an update</Text>
          <Field
            label="What's new?"
            placeholder="New hours, a fundraiser, a thank-you to your supporters…"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
          />
          <Row style={{ flexWrap: 'wrap' }}>
            <Button label="Post update" icon="megaphone-outline" small onPress={post} loading={posting} disabled={!draft.trim()} />
            <Link href={{ pathname: '/business/new', params: { id: business.id } }} asChild>
              <Button label="Edit listing" icon="create-outline" small variant="secondary" />
            </Link>
            <Link href="/promote" asChild>
              <Button label="Get featured" icon="star" small variant="gold" />
            </Link>
          </Row>
        </Card>
      ) : null}

      <Text style={[styles.section, { color: colors.text }]}>Updates</Text>
      {updates.length === 0 ? (
        <Body muted>No updates yet.</Body>
      ) : (
        updates.map((u) => (
          <Card key={u.id}>
            <Body>{u.body}</Body>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{timeAgo(u.createdAt)}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 180, borderRadius: 20 },
  section: { fontSize: 19, fontWeight: '800' },
});
