import type { MyActivity, Profile } from './types';

export type Level = { name: string; min: number; emoji: string };

export const LEVELS: Level[] = [
  { name: 'Neighbor', min: 0, emoji: '🏠' },
  { name: 'Supporter', min: 20, emoji: '🤝' },
  { name: 'Builder', min: 60, emoji: '🧱' },
  { name: 'Cornerstone', min: 150, emoji: '🏛️' },
  { name: 'Community Champion', min: 300, emoji: '🏆' },
];

export const POINTS = {
  joined: 5,
  supportBusiness: 15,
  supportNeighbor: 15,
  wish: 3,
  follow: 1,
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
};

export type ImpactSummary = {
  points: number;
  level: Level;
  nextLevel: Level | null;
  progress: number; // 0..1 toward next level
  businessesHelped: number;
  neighborsHelped: number;
  totalGiven: number;
  wishes: number;
  following: number;
  badges: Badge[];
};

export function summarizeImpact(activity: MyActivity, profile: Profile | null): ImpactSummary {
  const businessesHelped = new Set(
    activity.supports.filter((s) => s.targetType === 'business').map((s) => s.targetId)
  ).size;
  const neighborsHelped = new Set(
    activity.supports.filter((s) => s.targetType === 'neighbor').map((s) => s.targetId)
  ).size;
  const businessGifts = activity.supports.filter((s) => s.targetType === 'business').length;
  const neighborGifts = activity.supports.filter((s) => s.targetType === 'neighbor').length;
  const totalGiven = activity.supports.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const wishes = activity.wishes.length;
  const following = activity.followingIds.length;

  const points =
    (profile ? POINTS.joined : 0) +
    businessGifts * POINTS.supportBusiness +
    neighborGifts * POINTS.supportNeighbor +
    wishes * POINTS.wish +
    following * POINTS.follow;

  let levelIndex = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.min) levelIndex = i;
  });
  const level = LEVELS[levelIndex];
  const nextLevel = LEVELS[levelIndex + 1] ?? null;
  const progress = nextLevel ? (points - level.min) / (nextLevel.min - level.min) : 1;

  const joinedYear = profile ? new Date(profile.joinedAt).getFullYear() : null;

  const badges: Badge[] = [
    { id: 'founding', name: 'Founding Builder', emoji: '🌱', description: 'Joined during BuildBack’s first year', earned: joinedYear !== null && joinedYear <= 2027 },
    { id: 'first-support', name: 'First Brick', emoji: '🧱', description: 'Supported your first business or neighbor', earned: activity.supports.length >= 1 },
    { id: 'shop-local', name: 'Shop Local', emoji: '🛍️', description: 'Supported 3 different businesses', earned: businessesHelped >= 3 },
    { id: 'neighbors-keeper', name: 'Neighbor’s Keeper', emoji: '💛', description: 'Helped a neighbor in need', earned: neighborsHelped >= 1 },
    { id: 'wish-maker', name: 'Wish Maker', emoji: '✨', description: 'Told us what your community is missing', earned: wishes >= 1 },
    { id: 'fan', name: 'Biggest Fan', emoji: '📣', description: 'Followed 5 businesses', earned: following >= 5 },
    { id: 'champion', name: 'Community Champion', emoji: '🏆', description: 'Gave 10 times', earned: activity.supports.length >= 10 },
  ];

  return {
    points,
    level,
    nextLevel,
    progress: Math.max(0, Math.min(1, progress)),
    businessesHelped,
    neighborsHelped,
    totalGiven,
    wishes,
    following,
    badges,
  };
}

/** Returns badges earned in `after` that weren't earned in `before`. */
export function newlyEarnedBadges(before: ImpactSummary, after: ImpactSummary): Badge[] {
  const had = new Set(before.badges.filter((b) => b.earned).map((b) => b.id));
  return after.badges.filter((b) => b.earned && !had.has(b.id));
}
