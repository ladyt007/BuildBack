import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { Config } from '@/lib/config';
import { Space } from '@/lib/theme';

import { Body, Screen, Title } from './ui';

export type LegalSection = { heading: string; paragraphs: string[] };

/** How people reach the team, in legal text. */
export function contactSentence(): string {
  return Config.contactEmail
    ? `email us at ${Config.contactEmail}`
    : 'use the Report button in the app, and our team will get back to you';
}

export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  const colors = useColors();
  return (
    <Screen edges={[]}>
      <Title>{title}</Title>
      <Text style={{ color: colors.textSecondary }}>Last updated {updated}</Text>
      <Body>{intro}</Body>
      {sections.map((s, i) => (
        <View key={s.heading} style={{ gap: Space.sm }}>
          <Text style={[styles.heading, { color: colors.text }]}>
            {i + 1}. {s.heading}
          </Text>
          {s.paragraphs.map((p) => (
            <Body key={p.slice(0, 40)}>{p}</Body>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '800', marginTop: Space.sm },
});
