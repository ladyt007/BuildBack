/**
 * Lets a business owner or a neighbor in need choose what their page shows about the gifts they receive,
 * and whether they have a goal.
 */
import { Text, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { Space } from '@/lib/theme';
import type { GivingDisplay } from '@/lib/types';

import { Chip, Field } from './ui';

export const GIVING_DISPLAY_OPTIONS: { id: GivingDisplay; label: string; example: string }[] = [
  { id: 'amount_and_count', label: '💛 Amount and supporters', example: '“$1,020 given by 24 neighbors”' },
  { id: 'amount', label: '💵 Amount only', example: '“$1,020 given through BuildBack”' },
  { id: 'count', label: '🙌 Supporters only', example: '“24 neighbors have given”' },
  { id: 'hidden', label: '🔒 Keep it private', example: 'Nothing is shown. Only you see your totals.' },
];

export type GivingSettingsValue = {
  display: GivingDisplay;
  hasGoal: boolean;
  goalText: string;
};

/** Turns the form value into what's saved: a goal amount, or null for "open to any amount". */
export function parseGoal(value: GivingSettingsValue): { goalAmount: number | null; error: string | null } {
  if (!value.hasGoal) return { goalAmount: null, error: null };
  const n = parseFloat(value.goalText.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return { goalAmount: null, error: 'Enter your goal amount, or choose “Open to any amount”.' };
  if (n > 1_000_000) return { goalAmount: null, error: 'Goals can be up to $1,000,000.' };
  return { goalAmount: Math.round(n * 100) / 100, error: null };
}

export function givingSettingsFrom(display: GivingDisplay | undefined, goalAmount: number | null | undefined): GivingSettingsValue {
  return {
    display: display ?? 'amount_and_count',
    hasGoal: !!goalAmount,
    goalText: goalAmount ? String(goalAmount) : '',
  };
}

export function GivingSettings({
  value,
  onChange,
  who = 'you',
}: {
  value: GivingSettingsValue;
  onChange: (v: GivingSettingsValue) => void;
  /** "your business" or "you", used in the help text. */
  who?: string;
}) {
  const colors = useColors();
  const selected = GIVING_DISPLAY_OPTIONS.find((o) => o.id === value.display) ?? GIVING_DISPLAY_OPTIONS[0];

  return (
    <View style={{ gap: Space.md }}>
      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>A goal, or open to any amount?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          <Chip label="Open to any amount" selected={!value.hasGoal} onPress={() => onChange({ ...value, hasGoal: false })} />
          <Chip label="🎯 Set a goal" selected={value.hasGoal} onPress={() => onChange({ ...value, hasGoal: true })} />
        </View>
        {value.hasGoal ? (
          <Field
            label="Goal amount"
            value={value.goalText}
            onChangeText={(goalText) => onChange({ ...value, goalText })}
            placeholder="$2,500"
            keyboardType="decimal-pad"
            hint="Shows a progress bar, and a 🎉 Goal reached! badge when you get there."
          />
        ) : null}
      </View>

      <View style={{ gap: Space.sm }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>What should your page show about gifts to {who}?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
          {GIVING_DISPLAY_OPTIONS.map((o) => (
            <Chip key={o.id} label={o.label} selected={value.display === o.id} onPress={() => onChange({ ...value, display: o.id })} />
          ))}
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Shows: {selected.example} You can change this any time.
        </Text>
      </View>
    </View>
  );
}
