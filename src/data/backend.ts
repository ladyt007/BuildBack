import type {
  Business,
  CommunityStats,
  LatLng,
  MyActivity,
  NeighborRequest,
  Place,
  Profile,
  Sponsor,
  StatusUpdate,
  SupportTarget,
  Wish,
} from '@/lib/types';

/** Where to look. `radiusMiles: null` means nationwide. */
export type AreaQuery = { center: LatLng | null; radiusMiles: number | null };

export type NewBusiness = Pick<
  Business,
  | 'name'
  | 'category'
  | 'kind'
  | 'ownershipTags'
  | 'description'
  | 'city'
  | 'state'
  | 'lat'
  | 'lng'
  | 'supportUrl'
  | 'website'
  | 'phone'
  | 'status'
  | 'imageUrl'
>;

export type NewNeighborRequest = Pick<
  NeighborRequest,
  'firstName' | 'title' | 'story' | 'need' | 'goalAmount' | 'fundraiserUrl' | 'city' | 'state' | 'lat' | 'lng'
>;

export type NewWish = Pick<Wish, 'category' | 'kind' | 'note' | 'lat' | 'lng' | 'placeLabel'>;

/**
 * Everything the app needs from a backend. There are two implementations:
 * - demo-backend: sample data stored on the device, used when Supabase isn't configured
 * - supabase-backend: the real, shared database
 */
export interface Backend {
  // Accounts
  currentProfile(): Promise<Profile | null>;
  signUp(displayName: string, email: string, password: string): Promise<Profile>;
  signIn(email: string, password: string): Promise<Profile>;
  signOut(): Promise<void>;
  updateProfile(patch: { displayName?: string; homePlace?: Place | null }): Promise<Profile>;

  // Businesses
  listBusinesses(area: AreaQuery): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | null>;
  createBusiness(input: NewBusiness): Promise<Business>;
  updateBusiness(id: string, patch: Partial<NewBusiness>): Promise<Business>;
  myBusinesses(): Promise<Business[]>;
  listStatusUpdates(businessId: string): Promise<StatusUpdate[]>;
  postStatusUpdate(businessId: string, body: string): Promise<StatusUpdate>;

  // Neighbors in need
  listNeighbors(area: AreaQuery): Promise<NeighborRequest[]>;
  getNeighbor(id: string): Promise<NeighborRequest | null>;
  createNeighborRequest(input: NewNeighborRequest): Promise<NeighborRequest>;
  myNeighborRequests(): Promise<NeighborRequest[]>;
  listPendingNeighbors(): Promise<NeighborRequest[]>;
  reviewNeighbor(id: string, approve: boolean): Promise<void>;

  // Wishes ("What's missing?")
  listWishes(area: AreaQuery): Promise<Wish[]>;
  createWish(input: NewWish): Promise<Wish>;

  // My activity
  myActivity(): Promise<MyActivity>;
  setFollowing(businessId: string, following: boolean): Promise<void>;
  recordSupport(targetType: SupportTarget, targetId: string, amount: number | null): Promise<void>;

  // Community
  communityStats(): Promise<CommunityStats>;
  listSponsors(area: AreaQuery): Promise<Sponsor[]>;
}
