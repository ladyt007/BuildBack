import { useState } from 'react';
import { Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { placeFromDevice, placeFromZip } from '@/lib/geo';
import { Space } from '@/lib/theme';
import type { Place } from '@/lib/types';

import { Button, Field, Row } from './ui';

export function splitPlaceLabel(label: string): { city: string; state: string } {
  const [city, state] = label.split(',').map((s) => s.trim());
  return { city: city ?? '', state: state ?? '' };
}

/** Lets someone set a location by ZIP code or with their device's location. */
export function PlaceField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: Place | null;
  onChange: (p: Place) => void;
  hint?: string;
}) {
  const colors = useColors();
  const [zip, setZip] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup(z: string) {
    setZip(z);
    setError(null);
    if (z.length !== 5) return;
    setBusy(true);
    const p = await placeFromZip(z);
    setBusy(false);
    if (p) onChange(p);
    else setError('We couldn’t find that ZIP code.');
  }

  async function useDevice() {
    setBusy(true);
    setError(null);
    try {
      const p = await placeFromDevice();
      if (p) onChange(p);
      else setError('Location permission was denied. Enter a ZIP instead.');
    } catch {
      setError('We couldn’t get your location. Enter a ZIP instead.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: Space.xs }}>
      <Field
        label={label}
        placeholder="ZIP code"
        keyboardType="number-pad"
        maxLength={5}
        value={zip}
        onChangeText={lookup}
        error={error}
        hint={hint}
      />
      <Row>
        <Button label="Use my location" icon="navigate-outline" small variant="secondary" onPress={useDevice} loading={busy} />
        {value ? <Text style={{ color: colors.success, fontWeight: '700' }}>📍 {value.label}</Text> : null}
      </Row>
    </View>
  );
}
