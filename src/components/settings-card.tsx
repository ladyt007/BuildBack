import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { INTRO_ENABLED_KEY, loadJSON, saveJSON } from '@/lib/storage';
import { Space } from '@/lib/theme';

import { Card } from './ui';

/** Preferences saved on this device. */
export function SettingsCard() {
  const colors = useColors();
  const [introEnabled, setIntroEnabled] = useState(true);

  useEffect(() => {
    loadJSON<boolean>(INTRO_ENABLED_KEY, true).then(setIntroEnabled);
  }, []);

  function toggleIntro(value: boolean) {
    setIntroEnabled(value);
    saveJSON(INTRO_ENABLED_KEY, value);
  }

  return (
    <Card>
      <Text style={[styles.section, { color: colors.text }]}>Settings</Text>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.label, { color: colors.text }]}>Opening animation</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Build the BuildBack logo brick by brick when the app opens.
          </Text>
        </View>
        <Switch
          value={introEnabled}
          onValueChange={toggleIntro}
          accessibilityLabel="Opening animation"
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#ffffff"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  label: { fontSize: 16, fontWeight: '600' },
});
