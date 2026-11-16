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
  nominate: 10,
  listBusiness: 25,
};

/** Giving levels, by total reported dollars given. Each level after the first is also a badge. */
export const GIVING_TIERS = [
  { id: 'give-0', name: 'Getting started', min: 0, emoji: '🌱' },
  { id: 'give-25', name: 'Seed Planter', min: 25, emoji: '🌻' },
  { id: 'generous-heart', name: 'Generous Heart', min: 50, emoji: '💛' },
  { id: 'give-100', name: 'Open Hand', min: 100, emoji: '🤲' },
  { id: 'big-heart', name: 'Big Heart', min: 250, emoji: '💖' },
  { id: 'give-500', name: 'Golden Heart', min: 500, emoji: '🌟' },
  { id: 'pillar', name: 'Community Pillar', min: 1000, emoji: '🏛️' },
  { id: 'give-5000', name: 'Legacy Builder', min: 5000, emoji: '👑' },
];
export type GivingTier = (typeof GIVING_TIERS)[number];

export type BadgeCategory = 'giving' | 'gifts' | 'lives' | 'businesses' | 'neighbors' | 'community';

export const BADGE_CATEGORIES: { id: BadgeCategory; title: string; blurb: string }[] = [
  { id: 'giving', title: 'Giving levels', blurb: 'Total you’ve given through BuildBack' },
  { id: 'lives', title: 'Lives built up', blurb: 'Businesses and neighbors you’ve helped, plus nominations' },
  { id: 'gifts', title: 'Times you’ve given', blurb: 'Every gift counts, big or small' },
  { id: 'businesses', title: 'Businesses impacted', blurb: 'Different businesses you’ve supported' },
  { id: 'neighbors', title: 'Neighbors impacted', blurb: 'Different neighbors you’ve helped' },
  { id: 'community', title: 'Community', blurb: 'Joining in and spreading the word' },
];

export type Badge = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
  category: BadgeCategory;
  /** Step in its ladder (0 = first). Sets the bronze / silver / gold / diamond ring. */
  rank: number;
  /** Progress toward earning it, e.g. 7 of 10. */
  current: number;
  target: number;
  /** Shown as dollars ("$35 of $50") instead of a count. */
  money?: boolean;
};

type LadderStep = { id: string; name: string; emoji: string; target: number };

function ladder(
  category: BadgeCategory,
  current: number,
  steps: LadderStep[],
  describe: (target: number) => string,
  money = false
): Badge[] {
  return steps.map((step, rank) => ({
    ...step,
    category,
    rank,
    current,
    money,
    description: describe(step.target),
    earned: current >= step.target,
  }));
}

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
  nominations: number;
  businessesListed: number;
  /** Businesses and people you've helped, plus businesses you've nominated. */
  livesBuiltUp: number;
  givingTier: GivingTier;
  nextGivingTier: GivingTier | null;
  givingProgress: number; // 0..1 toward the next giving tier
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
  const nominations = activity.nominationIds?.length ?? 0;
  const businessesListed = activity.ownedBusinessIds?.length ?? 0;
  const livesBuiltUp = businessesHelped + neighborsHelped + nominations;

  let tierIndex = 0;
  GIVING_TIERS.forEach((t, i) => {
    if (totalGiven >= t.min) tierIndex = i;
  });
  const givingTier = GIVING_TIERS[tierIndex];
  const nextGivingTier = GIVING_TIERS[tierIndex + 1] ?? null;
  const givingProgress = nextGivingTier
    ? (totalGiven - givingTier.min) / (nextGivingTier.min - givingTier.min)
    : 1;

  const points =
    (profile ? POINTS.joined : 0) +
    businessGifts * POINTS.supportBusiness +
    neighborGifts * POINTS.supportNeighbor +
    wishes * POINTS.wish +
    following * POINTS.follow +
    nominations * POINTS.nominate +
    businessesListed * POINTS.listBusiness;

  let levelIndex = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.min) levelIndex = i;
  });
  const level = LEVELS[levelIndex];
  const nextLevel = LEVELS[levelIndex + 1] ?? null;
  const progress = nextLevel ? (points - level.min) / (nextLevel.min - level.min) : 1;

  const joinedYear = profile ? new Date(profile.joinedAt).getFullYear() : null;

  const gifts = activity.supports.length;
  const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

  const badges: Badge[] = [
    ...ladder(
      'giving',
      totalGiven,
      GIVING_TIERS.slice(1).map((t) => ({ id: t.id, name: t.name, emoji: t.emoji, target: t.min })),
      (t) => `Give ${formatMoney(t)} through BuildBack`,
      true
    ),
    ...ladder(
      'lives',
      livesBuiltUp,
      [
        { id: 'lives-5', name: 'Foundation Layer', emoji: '🪨', target: 5 },
        { id: 'life-builder', name: 'Life Builder', emoji: '🧱', target: 10 },
        { id: 'lives-25', name: 'Wall Raiser', emoji: '🏗️', target: 25 },
        { id: 'lives-50', name: 'Neighborhood Builder', emoji: '🏘️', target: 50 },
        { id: 'lives-100', name: 'City Builder', emoji: '🏙️', target: 100 },
      ],
      (t) => `Build up ${plural(t, 'life', 'lives')}`
    ),
    ...ladder(
      'gifts',
      gifts,
      [
        { id: 'first-support', name: 'First Brick', emoji: '🧱', target: 1 },
        { id: 'gifts-5', name: 'Steady Hand', emoji: '🤝', target: 5 },
        { id: 'champion', name: 'Community Champion', emoji: '🏆', target: 10 },
        { id: 'gifts-25', name: 'Cornerstone Giver', emoji: '💎', target: 25 },
        { id: 'gifts-50', name: 'Unbreakable', emoji: '🔥', target: 50 },
      ],
      (t) => (t === 1 ? 'Give for the first time' : `Give ${t} times`)
    ),
    ...ladder(
      'businesses',
      businessesHelped,
      [
        { id: 'biz-1', name: 'Main Street Friend', emoji: '🛒', target: 1 },
        { id: 'shop-local', name: 'Shop Local', emoji: '🛍️', target: 3 },
        { id: 'biz-10', name: 'Main Street Hero', emoji: '🦸', target: 10 },
        { id: 'biz-25', name: 'Business District Builder', emoji: '🏬', target: 25 },
      ],
      (t) => `Support ${plural(t, 'business', 'businesses')}`
    ),
    ...ladder(
      'neighbors',
      neighborsHelped,
      [
        { id: 'neighbors-keeper', name: 'Neighbor’s Keeper', emoji: '🫶', target: 1 },
        { id: 'neighbors-5', name: 'Good Neighbor', emoji: '🏡', target: 5 },
        { id: 'neighbors-15', name: 'Village Builder', emoji: '🌳', target: 15 },
        { id: 'neighbors-30', name: 'Heart of the Block', emoji: '❤️‍🔥', target: 30 },
      ],
      (t) => `Help ${plural(t, 'neighbor', 'neighbors')}`
    ),
    { id: 'founding', name: 'Founding Builder', emoji: '🌱', description: 'Join during BuildBack’s first year', category: 'community', rank: 0, current: joinedYear !== null && joinedYear <= 2027 ? 1 : 0, target: 1, earned: joinedYear !== null && joinedYear <= 2027 },
    ...ladder('community', wishes, [{ id: 'wish-maker', name: 'Wish Maker', emoji: '✨', target: 1 }], () => 'Tell us what your community is missing'),
    ...ladder(
      'community',
      nominations,
      [
        { id: 'scout', name: 'Talent Scout', emoji: '🔭', target: 1 },
        { id: 'scout-5', name: 'Head Scout', emoji: '🧭', target: 5 },
      ],
      (t) => (t === 1 ? 'Nominate a business you love' : `Nominate ${t} businesses`)
    ),
    ...ladder('community', businessesListed, [{ id: 'open-for-business', name: 'Open for Business', emoji: '🏪', target: 1 }], () => 'List your business on BuildBack'),
    ...ladder('community', following, [{ id: 'fan', name: 'Biggest Fan', emoji: '📣', target: 5 }], () => 'Follow 5 businesses'),
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
    nominations,
    businessesListed,
    livesBuiltUp,
    givingTier,
    nextGivingTier,
    givingProgress: Math.max(0, Math.min(1, givingProgress)),
    badges,
  };
}

/** "$25", "$1,240", "$12.50" */
export function formatMoney(amount: number): string {
  const cents = Math.round(amount * 100) % 100 !== 0;
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}

/** Returns badges earned in `after` that weren't earned in `before`. */
export function newlyEarnedBadges(before: ImpactSummary, after: ImpactSummary): Badge[] {
  const had = new Set(before.badges.filter((b) => b.earned).map((b) => b.id));
  return after.badges.filter((b) => b.earned && !had.has(b.id));
}
