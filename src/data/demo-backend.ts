/**
 * Demo backend: keeps everything on this device, starting from sample data.
 * Used automatically when Supabase isn't configured, so the app can be tried right away.
 */
import { loadJSON, newId, saveJSON } from '@/lib/storage';
import type {
  Business,
  NeighborRequest,
  Profile,
  StatusUpdate,
  Support,
  Wish,
} from '@/lib/types';

import type { Backend } from './backend';
import { seedBusinesses, seedMemberCount, seedNeighbors, seedSponsors, seedStatusUpdates, seedWishes } from './seed';
import { sortBusinesses, sortNeighbors, withinArea } from './shared';

type DemoUser = { profile: Profile; password: string };

type DemoDb = {
  version: 1;
  users: Record<string, DemoUser>; // keyed by lower-case email
  sessionUserId: string | null;
  businesses: Business[];
  updates: StatusUpdate[];
  neighbors: NeighborRequest[];
  wishes: Wish[];
  supports: Support[];
  follows: { userId: string; businessId: string }[];
};

const KEY = 'buildback.demo.db.v1';

function freshDb(): DemoDb {
  return {
    version: 1,
    users: {},
    sessionUserId: null,
    businesses: seedBusinesses,
    updates: seedStatusUpdates,
    neighbors: seedNeighbors,
    wishes: seedWishes,
    supports: [],
    follows: [],
  };
}

let cache: DemoDb | null = null;

async function db(): Promise<DemoDb> {
  if (!cache) cache = await loadJSON<DemoDb>(KEY, freshDb());
  return cache;
}

async function commit() {
  if (cache) await saveJSON(KEY, cache);
}

async function me(): Promise<Profile> {
  const d = await db();
  const user = Object.values(d.users).find((u) => u.profile.id === d.sessionUserId);
  if (!user) throw new Error('Please sign in first.');
  return user.profile;
}

const delay = () => new Promise((r) => setTimeout(r, 120));

export const demoBackend: Backend = {
  async currentProfile() {
    const d = await db();
    return Object.values(d.users).find((u) => u.profile.id === d.sessionUserId)?.profile ?? null;
  },

  async signUp(displayName, email, password) {
    await delay();
    const d = await db();
    const key = email.trim().toLowerCase();
    if (d.users[key]) throw new Error('An account with that email already exists. Try signing in.');
    if (password.length < 8) throw new Error('Passwords need at least 8 characters.');
    const profile: Profile = {
      id: newId(),
      displayName: displayName.trim(),
      email: key,
      memberNumber: seedMemberCount + Object.keys(d.users).length + 1,
      joinedAt: new Date().toISOString(),
      // In demo mode everyone can try the review queue.
      isAdmin: true,
      homePlace: null,
    };
    d.users[key] = { profile, password };
    d.sessionUserId = profile.id;
    await commit();
    return profile;
  },

  async signIn(email, password) {
    await delay();
    const d = await db();
    const user = d.users[email.trim().toLowerCase()];
    if (!user || user.password !== password) throw new Error('That email and password don’t match.');
    d.sessionUserId = user.profile.id;
    await commit();
    return user.profile;
  },

  async signOut() {
    const d = await db();
    d.sessionUserId = null;
    await commit();
  },

  async updateProfile(patch) {
    const d = await db();
    const profile = await me();
    const user = d.users[profile.email];
    user.profile = { ...user.profile, ...patch };
    await commit();
    return user.profile;
  },

  async uploadPhoto(photo) {
    await me();
    // Demo mode keeps the (already compressed) photo on this device.
    return `data:image/jpeg;base64,${photo.base64}`;
  },

  async listBusinesses(area) {
    const d = await db();
    return sortBusinesses(withinArea(d.businesses, area), area.center);
  },

  async getBusiness(id) {
    return (await db()).businesses.find((b) => b.id === id) ?? null;
  },

  async createBusiness(input) {
    const d = await db();
    const profile = await me();
    const business: Business = {
      ...input,
      photos: input.photos ?? [],
      id: newId(),
      ownerId: profile.id,
      isPro: false,
      featuredUntil: null,
      createdAt: new Date().toISOString(),
      followerCount: 0,
      supporterCount: 0,
    };
    d.businesses.unshift(business);
    await commit();
    return business;
  },

  async updateBusiness(id, patch) {
    const d = await db();
    const profile = await me();
    const b = d.businesses.find((x) => x.id === id);
    if (!b || b.ownerId !== profile.id) throw new Error('You can only edit your own business.');
    Object.assign(b, patch);
    await commit();
    return b;
  },

  async myBusinesses() {
    const d = await db();
    const profile = await me();
    return d.businesses.filter((b) => b.ownerId === profile.id);
  },

  async listStatusUpdates(businessId) {
    const d = await db();
    return d.updates
      .filter((u) => u.businessId === businessId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async postStatusUpdate(businessId, body) {
    const d = await db();
    const profile = await me();
    const b = d.businesses.find((x) => x.id === businessId);
    if (!b || b.ownerId !== profile.id) throw new Error('Only the owner can post updates.');
    const update: StatusUpdate = { id: newId(), businessId, body: body.trim(), createdAt: new Date().toISOString() };
    d.updates.unshift(update);
    await commit();
    return update;
  },

  async listNeighbors(area) {
    const d = await db();
    const visible = d.neighbors.filter((n) => n.status === 'approved' || n.status === 'fulfilled');
    return sortNeighbors(withinArea(visible, area), area.center);
  },

  async getNeighbor(id) {
    return (await db()).neighbors.find((n) => n.id === id) ?? null;
  },

  async createNeighborRequest(input) {
    const d = await db();
    const profile = await me();
    const request: NeighborRequest = {
      ...input,
      id: newId(),
      ownerId: profile.id,
      imageUrl: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      supporterCount: 0,
    };
    d.neighbors.unshift(request);
    await commit();
    return request;
  },

  async myNeighborRequests() {
    const d = await db();
    const profile = await me();
    return d.neighbors.filter((n) => n.ownerId === profile.id);
  },

  async listPendingNeighbors() {
    const d = await db();
    return d.neighbors.filter((n) => n.status === 'pending');
  },

  async reviewNeighbor(id, approve) {
    const d = await db();
    const profile = await me();
    if (!profile.isAdmin) throw new Error('Only reviewers can do that.');
    const n = d.neighbors.find((x) => x.id === id);
    if (n) n.status = approve ? 'approved' : 'rejected';
    await commit();
  },

  async listWishes(area) {
    return withinArea((await db()).wishes, area);
  },

  async createWish(input) {
    const d = await db();
    const profile = await me();
    const wish: Wish = { ...input, id: newId(), userId: profile.id, createdAt: new Date().toISOString() };
    d.wishes.unshift(wish);
    await commit();
    return wish;
  },

  async myActivity() {
    const d = await db();
    const profile = await this.currentProfile();
    if (!profile) return { supports: [], wishes: [], followingIds: [] };
    return {
      supports: d.supports.filter((s) => s.userId === profile.id),
      wishes: d.wishes.filter((w) => w.userId === profile.id),
      followingIds: d.follows.filter((f) => f.userId === profile.id).map((f) => f.businessId),
    };
  },

  async setFollowing(businessId, following) {
    const d = await db();
    const profile = await me();
    const exists = d.follows.some((f) => f.userId === profile.id && f.businessId === businessId);
    const b = d.businesses.find((x) => x.id === businessId);
    if (following && !exists) {
      d.follows.push({ userId: profile.id, businessId });
      if (b) b.followerCount += 1;
    } else if (!following && exists) {
      d.follows = d.follows.filter((f) => !(f.userId === profile.id && f.businessId === businessId));
      if (b) b.followerCount = Math.max(0, b.followerCount - 1);
    }
    await commit();
  },

  async recordSupport(targetType, targetId, amount) {
    const d = await db();
    const profile = await me();
    const firstTime = !d.supports.some((s) => s.userId === profile.id && s.targetId === targetId);
    d.supports.push({ id: newId(), userId: profile.id, targetType, targetId, amount, createdAt: new Date().toISOString() });
    if (firstTime) {
      const target =
        targetType === 'business'
          ? d.businesses.find((b) => b.id === targetId)
          : d.neighbors.find((n) => n.id === targetId);
      if (target) target.supporterCount += 1;
    }
    await commit();
  },

  async communityStats() {
    const d = await db();
    return {
      businessesHelped: d.businesses.filter((b) => b.supporterCount > 0).length,
      neighborsHelped: d.neighbors.filter((n) => n.supporterCount > 0).length,
      members: seedMemberCount + Object.keys(d.users).length,
      wishes: d.wishes.length,
      businessesListed: d.businesses.length,
    };
  },

  async listSponsors() {
    return seedSponsors;
  },
};
