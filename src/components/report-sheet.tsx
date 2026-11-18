/** A "Report" button and sheet: flag content for the BuildBack team, and optionally block the person. */
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { Radius, Space } from '@/lib/theme';
import type { ReportTarget } from '@/lib/types';
import { useApp } from '@/state/app-state';

import { Button, Chip, Field } from './ui';

const REASONS = ['Scam or fraud', 'Not a real business', 'Inappropriate or offensive', 'Harassment or hate', 'Spam', 'Something else'];

export function ReportButton({
  targetType,
  targetId,
  targetName,
  ownerId,
  small = true,
}: {
  targetType: ReportTarget;
  targetId: string;
  targetName: string;
  /** The person behind the content, so they can be blocked too. */
  ownerId?: string | null;
  small?: boolean;
}) {
  const colors = useColors();
  const { profile, requireAccount, setBlocked } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [block, setBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canBlock = !!ownerId && ownerId !== profile?.id;

  function start() {
    if (!requireAccount('Create a free account to report content. Reports help keep BuildBack safe for everyone.')) return;
    setReason(null);
    setDetails('');
    setBlock(false);
    setDone(false);
    setError(null);
    setOpen(true);
  }

  async function submit() {
    if (!reason) return setError('Please choose a reason.');
    setBusy(true);
    setError(null);
    try {
      await backend.reportContent(targetType, targetId, reason, details.trim() || null);
      if (block && ownerId) await setBlocked(ownerId, true);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button label="Report" icon="flag-outline" variant="ghost" small={small} onPress={start} />
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            {done ? (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Thank you 💛</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 21 }}>
                  Our team will review your report, usually within a day.
                  {block ? ' You won’t see this person’s listings or requests anymore.' : ''}
                </Text>
                <Button label="Done" onPress={() => setOpen(false)} />
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.text }]}>Report {targetName}</Text>
                <Text style={{ color: colors.textSecondary }}>What’s wrong? Your report is private.</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
                  {REASONS.map((r) => (
                    <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
                  ))}
                </View>
                <Field
                  label="Anything else we should know? (optional)"
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  maxLength={1000}
                />
                {canBlock ? (
                  <Chip
                    label={block ? '✓ Also block this person' : 'Also block this person'}
                    selected={block}
                    onPress={() => setBlock(!block)}
                  />
                ) : null}
                {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
                <Button label="Send report" variant="danger" onPress={submit} loading={busy} />
                <Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Space.xl,
    gap: Space.md,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
});
