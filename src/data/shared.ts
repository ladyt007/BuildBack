import { distanceMiles } from '@/lib/geo';
import type { Business, LatLng, NeighborRequest, Wish, WishGroup } from '@/lib/types';

import type { AreaQuery } from './backend';

export function isFeatured(b: Business, now = Date.now()): boolean {
  return !!b.featuredUntil && new Date(b.featuredUntil).getTime() > now;
}

export function withinArea<T extends LatLng>(items: T[], area: AreaQuery): T[] {
  if (!area.center || area.radiusMiles === null) return items;
  return items.filter((i) => distanceMiles(area.center!, i) <= area.radiusMiles!);
}

/** Featured businesses first, then closest (or newest when there's no location). */
export function sortBusinesses(items: Business[], center: LatLng | null): Business[] {
  const now = Date.now();
  return [...items].sort((a, b) => {
    const fa = isFeatured(a, now) ? 1 : 0;
    const fb = isFeatured(b, now) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    if (center) return distanceMiles(center, a) - distanceMiles(center, b);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function sortNeighbors(items: NeighborRequest[], center: LatLng | null): NeighborRequest[] {
  return [...items].sort((a, b) => {
    if (center) return distanceMiles(center, a) - distanceMiles(center, b);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function normalizeKind(kind: string): string {
  return kind
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/s$/, '')
    .trim();
}

/** Groups wishes for the same kind of place, e.g. "14 people want an Irish pub". */
export function groupWishes(wishes: Wish[], center: LatLng | null, myId: string | null): WishGroup[] {
  const groups = new Map<string, Wish[]>();
  for (const w of wishes) {
    const key = normalizeKind(w.kind);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }
  const result: WishGroup[] = [];
  for (const [key, list] of groups) {
    const labelCounts = new Map<string, number>();
    list.forEach((w) => labelCounts.set(w.placeLabel, (labelCounts.get(w.placeLabel) ?? 0) + 1));
    const placeLabel = [...labelCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const kindCounts = new Map<string, number>();
    list.forEach((w) => kindCounts.set(w.kind.trim(), (kindCounts.get(w.kind.trim()) ?? 0) + 1));
    const kind = [...kindCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    result.push({
      key,
      kind,
      category: list[0].category,
      count: new Set(list.map((w) => w.userId)).size,
      placeLabel,
      distanceMiles: center ? Math.min(...list.map((w) => distanceMiles(center, w))) : null,
      wishedByMe: !!myId && list.some((w) => w.userId === myId),
    });
  }
  return result.sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind));
}
