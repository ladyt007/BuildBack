import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Body, Button, Card, EmptyState, Row, Screen } from '@/components/ui';
import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { neighborNeed } from '@/lib/categories';
import type { NeighborRequest } from '@/lib/types';
import { useApp } from '@/state/app-state';

/** Review queue for "Build Our Neighbors" requests. Only reviewers (is_admin) can use it. */
export default function AdminScreen() {
  const colors = useColors();
  const { profile, touch } = useApp();
  const [pending, setPending] = useState<NeighborRequest[] | null>(null);

  const load = useCallback(() => backend.listPendingNeighbors().then(setPending), []);
  useEffect(() => {
    load();
  }, [load]);

  if (!profile?.isAdmin) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="lock-closed-outline" title="Reviewers only" message="This page is for the BuildBack team." />
      </Screen>
    );
  }

  async function review(id: string, approve: boolean) {
    await backend.reviewNeighbor(id, approve);
    touch();
    load();
  }

  return (
    <Screen edges={[]}>
      <Body muted>
        Check that each story makes sense, the fundraiser link works and belongs to the person, and nothing looks like a
        scam. When in doubt, reach out to them before approving.
      </Body>
      {pending === null ? null : pending.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="All caught up" message="No requests waiting for review." />
      ) : (
        pending.map((n) => (
          <Card key={n.id}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{n.title}</Text>
            <Body muted>
              {n.firstName} · {neighborNeed(n.need).label} · {n.city}, {n.state}
              {n.goalAmount ? ` · Goal $${n.goalAmount.toLocaleString()}` : ''}
            </Body>
            <Body>{n.story}</Body>
            <Body muted style={{ fontSize: 13 }}>
              Fundraiser: {n.fundraiserUrl}
            </Body>
            <Row style={{ flexWrap: 'wrap' }}>
              <Button label="Approve" icon="checkmark" small onPress={() => review(n.id, true)} />
              <Button label="Decline" icon="close" small variant="secondary" onPress={() => review(n.id, false)} />
              <Link href={`/neighbor/${n.id}`} asChild>
                <Button label="Preview" small variant="ghost" />
              </Link>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
