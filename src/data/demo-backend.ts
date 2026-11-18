/**
 * Demo backend: keeps everything on this device, starting from sample data.
 * Used automatically when Supabase isn't configured, so the app can be tried right away.
 */
import { loadJSON, newId, saveJSON } from '@/lib/storage';
import type {
  Business,
  BusinessClaim,
  NeighborRequest,
  Nomination,
  Report,
  Profile,
  StatusUpdate,
  Support,
  Wish,
} from '@/lib/types';

import type { Backend } from './backend';
import {
  seedBusinesses,
  seedMemberCount,
  seedNeighbors,
  seedNominations,
  seedSponsors,
  seedStatusUpdates,
  seedWishes,
} from './seed';
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
  nominations: Nomination[];
  claims: BusinessClaim[];
  reports: Report[];
  blocks: { userId: string; blockedUserId: string }[];
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
    nominations: seedNominations,
    claims: [],
    reports: [],
    blocks: [],
  };
}

/** Brings data saved by an older version of the app up to date. */
function upgrade(d: DemoDb): DemoDb {
  d.nominations ??= seedNominations;
  d.claims ??= [];
  d.reports ??= [];
  d.blocks ??= [];
  const seedById = new Map(seedBusinesses.map((b) => [b.id, b]));
  for (const b of d.businesses) {
    const seed = seedById.get(b.id);
    b.photos ??= [];
    b.claimStatus ??= seed?.claimStatus ?? 'claimed';
    b.reviewStatus ??= 'approved';
    b.nominatedBy ??= seed?.nominatedBy ?? null;
    b.reportedTotal ??= seed?.reportedTotal ?? 0;
    b.goalAmount ??= seed?.goalAmount ?? null;
    b.givingDisplay ??= seed?.givingDisplay ?? 'amount_and_count';
  }
  const neighborSeedById = new Map(seedNeighbors.map((n) => [n.id, n]));
  for (const n of d.neighbors) {
    n.reportedTotal ??= neighborSeedById.get(n.id)?.reportedTotal ?? 0;
    n.givingDisplay ??= neighborSeedById.get(n.id)?.givingDisplay ?? 'amount_and_count';
  }
  for (const seed of seedBusinesses) {
    if (!d.businesses.some((b) => b.id === seed.id)) d.businesses.push(seed);
  }
  return d;
}

/** A short code we send to the business so its owner can claim the listing. */
function inviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Approved listings, plus pending ones the viewer nominated or owns. */
function visibleTo(b: Business, userId: string | null): boolean {
  return b.reviewStatus === 'approved' || (!!userId && (b.ownerId === userId || b.nominatedBy === userId));
}

let cache: DemoDb | null = null;

async function db(): Promise<DemoDb> {
  if (!cache) cache = upgrade(await loadJSON<DemoDb>(KEY, freshDb()));
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
    const visible = d.businesses.filter((b) => visibleTo(b, d.sessionUserId));
    return sortBusinesses(withinArea(visible, area), area.center);
  },

  async getBusiness(id) {
    const d = await db();
    const b = d.businesses.find((x) => x.id === id);
    if (!b) return null;
    const viewer = Object.values(d.users).find((u) => u.profile.id === d.sessionUserId)?.profile;
    return visibleTo(b, d.sessionUserId) || viewer?.isAdmin ? b : null;
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
      claimStatus: 'claimed',
      reviewStatus: 'approved',
      nominatedBy: null,
      createdAt: new Date().toISOString(),
      followerCount: 0,
      supporterCount: 0,
      reportedTotal: 0,
    };
    d.businesses.unshift(business);
    await commit();
    return business;
  },

  async nominateBusiness(input) {
    const d = await db();
    const profile = await me();
    const { relationship, reason, contactName, contactEmail, contactPhone, contactSocial, ...listing } = input;
    const business: Business = {
      ...listing,
      id: newId(),
      ownerId: null,
      supportUrl: null,
      status: 'open',
      isPro: false,
      featuredUntil: null,
      claimStatus: 'unclaimed',
      reviewStatus: 'pending',
      nominatedBy: profile.id,
      goalAmount: null,
      givingDisplay: 'amount_and_count',
      createdAt: new Date().toISOString(),
      followerCount: 0,
      supporterCount: 0,
      reportedTotal: 0,
    };
    d.businesses.unshift(business);
    d.nominations.unshift({
      businessId: business.id,
      businessName: business.name,
      nominatedBy: profile.id,
      relationship,
      reason,
      contactName,
      contactEmail,
      contactPhone,
      contactSocial,
      inviteCode: inviteCode(),
      invitedAt: null,
      createdAt: business.createdAt,
    });
    await commit();
    return business;
  },

  async listNominations() {
    const d = await db();
    const profile = await me();
    if (!profile.isAdmin) throw new Error('Only reviewers can see nominations.');
    return d.nominations
      .map((nomination) => ({ nomination, business: d.businesses.find((b) => b.id === nomination.businessId)! }))
      .filter((n) => n.business && n.business.claimStatus === 'unclaimed' && n.business.reviewStatus !== 'rejected');
  },

  async reviewNomination(businessId, approve) {
    const d = await db();
    const profile = await me();
    if (!profile.isAdmin) throw new Error('Only reviewers can do that.');
    const b = d.businesses.find((x) => x.id === businessId);
    if (b) b.reviewStatus = approve ? 'approved' : 'rejected';
    await commit();
  },

  async markInvited(businessId) {
    const d = await db();
    const n = d.nominations.find((x) => x.businessId === businessId);
    if (n) n.invitedAt = new Date().toISOString();
    await commit();
  },

  async claimBusiness(businessId, claim) {
    const d = await db();
    const profile = await me();
    const b = d.businesses.find((x) => x.id === businessId);
    if (!b || b.claimStatus !== 'unclaimed') throw new Error('This listing has already been claimed.');
    const nomination = d.nominations.find((x) => x.businessId === businessId);
    const codeMatches =
      !!claim.code && !!nomination && claim.code.trim().toUpperCase() === nomination.inviteCode.toUpperCase();
    const record: BusinessClaim = {
      id: newId(),
      businessId,
      businessName: b.name,
      userId: profile.id,
      claimantName: claim.claimantName,
      role: claim.role,
      email: claim.email,
      phone: claim.phone,
      note: claim.note,
      status: codeMatches ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    };
    d.claims.unshift(record);
    if (codeMatches) {
      b.ownerId = profile.id;
      b.claimStatus = 'claimed';
      b.reviewStatus = 'approved';
    }
    await commit();
    return codeMatches ? 'claimed' : 'pending';
  },

  async myClaim(businessId) {
    const d = await db();
    if (!d.sessionUserId) return null;
    return d.claims.find((c) => c.businessId === businessId && c.userId === d.sessionUserId) ?? null;
  },

  async listPendingClaims() {
    const d = await db();
    const profile = await me();
    if (!profile.isAdmin) throw new Error('Only reviewers can see claims.');
    return d.claims.filter((c) => c.status === 'pending');
  },

  async reviewClaim(claimId, approve) {
    const d = await db();
    const profile = await me();
    if (!profile.isAdmin) throw new Error('Only reviewers can do that.');
    const c = d.claims.find((x) => x.id === claimId);
    if (!c) return;
    c.status = approve ? 'approved' : 'rejected';
    const b = d.businesses.find((x) => x.id === c.businessId);
    if (approve && b) {
      b.ownerId = c.userId;
      b.claimStatus = 'claimed';
      b.reviewStatus = 'approved';
      // Anyone else waiting to claim the same listing is turned down.
      d.claims.filter((x) => x.businessId === c.businessId && x.id !== c.id && x.status === 'pending').forEach((x) => (x.status = 'rejected'));
    }
    await commit();
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
      reportedTotal: 0,
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

  async updateNeighborRequest(id, patch) {
    const d = await db();
    const profile = await me();
    const n = d.neighbors.find((x) => x.id === id);
    if (!n || n.ownerId !== profile.id) throw new Error('You can only change your own request.');
    Object.assign(n, patch);
    await commit();
    return n;
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
    if (!profile) {
      return { supports: [], wishes: [], followingIds: [], nominationIds: [], ownedBusinessIds: [], blockedUserIds: [] };
    }
    return {
      supports: d.supports.filter((s) => s.userId === profile.id),
      wishes: d.wishes.filter((w) => w.userId === profile.id),
      followingIds: d.follows.filter((f) => f.userId === profile.id).map((f) => f.businessId),
      nominationIds: d.businesses.filter((b) => b.nominatedBy === profile.id).map((b) => b.id),
      ownedBusinessIds: d.businesses.filter((b) => b.ownerId === profile.id).map((b) => b.id),
      blockedUserIds: d.blocks.filter((b) => b.userId === profile.id).map((b) => b.blockedUserId),
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
    const target =
      targetType === 'business' ? d.businesses.find((b) => b.id === targetId) : d.neighbors.find((n) => n.id === targetId);
    if (target) {
      if (firstTime) target.supporterCount += 1;
      target.reportedTotal = (target.reportedTotal ?? 0) + (amount ?? 0);
    }
    await commit();
  },

  async reportContent(targetType, targetId, reason, details) {
    const d = await db();
    const profile = await me();
    d.reports.unshift({
      id: newId(),
      reporterId: profile.id,
      targetType,
      targetId,
      reason,
      details,
      createdAt: new Date().toISOString(),
    });
    await commit();
  },

  async listReports() {
    const d = await db();
    const profile = await me();
    if (!profile.isAdmin) throw new Error('Only reviewers can see reports.');
    return d.reports;
  },

  async resolveReport(reportId, hide) {
    const d = await db();
    const profile = await me();
    if (!profile.isAdmin) throw new Error('Only reviewers can do that.');
    const r = d.reports.find((x) => x.id === reportId);
    if (!r) return;
    if (hide) {
      if (r.targetType === 'business') d.businesses = d.businesses.filter((b) => b.id !== r.targetId);
      if (r.targetType === 'neighbor') {
        const n = d.neighbors.find((x) => x.id === r.targetId);
        if (n) n.status = 'rejected';
      }
      if (r.targetType === 'update') d.updates = d.updates.filter((u) => u.id !== r.targetId);
    }
    d.reports = d.reports.filter((x) => !(x.targetType === r.targetType && x.targetId === r.targetId));
    await commit();
  },

  async setBlocked(userId, blocked) {
    const d = await db();
    const profile = await me();
    d.blocks = d.blocks.filter((b) => !(b.userId === profile.id && b.blockedUserId === userId));
    if (blocked && userId !== profile.id) d.blocks.push({ userId: profile.id, blockedUserId: userId });
    await commit();
  },

  async deleteAccount() {
    const d = await db();
    const profile = await me();
    const id = profile.id;
    const owned = new Set(d.businesses.filter((b) => b.ownerId === id).map((b) => b.id));
    d.businesses = d.businesses.filter((b) => !owned.has(b.id));
    d.updates = d.updates.filter((u) => !owned.has(u.businessId));
    d.neighbors = d.neighbors.filter((n) => n.ownerId !== id);
    d.wishes = d.wishes.filter((w) => w.userId !== id);
    d.supports = d.supports.filter((s) => s.userId !== id);
    d.follows = d.follows.filter((f) => f.userId !== id && !owned.has(f.businessId));
    d.claims = d.claims.filter((c) => c.userId !== id);
    d.blocks = d.blocks.filter((b) => b.userId !== id && b.blockedUserId !== id);
    delete d.users[profile.email];
    d.sessionUserId = null;
    await commit();
  },

  async communityStats() {
    const d = await db();
    return {
      businessesHelped: d.businesses.filter((b) => b.supporterCount > 0).length,
      neighborsHelped: d.neighbors.filter((n) => n.supporterCount > 0).length,
      members: seedMemberCount + Object.keys(d.users).length,
      wishes: d.wishes.length,
      businessesListed: d.businesses.filter((b) => b.reviewStatus === 'approved').length,
    };
  },

  async listSponsors() {
    return seedSponsors;
  },
};
