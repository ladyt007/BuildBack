import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BadgeCollection } from '@/components/badges';
import { CommunityBanner } from '@/components/cards';
import { GivingMeter, LivesWall } from '@/components/impact-meters';
import { Body, Button, Card, ProgressBar, Row, Screen, Title } from '@/components/ui';
import { useColors } from '@/hooks/use-colors';
import { Config } from '@/lib/config';
import { LEVELS, POINTS } from '@/lib/gamification';
import { openExternal } from '@/lib/links';
import { Brand, Radius, Space } from '@/lib/theme';
import { useApp } from '@/state/app-state';

export default function ImpactScreen() {
  const colors = useColors();
  const { profile, impact } = useApp();

  return (
    <Screen>
      <Title>Your impact</Title>

      {!profile ? (
        <Card>
          <Body>Create a free account to track the businesses and neighbors you help, earn badges and level up.</Body>
          <Link href="/auth?mode=signup" asChild>
            <Button label="Become a Builder" />
          </Link>
        </Card>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>{impact.level.emoji}</Text>
            <Text style={styles.heroLevel}>{impact.level.name}</Text>
            <Text style={styles.heroSub}>
              Builder #{profile.memberNumber.toLocaleString()} · {impact.points} points
            </Text>
            <View style={{ alignSelf: 'stretch', gap: 6 }}>
              <ProgressBar value={impact.progress} color={Brand.gold} height={12} />
              <Text style={styles.heroNext}>
                {impact.nextLevel
                  ? `${impact.nextLevel.min - impact.points} points to ${impact.nextLevel.emoji} ${impact.nextLevel.name}`
                  : 'You’ve reached the top level. Thank you!'}
              </Text>
            </View>
          </View>

          <Card style={{ gap: Space.md }}>
            <View style={styles.tallyHead}>
              <Text style={[styles.tallyNumber, { color: colors.primary }]}>{impact.livesBuiltUp}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.section, { color: colors.text }]}>
                  {impact.livesBuiltUp === 1 ? 'life' : 'lives'} built up
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {impact.businessesHelped} {impact.businessesHelped === 1 ? 'business' : 'businesses'} ·{' '}
                  {impact.neighborsHelped} {impact.neighborsHelped === 1 ? 'neighbor' : 'neighbors'} ·{' '}
                  {impact.nominations} {impact.nominations === 1 ? 'nomination' : 'nominations'}
                </Text>
              </View>
            </View>
            <LivesWall count={impact.livesBuiltUp} />
          </Card>

          <Card style={{ gap: Space.sm }}>
            <Text style={[styles.section, { color: colors.text }]}>💵 You’ve given</Text>
            <GivingMeter impact={impact} />
          </Card>

          <Row style={{ gap: Space.md }}>
            <Stat n={impact.wishes} label="Wishes made" />
            <Stat n={impact.following} label="Following" />
            <Stat n={impact.businessesListed} label="Businesses listed" />
          </Row>

          <BadgeCollection badges={impact.badges} />

          <Card>
            <Text style={[styles.section, { color: colors.text }]}>How to earn points</Text>
            <Body>🏪 Support a business: +{POINTS.supportBusiness}</Body>
            <Body>💛 Help a neighbor: +{POINTS.supportNeighbor}</Body>
            <Body>✨ Make a wish: +{POINTS.wish}</Body>
            <Body>🏪 List your business: +{POINTS.listBusiness}</Body>
            <Body>🔭 Nominate a business: +{POINTS.nominate}</Body>
            <Body>❤️ Follow a business: +{POINTS.follow}</Body>
            <Body muted>Levels: {LEVELS.map((l) => `${l.emoji} ${l.name}`).join(' → ')}</Body>
          </Card>
        </>
      )}

      <Text style={[styles.section, { color: colors.text }]}>Our community</Text>
      <CommunityBanner />

      {Config.links.supportBuildBack ? (
        <Card style={{ alignItems: 'center' }}>
          <Body style={{ textAlign: 'center' }}>Love what we’re building? Help keep BuildBack running.</Body>
          <Button label="Support BuildBack" icon="heart" variant="gold" small onPress={() => openExternal(Config.links.supportBuildBack)} />
        </Card>
      ) : null}
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statN, { color: colors.primary }]}>{n}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Brand.blue,
    borderRadius: Radius.lg,
    padding: Space.xl,
    alignItems: 'center',
    gap: Space.sm,
  },
  heroEmoji: { fontSize: 56 },
  heroLevel: { color: '#fff', fontSize: 26, fontWeight: '900' },
  heroSub: { color: '#DDE2FF', fontSize: 14 },
  heroNext: { color: '#DDE2FF', fontSize: 13, textAlign: 'center' },
  stat: { flex: 1, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, padding: Space.lg, gap: 2 },
  statN: { fontSize: 30, fontWeight: '900' },
  section: { fontSize: 19, fontWeight: '800' },
  tallyHead: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  tallyNumber: { fontSize: 48, fontWeight: '900', minWidth: 56, textAlign: 'center' },
});
