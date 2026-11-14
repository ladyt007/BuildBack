import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Screen, Title } from '@/components/ui';
import { useColors } from '@/hooks/use-colors';
import { Config } from '@/lib/config';
import { openExternal } from '@/lib/links';
import { Brand, Radius, Space } from '@/lib/theme';
import { useApp } from '@/state/app-state';

type Plan = {
  id: 'featured' | 'pro' | 'sponsor';
  name: string;
  price: string;
  emoji: string;
  perks: string[];
  link: string;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'featured',
    name: 'Featured listing',
    price: '$15 / week',
    emoji: '⭐',
    perks: ['Top of the feed for neighbors near you', 'Gold “Featured” badge', 'Shown first in search'],
    link: Config.links.featured,
  },
  {
    id: 'pro',
    name: 'BuildBack Pro',
    price: '$12 / month',
    emoji: '🚀',
    highlight: true,
    perks: [
      'Demand insights: see what neighbors near you are wishing for',
      'Verified ✓ badge',
      'Profile stats: views, follows and supporters',
      'Post deals and events',
    ],
    link: Config.links.pro,
  },
  {
    id: 'sponsor',
    name: 'Community Sponsor',
    price: 'From $99 / month',
    emoji: '🤝',
    perks: ['A tasteful sponsor card in local feeds', 'For banks, credit unions and local companies', 'Show your community commitment'],
    link: Config.links.sponsor,
  },
];

export default function PromoteScreen() {
  const colors = useColors();
  const { profile } = useApp();

  function choose(plan: Plan) {
    if (plan.link) {
      const ref = profile ? `?client_reference_id=${encodeURIComponent(profile.id)}` : '';
      openExternal(`${plan.link}${ref}`);
    } else {
      openExternal(`mailto:hello@buildback.app?subject=${encodeURIComponent(`Interested in ${plan.name}`)}`);
    }
  }

  return (
    <Screen edges={[]}>
      <Title>Grow with BuildBack</Title>
      <Body muted>
        Listing your business is always free. These optional plans help you reach more neighbors — and keep BuildBack
        running for everyone.
      </Body>
      {PLANS.map((p) => (
        <Card key={p.id} style={p.highlight ? { borderColor: Brand.gold, borderWidth: 2 } : undefined}>
          {p.highlight ? (
            <View style={[styles.popular, { backgroundColor: Brand.gold }]}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>
          ) : null}
          <Text style={{ fontSize: 32 }}>{p.emoji}</Text>
          <Text style={[styles.name, { color: colors.text }]}>{p.name}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>{p.price}</Text>
          {p.perks.map((perk) => (
            <Body key={perk}>✓ {perk}</Body>
          ))}
          <Button
            label={p.link ? 'Get started' : 'Contact us'}
            variant={p.highlight ? 'gold' : 'primary'}
            onPress={() => choose(p)}
            style={{ marginTop: Space.sm }}
          />
        </Card>
      ))}
      <Body muted style={{ fontSize: 13, textAlign: 'center' }}>
        Payments are handled securely on our website. Cancel anytime.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 20, fontWeight: '800' },
  price: { fontSize: 18, fontWeight: '800' },
  popular: { alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  popularText: { fontSize: 11, fontWeight: '900', color: '#1C1717', letterSpacing: 1 },
});
