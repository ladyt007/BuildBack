import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { placeFromDevice, placeFromZip } from '@/lib/geo';
import { Radius, Space } from '@/lib/theme';
import { useApp } from '@/state/app-state';

import { Button, Chip, Field } from './ui';

export const RADIUS_OPTIONS: { label: string; value: number | null }[] = [
  { label: '10 mi', value: 10 },
  { label: '30 mi', value: 30 },
  { label: '50 mi', value: 50 },
  { label: '100 mi', value: 100 },
  { label: '250 mi', value: 250 },
  { label: 'Nationwide', value: null },
];

/** Shows where you're looking and lets you change it. */
export function LocationBar() {
  const colors = useColors();
  const { place, radiusMiles, setRadiusMiles } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: Space.sm }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="location" size={18} color={colors.primary} />
        <Text style={[styles.place, { color: colors.text }]} numberOfLines={1}>
          {place ? place.label : 'Set your location'}
        </Text>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>Change</Text>
      </Pressable>
      {place ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.sm }}>
          {RADIUS_OPTIONS.map((o) => (
            <Chip key={o.label} label={o.label} selected={radiusMiles === o.value} onPress={() => setRadiusMiles(o.value)} />
          ))}
        </ScrollView>
      ) : null}
      <LocationPicker visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

export function LocationPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { setPlace } = useApp();
  const [zip, setZip] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'gps' | 'zip' | null>(null);

  async function useDevice() {
    setBusy('gps');
    setError(null);
    try {
      const p = await placeFromDevice();
      if (!p) {
        setError('We couldn’t get your location. You can enter a ZIP code instead.');
        return;
      }
      await setPlace(p);
      onClose();
    } catch {
      setError('We couldn’t get your location. You can enter a ZIP code instead.');
    } finally {
      setBusy(null);
    }
  }

  async function useZip() {
    setBusy('zip');
    setError(null);
    const p = await placeFromZip(zip);
    setBusy(null);
    if (!p) {
      setError('We couldn’t find that ZIP code.');
      return;
    }
    await setPlace(p);
    setZip('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>Where’s your community?</Text>
          <Text style={{ color: colors.textSecondary }}>
            We’ll show businesses, neighbors and wishes near you. Your exact location is never shared.
          </Text>
          <Button label="Use my location" icon="navigate" onPress={useDevice} loading={busy === 'gps'} />
          <Field
            label="Or enter a ZIP code"
            placeholder="31201"
            keyboardType="number-pad"
            maxLength={5}
            value={zip}
            onChangeText={setZip}
            onSubmitEditing={useZip}
            error={error}
          />
          <Button label="Use this ZIP" variant="secondary" onPress={useZip} loading={busy === 'zip'} disabled={zip.length !== 5} />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: Space.lg,
  },
  place: { flex: 1, fontSize: 15, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: Space.lg },
  sheet: { borderRadius: Radius.lg, padding: Space.xl, gap: Space.md, width: '100%', maxWidth: 460, alignSelf: 'center' },
  title: { fontSize: 22, fontWeight: '800' },
});
