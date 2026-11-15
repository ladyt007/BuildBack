import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { saveJSON, WELCOMED_KEY } from '@/lib/storage';
import { Brand, Radius, Space } from '@/lib/theme';

const POINTS = [
  { emoji: '🏪', title: 'Find & support local businesses', body: 'Barbers, braiders, bakeries, boutiques — the places that make a neighborhood home.' },
  { emoji: '💛', title: 'Lift up neighbors in need', body: 'Help real people in your community through a hard season.' },
  { emoji: '✨', title: 'Say what’s missing', body: 'No Black barber for 30 miles? Want an Irish pub? Tell us, and we’ll tell the builders.' },
];

export default function WelcomeScreen() {
  async function go(path: '/auth?mode=signup' | '/auth?mode=signin' | '/') {
    await saveJSON(WELCOMED_KEY, true);
    if (path === '/') router.replace('/');
    else {
      router.replace('/');
      router.push(path);
    }
  }

  return (
    <LinearGradient colors={[Brand.blueDeep, Brand.blue, '#7F6A3A', Brand.gold]} locations={[0, 0.45, 0.8, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" accessibilityLabel="BuildBack logo" />
          <Text style={styles.title}>BuildBack</Text>
          <Text style={styles.tagline}>Build back communities —{'\n'}one store at a time, one person at a time.</Text>

          <View style={styles.points}>
            {POINTS.map((p) => (
              <View key={p.title} style={styles.point}>
                <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pointTitle}>{p.title}</Text>
                  <Text style={styles.pointBody}>{p.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Become a Builder" variant="gold" onPress={() => go('/auth?mode=signup')} />
            <Button
              label="I have an account"
              variant="secondary"
              onPress={() => go('/auth?mode=signin')}
              style={{ backgroundColor: '#FFFFFF' }}
              textColor={Brand.blueDeep}
            />
            <Button
              label="Just look around"
              variant="ghost"
              onPress={() => go('/')}
              style={{ backgroundColor: 'rgba(11, 26, 140, 0.55)' }}
              textColor="#FFFFFF"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', padding: Space.xl, gap: Space.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  logo: { width: 150, height: 150, marginTop: Space.lg },
  title: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  tagline: { color: '#F3F0FF', fontSize: 18, textAlign: 'center', lineHeight: 25, fontWeight: '600' },
  points: { gap: Space.md, alignSelf: 'stretch', marginTop: Space.md },
  point: {
    flexDirection: 'row',
    gap: Space.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    padding: Space.lg,
    alignItems: 'center',
  },
  pointTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pointBody: { color: '#E8E6F5', fontSize: 14, lineHeight: 19 },
  actions: { alignSelf: 'stretch', gap: Space.sm, marginTop: 'auto', paddingTop: Space.lg },
});
