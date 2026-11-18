import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { useCelebrate } from '@/components/celebration';
import { Button, Chip, Field } from '@/components/ui';
import { backend, type NewBusiness, type NewNomination, type NewWish } from '@/data';
import { groupWishes } from '@/data/shared';
import { useColors } from '@/hooks/use-colors';
import { Config } from '@/lib/config';
import { openExternal } from '@/lib/links';
import {
  formatMoney,
  newlyEarnedBadges,
  POINTS,
  summarizeImpact,
  type ImpactSummary,
} from '@/lib/gamification';
import { loadJSON, saveJSON } from '@/lib/storage';
import { Radius, Space } from '@/lib/theme';
import type { Business, CommunityStats, MyActivity, Place, Profile, SupportTarget } from '@/lib/types';

type GiveTarget = { type: SupportTarget; id: string; name: string; url: string };

type AppState = {
  ready: boolean;
  profile: Profile | null;
  place: Place | null;
  radiusMiles: number | null; // null = nationwide
  activity: MyActivity;
  impact: ImpactSummary;
  stats: CommunityStats | null;
  /** Bumps whenever data changes, so screens know to reload. */
  dataVersion: number;

  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setPlace: (place: Place | null) => Promise<void>;
  updateProfile: (patch: { displayName?: string; avatarUrl?: string | null }) => Promise<void>;
  setRadiusMiles: (r: number | null) => void;
  /** Returns false (and sends people to sign up) when they aren't signed in. */
  /**
   * Returns true when signed in. Otherwise shows a friendly "join BuildBack" prompt explaining
   * `reason` and returns false. With `leaveIfDismissed`, choosing "Not now" goes back a screen.
   */
  requireAccount: (reason?: string, options?: { leaveIfDismissed?: boolean }) => boolean;
  nominate: (input: NewNomination) => Promise<Business>;
  listBusiness: (input: NewBusiness) => Promise<Business>;
  /** Hide (or stop hiding) everything from another person. */
  setBlocked: (userId: string, blocked: boolean) => Promise<void>;
  /** Permanently deletes the signed-in account and everything it owns, then signs out. */
  deleteAccount: () => Promise<void>;
  toggleFollow: (businessId: string) => Promise<void>;
  give: (target: GiveTarget) => Promise<void>;
  addWish: (wish: NewWish) => Promise<void>;
  refresh: () => Promise<void>;
  touch: () => void;
};

/** Level-ups, new giving tiers and badges earned between two snapshots, for celebrations. */
function progressExtras(before: ImpactSummary, after: ImpactSummary): string[] {
  const lines: string[] = [];
  if (after.level.name !== before.level.name) lines.push(`${after.level.emoji} Level up: ${after.level.name}!`);
  const badgeLines = newlyEarnedBadges(before, after).map((b) => `${b.emoji} Badge earned: ${b.name}`);
  const all = [...lines, ...badgeLines];
  // Keep the celebration card a sensible size.
  return all.length > 4 ? [...all.slice(0, 3), `🏅 …and ${all.length - 3} more on your Impact tab`] : all;
}

/** "an Irish pub", "a barber shop" */
function withArticle(kind: string): string {
  return /^[aeiou]/i.test(kind) ? `an ${kind}` : `a ${kind}`;
}

const emptyActivity: MyActivity = {
  supports: [],
  wishes: [],
  followingIds: [],
  nominationIds: [],
  ownedBusinessIds: [],
  blockedUserIds: [],
};
const AREA_KEY = 'buildback.area.v1';

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const celebrate = useCelebrate();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [place, setPlaceState] = useState<Place | null>(null);
  const [radiusMiles, setRadiusState] = useState<number | null>(Config.defaultRadiusMiles);
  const [activity, setActivity] = useState<MyActivity>(emptyActivity);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [pendingGift, setPendingGift] = useState<GiveTarget | null>(null);

  const impact = useMemo(() => summarizeImpact(activity, profile), [activity, profile]);
  const touch = useCallback(() => setDataVersion((v) => v + 1), []);

  const refresh = useCallback(async () => {
    const [a, s] = await Promise.all([backend.myActivity(), backend.communityStats()]);
    setActivity(a);
    setStats(s);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [p, area] = await Promise.all([
          backend.currentProfile(),
          loadJSON<{ place: Place | null; radiusMiles: number | null } | null>(AREA_KEY, null),
        ]);
        setProfile(p);
        if (area) {
          setPlaceState(area.place);
          setRadiusState(area.radiusMiles);
        } else if (p?.homePlace) {
          setPlaceState(p.homePlace);
        }
        await refresh();
      } catch (e) {
        console.warn('Startup failed', e);
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  const persistArea = useCallback((p: Place | null, r: number | null) => {
    saveJSON(AREA_KEY, { place: p, radiusMiles: r });
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      let p = await backend.signUp(name, email, password);
      if (place) p = await backend.updateProfile({ homePlace: place });
      setProfile(p);
      await refresh();
      celebrate({
        style: 'confetti',
        emoji: '🧱',
        title: `Welcome, ${p.displayName.split(' ')[0] || 'neighbor'}!`,
        message: `You're Builder #${p.memberNumber.toLocaleString()}. Together we build back communities — one store at a time, one person at a time.`,
        extras: ['🌱 Badge earned: Founding Builder'],
        cta: "Let's build",
      });
    },
    [celebrate, place, refresh]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const p = await backend.signIn(email, password);
      setProfile(p);
      if (!place && p.homePlace) setPlaceState(p.homePlace);
      await refresh();
    },
    [place, refresh]
  );

  const setBlocked = useCallback(
    async (userId: string, blocked: boolean) => {
      await backend.setBlocked(userId, blocked);
      setActivity(await backend.myActivity());
      touch();
    },
    [touch]
  );

  const deleteAccount = useCallback(async () => {
    await backend.deleteAccount();
    setProfile(null);
    setActivity(emptyActivity);
    setStats(await backend.communityStats().catch(() => null));
    touch();
  }, [touch]);

  const signOut = useCallback(async () => {
    await backend.signOut();
    setProfile(null);
    setActivity(emptyActivity);
    touch();
  }, [touch]);

  const setPlace = useCallback(
    async (p: Place | null) => {
      setPlaceState(p);
      persistArea(p, radiusMiles);
      if (profile) {
        backend.updateProfile({ homePlace: p }).then(setProfile).catch(() => {});
      }
    },
    [persistArea, profile, radiusMiles]
  );

  const updateProfile = useCallback(
    async (patch: { displayName?: string; avatarUrl?: string | null }) => {
      setProfile(await backend.updateProfile(patch));
    },
    []
  );

  const setRadiusMiles = useCallback(
    (r: number | null) => {
      setRadiusState(r);
      persistArea(place, r);
    },
    [persistArea, place]
  );

  const [accountPrompt, setAccountPrompt] = useState<{ reason: string; leaveIfDismissed: boolean } | null>(null);

  const requireAccount = useCallback(
    (reason?: string, options?: { leaveIfDismissed?: boolean }) => {
      if (profile) return true;
      setAccountPrompt({
        reason: reason ?? 'Create a free account to take part.',
        leaveIfDismissed: !!options?.leaveIfDismissed,
      });
      return false;
    },
    [profile]
  );

  const listBusiness = useCallback(
    async (input: NewBusiness) => {
      const before = impact;
      const business = await backend.createBusiness(input);
      const a = await backend.myActivity();
      setActivity(a);
      setStats(await backend.communityStats());
      touch();
      celebrate({
        style: 'confetti',
        emoji: '🏪',
        title: `${business.name} is on BuildBack!`,
        message: `Neighbors near you can now find, follow and support you. You earned ${POINTS.listBusiness} builder points. Post an update to say hello.`,
        extras: progressExtras(before, summarizeImpact(a, profile)),
        cta: 'See my listing',
      });
      return business;
    },
    [celebrate, impact, profile, touch]
  );

  const nominate = useCallback(
    async (input: NewNomination) => {
      const before = impact;
      const business = await backend.nominateBusiness(input);
      const a = await backend.myActivity();
      setActivity(a);
      touch();
      celebrate({
        style: 'confetti',
        emoji: '🔭',
        title: `Thanks for nominating ${business.name}!`,
        message:
          'Our team will review it and reach out to the owner so they can claim their free listing. You earned 10 builder points.',
        extras: progressExtras(before, summarizeImpact(a, profile)),
      });
      return business;
    },
    [celebrate, impact, profile, touch]
  );

  const toggleFollow = useCallback(
    async (businessId: string) => {
      if (!requireAccount('Create a free account to follow businesses and see their updates in your feed.')) return;
      const following = activity.followingIds.includes(businessId);
      setActivity((a) => ({
        ...a,
        followingIds: following ? a.followingIds.filter((id) => id !== businessId) : [...a.followingIds, businessId],
      }));
      await backend.setFollowing(businessId, !following);
      touch();
    },
    [activity.followingIds, requireAccount, touch]
  );

  const give = useCallback(
    async (target: GiveTarget) => {
      if (!requireAccount('Create a free account so we can count your gift toward your impact and celebrate it with you.')) return;
      await openExternal(target.url);
      // When they come back, ask if they gave so we can celebrate it.
      setPendingGift(target);
    },
    [requireAccount]
  );

  const confirmGift = useCallback(
    async (amount: number | null) => {
      const target = pendingGift;
      setPendingGift(null);
      if (!target) return;
      const before = impact;
      await backend.recordSupport(target.type, target.id, amount);
      const a = await backend.myActivity();
      setActivity(a);
      setStats(await backend.communityStats());
      touch();
      const after = summarizeImpact(a, profile);
      celebrate({
        style: 'money',
        emoji: target.type === 'business' ? '🏪' : '💛',
        title: amount ? `You gave ${formatMoney(amount)} to ${target.name}!` : `You just built up ${target.name}!`,
        message: [
          `That's ${after.livesBuiltUp} ${after.livesBuiltUp === 1 ? 'life' : 'lives'} you've built up`,
          after.totalGiven > 0 ? ` and ${formatMoney(after.totalGiven)} given` : '',
          `. ${after.points} builder points and counting.`,
        ].join(''),
        extras: progressExtras(before, after),
      });
    },
    [celebrate, impact, pendingGift, profile, touch]
  );

  const addWish = useCallback(
    async (wish: NewWish) => {
      if (!requireAccount('Create a free account to tell us what your community is missing.')) return;
      const before = impact;
      // Round the location (~1 mile) so a wish never pinpoints someone's home.
      const rounded = { ...wish, lat: Math.round(wish.lat * 70) / 70, lng: Math.round(wish.lng * 70) / 70 };
      await backend.createWish(rounded);
      const [a, nearby] = await Promise.all([
        backend.myActivity(),
        backend.listWishes({ center: { lat: wish.lat, lng: wish.lng }, radiusMiles: Config.defaultRadiusMiles }),
      ]);
      setActivity(a);
      setStats(await backend.communityStats());
      touch();
      const mine = groupWishes(nearby, null, profile?.id ?? null).filter((g) => g.wishedByMe);
      const group = mine.find((g) => g.kind.toLowerCase() === wish.kind.trim().toLowerCase()) ?? mine[0];
      const others = Math.max(0, (group?.count ?? 1) - 1);
      const earned = newlyEarnedBadges(before, summarizeImpact(a, profile));
      celebrate({
        style: 'confetti',
        emoji: '✨',
        title: 'Wish sent!',
        message:
          others > 0
            ? `${others} ${others === 1 ? 'neighbor wants' : 'neighbors want'} ${withArticle(wish.kind.trim())} near ${wish.placeLabel} too. We'll show business owners what your community needs.`
            : `You're the first to ask for ${withArticle(wish.kind.trim())} near ${wish.placeLabel}. Share it so neighbors can add their voice!`,
        extras: earned.map((b) => `${b.emoji} Badge earned: ${b.name}`),
      });
    },
    [celebrate, impact, profile, requireAccount, touch]
  );

  const value: AppState = {
    ready,
    profile,
    place,
    radiusMiles,
    activity,
    impact,
    stats,
    dataVersion,
    signUp,
    signIn,
    signOut,
    setPlace,
    updateProfile,
    setRadiusMiles,
    requireAccount,
    nominate,
    listBusiness,
    setBlocked,
    deleteAccount,
    toggleFollow,
    give,
    addWish,
    refresh,
    touch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <AccountPrompt
        prompt={accountPrompt}
        onChoose={(choice) => {
          const leave = accountPrompt?.leaveIfDismissed;
          setAccountPrompt(null);
          if (choice === 'signup') router.push('/auth?mode=signup');
          else if (choice === 'signin') router.push('/auth?mode=signin');
          else if (leave && router.canGoBack()) router.back();
        }}
      />
      <GiftPrompt key={pendingGift ? `${pendingGift.type}-${pendingGift.id}` : 'none'} target={pendingGift} onAnswer={confirmGift} onDismiss={() => setPendingGift(null)} />
    </AppContext.Provider>
  );
}

function AccountPrompt({
  prompt,
  onChoose,
}: {
  prompt: { reason: string } | null;
  onChoose: (choice: 'signup' | 'signin' | 'dismiss') => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={!!prompt} transparent animationType="slide" onRequestClose={() => onChoose('dismiss')}>
      <View style={styles.sheetWrap}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 40 }}>🧱</Text>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Join BuildBack — it’s free</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 22 }}>{prompt?.reason}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
            Members follow local businesses, help neighbors, make wishes and earn badges for building up their community.
          </Text>
          <Button label="Create a free account" onPress={() => onChoose('signup')} />
          <Button label="I already have an account" variant="secondary" onPress={() => onChoose('signin')} />
          <Button label="Not now" variant="ghost" onPress={() => onChoose('dismiss')} />
        </View>
      </View>
    </Modal>
  );
}

function GiftPrompt({
  target,
  onAnswer,
  onDismiss,
}: {
  target: GiveTarget | null;
  onAnswer: (amount: number | null) => void;
  onDismiss: () => void;
}) {
  const colors = useColors();
  const [amount, setAmount] = useState('');
  const [quick, setQuick] = useState<number | null>(null);
  const typed = parseFloat(amount.replace(/[^0-9.]/g, ''));
  const chosen = quick ?? (Number.isFinite(typed) && typed > 0 ? Math.min(typed, 10000) : null);

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Did you give to {target?.name}?</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 21 }}>
            Your gift went straight to them — BuildBack never touches the money. Tell us how much so we can add it to
            your tally and celebrate it.
          </Text>
          <Text style={{ color: colors.text, fontWeight: '700' }}>How much did you give? (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>
            {QUICK_AMOUNTS.map((n) => (
              <Chip
                key={n}
                label={`$${n}`}
                selected={quick === n}
                onPress={() => {
                  setQuick(quick === n ? null : n);
                  setAmount('');
                }}
              />
            ))}
          </View>
          <Field
            label="Or enter an amount"
            placeholder="$35"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(t) => {
              setAmount(t);
              setQuick(null);
            }}
            hint="Only you see your exact gifts. They add to an anonymous total, which they can choose to show on their page."
          />
          <Button
            label={chosen ? `Yes, I gave ${formatMoney(chosen)}! 🎉` : 'Yes, I gave! 🎉'}
            variant="gold"
            onPress={() => onAnswer(chosen)}
          />
          <Button label="Not yet" variant="ghost" onPress={onDismiss} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

const styles = StyleSheet.create({
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Space.xl,
    gap: Space.md,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  sheetTitle: { fontSize: 22, fontWeight: '800' },
});
