import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { useCelebrate } from '@/components/celebration';
import { Button, Field } from '@/components/ui';
import { backend, type NewWish } from '@/data';
import { groupWishes } from '@/data/shared';
import { useColors } from '@/hooks/use-colors';
import { Config } from '@/lib/config';
import { openExternal } from '@/lib/links';
import { newlyEarnedBadges, summarizeImpact, type ImpactSummary } from '@/lib/gamification';
import { loadJSON, saveJSON } from '@/lib/storage';
import { Radius, Space } from '@/lib/theme';
import type { CommunityStats, MyActivity, Place, Profile, SupportTarget } from '@/lib/types';

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
  setRadiusMiles: (r: number | null) => void;
  /** Returns false (and sends people to sign up) when they aren't signed in. */
  requireAccount: () => boolean;
  toggleFollow: (businessId: string) => Promise<void>;
  give: (target: GiveTarget) => Promise<void>;
  addWish: (wish: NewWish) => Promise<void>;
  refresh: () => Promise<void>;
  touch: () => void;
};

/** "an Irish pub", "a barber shop" */
function withArticle(kind: string): string {
  return /^[aeiou]/i.test(kind) ? `an ${kind}` : `a ${kind}`;
}

const emptyActivity: MyActivity = { supports: [], wishes: [], followingIds: [] };
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

  const setRadiusMiles = useCallback(
    (r: number | null) => {
      setRadiusState(r);
      persistArea(place, r);
    },
    [persistArea, place]
  );

  const requireAccount = useCallback(() => {
    if (profile) return true;
    router.push('/auth?mode=signup');
    return false;
  }, [profile]);

  const toggleFollow = useCallback(
    async (businessId: string) => {
      if (!requireAccount()) return;
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
      if (!requireAccount()) return;
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
      const earned = newlyEarnedBadges(before, after);
      const helped =
        target.type === 'business'
          ? `You've helped ${after.businessesHelped} ${after.businessesHelped === 1 ? 'business' : 'businesses'}`
          : `You've helped ${after.neighborsHelped} ${after.neighborsHelped === 1 ? 'neighbor' : 'neighbors'}`;
      const leveledUp = after.level.name !== before.level.name;
      celebrate({
        style: 'money',
        emoji: target.type === 'business' ? '🏪' : '💛',
        title: `You just built up ${target.name}!`,
        message: `${helped} so far. ${after.points} builder points and counting.`,
        extras: [
          ...(leveledUp ? [`${after.level.emoji} Level up: ${after.level.name}!`] : []),
          ...earned.map((b) => `${b.emoji} Badge earned: ${b.name}`),
        ],
      });
    },
    [celebrate, impact, pendingGift, profile, touch]
  );

  const addWish = useCallback(
    async (wish: NewWish) => {
      if (!requireAccount()) return;
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
    setRadiusMiles,
    requireAccount,
    toggleFollow,
    give,
    addWish,
    refresh,
    touch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <GiftPrompt key={pendingGift ? `${pendingGift.type}-${pendingGift.id}` : 'none'} target={pendingGift} onAnswer={confirmGift} onDismiss={() => setPendingGift(null)} />
    </AppContext.Provider>
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
  const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''));

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Did you give to {target?.name}?</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 21 }}>
            Your gift went straight to them — BuildBack never touches the money. Let us know so we can count it toward
            your impact.
          </Text>
          <Field
            label="How much? (optional, only you see this)"
            placeholder="$25"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Button
            label="Yes, I gave! 🎉"
            variant="gold"
            onPress={() => onAnswer(Number.isFinite(parsed) && parsed > 0 ? parsed : null)}
          />
          <Button label="Not yet" variant="ghost" onPress={onDismiss} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
