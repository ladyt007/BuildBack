/**
 * Live backend using Supabase (Postgres + auth). See supabase/migrations for the schema.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { Config } from '@/lib/config';
import { boundingBox } from '@/lib/geo';
import type {
  Business,
  BusinessClaim,
  NeighborRequest,
  Nomination,
  Profile,
  Sponsor,
  StatusUpdate,
  Support,
  Wish,
} from '@/lib/types';

import type { AreaQuery, Backend, NewBusiness, NewNeighborRequest } from './backend';
import { sortBusinesses, sortNeighbors, withinArea } from './shared';

export const supabase = createClient(Config.supabaseUrl || 'http://localhost', Config.supabaseAnonKey || 'demo', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

type Row = Record<string, any>;

const toProfile = (r: Row): Profile => ({
  id: r.id,
  displayName: r.display_name,
  email: r.email,
  memberNumber: Number(r.member_number),
  joinedAt: r.joined_at,
  isAdmin: r.is_admin,
  avatarUrl: r.avatar_url ?? null,
  homePlace:
    r.home_lat != null && r.home_lng != null ? { lat: r.home_lat, lng: r.home_lng, label: r.home_label ?? '' } : null,
});

const toBusiness = (r: Row): Business => ({
  id: r.id,
  ownerId: r.owner_id,
  name: r.name,
  category: r.category,
  kind: r.kind,
  ownershipTags: r.ownership_tags ?? [],
  description: r.description,
  city: r.city,
  state: r.state,
  lat: r.lat,
  lng: r.lng,
  imageUrl: r.image_url,
  photos: r.photos ?? [],
  supportUrl: r.support_url,
  website: r.website,
  phone: r.phone,
  status: r.status,
  isPro: r.is_pro,
  featuredUntil: r.featured_until,
  claimStatus: r.claim_status ?? 'claimed',
  reviewStatus: r.review_status ?? 'approved',
  nominatedBy: r.nominated_by ?? null,
  createdAt: r.created_at,
  followerCount: r.follower_count,
  supporterCount: r.supporter_count,
  reportedTotal: Number(r.reported_total ?? 0),
});

const fromBusiness = (b: Partial<NewBusiness>): Row => {
  const row: Row = {
    name: b.name,
    category: b.category,
    kind: b.kind,
    ownership_tags: b.ownershipTags,
    description: b.description,
    city: b.city,
    state: b.state,
    lat: b.lat,
    lng: b.lng,
    image_url: b.imageUrl,
    photos: b.photos,
    support_url: b.supportUrl,
    website: b.website,
    phone: b.phone,
    status: b.status,
  };
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  return row;
};

const toNomination = (r: Row, businessName: string): Nomination => ({
  businessId: r.business_id,
  businessName,
  nominatedBy: r.nominated_by,
  relationship: r.relationship,
  reason: r.reason,
  contactName: r.contact_name,
  contactEmail: r.contact_email,
  contactPhone: r.contact_phone,
  contactSocial: r.contact_social,
  inviteCode: r.invite_code,
  invitedAt: r.invited_at,
  createdAt: r.created_at,
});

const toClaim = (r: Row): BusinessClaim => ({
  id: r.id,
  businessId: r.business_id,
  businessName: r.businesses?.name ?? '',
  userId: r.user_id,
  claimantName: r.claimant_name,
  role: r.role,
  email: r.email,
  phone: r.phone,
  note: r.note,
  status: r.status,
  createdAt: r.created_at,
});

const toNeighbor = (r: Row): NeighborRequest => ({
  id: r.id,
  ownerId: r.owner_id,
  firstName: r.first_name,
  title: r.title,
  story: r.story,
  need: r.need,
  goalAmount: r.goal_amount != null ? Number(r.goal_amount) : null,
  fundraiserUrl: r.fundraiser_url,
  city: r.city,
  state: r.state,
  lat: r.lat,
  lng: r.lng,
  imageUrl: r.image_url,
  status: r.status,
  createdAt: r.created_at,
  supporterCount: r.supporter_count,
  reportedTotal: Number(r.reported_total ?? 0),
});

const fromNeighbor = (n: NewNeighborRequest): Row => ({
  first_name: n.firstName,
  title: n.title,
  story: n.story,
  need: n.need,
  goal_amount: n.goalAmount,
  fundraiser_url: n.fundraiserUrl,
  city: n.city,
  state: n.state,
  lat: n.lat,
  lng: n.lng,
});

const toWish = (r: Row): Wish => ({
  id: r.id,
  userId: r.user_id,
  category: r.category,
  kind: r.kind,
  note: r.note,
  lat: r.lat,
  lng: r.lng,
  placeLabel: r.place_label,
  createdAt: r.created_at,
});

const toUpdate = (r: Row): StatusUpdate => ({
  id: r.id,
  businessId: r.business_id,
  body: r.body,
  createdAt: r.created_at,
});

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** Like check(), for queries that must return exactly one row. */
function one<T>(result: { data: T | null; error: { message: string } | null }): T {
  const data = check(result);
  if (data == null) throw new Error('Not found.');
  return data;
}

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Please sign in first.');
  return id;
}

/** Applies a lat/lng bounding box so the database only returns nearby rows. */
function inArea<Q extends { gte: any; lte: any }>(query: Q, area: AreaQuery): Q {
  if (!area.center || area.radiusMiles === null) return query;
  const box = boundingBox(area.center, area.radiusMiles);
  return query.gte('lat', box.minLat).lte('lat', box.maxLat).gte('lng', box.minLng).lte('lng', box.maxLng) as Q;
}

const LIST_LIMIT = 300;
const PHOTO_BUCKET = 'photos';

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const supabaseBackend: Backend = {
  async currentProfile() {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    if (!id) return null;
    const row = check(await supabase.from('profiles').select('*').eq('id', id).maybeSingle());
    return row ? toProfile(row) : null;
  },

  async signUp(displayName, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    if (error) throw new Error(error.message);
    if (!data.session) {
      throw new Error('Check your email to confirm your account, then sign in.');
    }
    const profile = await this.currentProfile();
    if (!profile) throw new Error('Your account was created, but we couldn’t load it. Try signing in.');
    return profile;
  },

  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
    const profile = await this.currentProfile();
    if (!profile) throw new Error('We couldn’t load your profile.');
    return profile;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async updateProfile(patch) {
    const id = await userId();
    const row: Row = {};
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
    if (patch.homePlace !== undefined) {
      row.home_lat = patch.homePlace?.lat ?? null;
      row.home_lng = patch.homePlace?.lng ?? null;
      row.home_label = patch.homePlace?.label ?? null;
    }
    return toProfile(one(await supabase.from('profiles').update(row).eq('id', id).select().single()));
  },

  async uploadPhoto(photo, kind) {
    const id = await userId();
    // Each person can only write inside their own folder (see the storage policies).
    const path = `${id}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, base64ToBytes(photo.base64), { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error(error.message);
    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async listBusinesses(area) {
    const rows = check(await inArea(supabase.from('businesses').select('*'), area).limit(LIST_LIMIT));
    return sortBusinesses(withinArea((rows ?? []).map(toBusiness), area), area.center);
  },

  async getBusiness(id) {
    const row = check(await supabase.from('businesses').select('*').eq('id', id).maybeSingle());
    return row ? toBusiness(row) : null;
  },

  async createBusiness(input) {
    const owner_id = await userId();
    const row = one<Row>(
      await supabase
        .from('businesses')
        .insert({ ...fromBusiness(input), owner_id })
        .select()
        .single()
    );
    return toBusiness(row);
  },

  async updateBusiness(id, patch) {
    return toBusiness(one(await supabase.from('businesses').update(fromBusiness(patch)).eq('id', id).select().single()));
  },

  async myBusinesses() {
    const id = await userId();
    return (check(await supabase.from('businesses').select('*').eq('owner_id', id)) ?? []).map(toBusiness);
  },

  async nominateBusiness(input) {
    const { relationship, reason, contactName, contactEmail, contactPhone, contactSocial, ...listing } = input;
    const row = one<Row>(
      await supabase.rpc('nominate_business', {
        listing: fromBusiness(listing),
        private: {
          relationship,
          reason,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          contact_social: contactSocial,
        },
      })
    );
    return toBusiness(row);
  },

  async listNominations() {
    const rows: Row[] = check(await supabase.from('business_nominations').select('*').order('created_at')) ?? [];
    if (rows.length === 0) return [];
    const businesses: Row[] =
      check(
        await supabase
          .from('businesses')
          .select('*')
          .in('id', rows.map((r) => r.business_id))
          .eq('claim_status', 'unclaimed')
          .neq('review_status', 'rejected')
      ) ?? [];
    const byId = new Map(businesses.map((b) => [b.id, toBusiness(b)]));
    return rows
      .filter((r) => byId.has(r.business_id))
      .map((r) => ({ business: byId.get(r.business_id)!, nomination: toNomination(r, byId.get(r.business_id)!.name) }));
  },

  async reviewNomination(businessId, approve) {
    check(await supabase.rpc('review_nomination', { target: businessId, approve }));
  },

  async markInvited(businessId) {
    check(await supabase.rpc('mark_invited', { target: businessId }));
  },

  async claimBusiness(businessId, claim) {
    const result = check(
      await supabase.rpc('claim_business', {
        target: businessId,
        claim: {
          claimant_name: claim.claimantName,
          role: claim.role,
          email: claim.email,
          phone: claim.phone,
          note: claim.note,
          code: claim.code,
        },
      })
    );
    return result === 'claimed' ? 'claimed' : 'pending';
  },

  async myClaim(businessId) {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    if (!id) return null;
    const row = check(
      await supabase
        .from('business_claims')
        .select('*, businesses(name)')
        .eq('business_id', businessId)
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    return row ? toClaim(row) : null;
  },

  async listPendingClaims() {
    const rows: Row[] =
      check(await supabase.from('business_claims').select('*, businesses(name)').eq('status', 'pending').order('created_at')) ?? [];
    return rows.map(toClaim);
  },

  async reviewClaim(claimId, approve) {
    check(await supabase.rpc('review_claim', { target: claimId, approve }));
  },

  async listStatusUpdates(businessId) {
    const rows = check(
      await supabase
        .from('status_updates')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50)
    );
    return (rows ?? []).map(toUpdate);
  },

  async postStatusUpdate(businessId, body) {
    return toUpdate(
      one(await supabase.from('status_updates').insert({ business_id: businessId, body: body.trim() }).select().single())
    );
  },

  async listNeighbors(area) {
    const rows = check(
      await inArea(supabase.from('neighbor_requests').select('*').in('status', ['approved', 'fulfilled']), area).limit(
        LIST_LIMIT
      )
    );
    return sortNeighbors(withinArea((rows ?? []).map(toNeighbor), area), area.center);
  },

  async getNeighbor(id) {
    const row = check(await supabase.from('neighbor_requests').select('*').eq('id', id).maybeSingle());
    return row ? toNeighbor(row) : null;
  },

  async createNeighborRequest(input) {
    const owner_id = await userId();
    return toNeighbor(
      one(await supabase.from('neighbor_requests').insert({ ...fromNeighbor(input), owner_id }).select().single())
    );
  },

  async myNeighborRequests() {
    const id = await userId();
    return (check(await supabase.from('neighbor_requests').select('*').eq('owner_id', id)) ?? []).map(toNeighbor);
  },

  async listPendingNeighbors() {
    const rows = check(
      await supabase.from('neighbor_requests').select('*').eq('status', 'pending').order('created_at').limit(100)
    );
    return (rows ?? []).map(toNeighbor);
  },

  async reviewNeighbor(id, approve) {
    check(await supabase.rpc('review_neighbor_request', { request_id: id, approve }));
  },

  async listWishes(area) {
    const rows = check(await inArea(supabase.from('wishes').select('*'), area).limit(2000));
    return withinArea((rows ?? []).map(toWish), area);
  },

  async createWish(input) {
    const user_id = await userId();
    const row = one<Row>(
      await supabase
        .from('wishes')
        .insert({
          user_id,
          category: input.category,
          kind: input.kind.trim(),
          note: input.note,
          lat: input.lat,
          lng: input.lng,
          place_label: input.placeLabel,
        })
        .select()
        .single()
    );
    return toWish(row);
  },

  async myActivity() {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    if (!id) return { supports: [], wishes: [], followingIds: [], nominationIds: [], ownedBusinessIds: [] };
    const [supports, wishes, follows, nominated, owned] = await Promise.all([
      supabase.from('supports').select('*').eq('user_id', id),
      supabase.from('wishes').select('*').eq('user_id', id),
      supabase.from('follows').select('business_id').eq('user_id', id),
      supabase.from('businesses').select('id').eq('nominated_by', id),
      supabase.from('businesses').select('id').eq('owner_id', id),
    ]);
    return {
      supports: (check(supports) ?? []).map(
        (r: Row): Support => ({
          id: r.id,
          userId: r.user_id,
          targetType: r.target_type,
          targetId: r.target_id,
          amount: r.amount != null ? Number(r.amount) : null,
          createdAt: r.created_at,
        })
      ),
      wishes: (check(wishes) ?? []).map(toWish),
      followingIds: (check(follows) ?? []).map((r: Row) => r.business_id),
      nominationIds: (check(nominated) ?? []).map((r: Row) => r.id),
      ownedBusinessIds: (check(owned) ?? []).map((r: Row) => r.id),
    };
  },

  async setFollowing(businessId, following) {
    const user_id = await userId();
    if (following) {
      const { error } = await supabase.from('follows').insert({ user_id, business_id: businessId });
      // Already following is fine.
      if (error && !error.message.includes('duplicate')) throw new Error(error.message);
    } else {
      check(await supabase.from('follows').delete().eq('user_id', user_id).eq('business_id', businessId));
    }
  },

  async recordSupport(targetType, targetId, amount) {
    const user_id = await userId();
    check(await supabase.from('supports').insert({ user_id, target_type: targetType, target_id: targetId, amount }));
  },

  async communityStats() {
    return check(await supabase.rpc('community_stats'));
  },

  async listSponsors() {
    const rows: Row[] = check(await supabase.from('sponsors').select('*')) ?? [];
    const sponsors: Sponsor[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      tagline: r.tagline,
      url: r.url,
      city: r.city,
      state: r.state,
    }));
    return sponsors;
  },
};
