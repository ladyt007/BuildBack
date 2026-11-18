import type { PhotoKind, PreparedPhoto } from '@/lib/photos';
import type {
  Business,
  BusinessClaim,
  CommunityStats,
  Nomination,
  NominatorRelationship,
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
  | 'photos'
  | 'goalAmount'
  | 'givingDisplay'
>;

/** A business added by someone who isn't the owner. The contact fields are private. */
export type NewNomination = Omit<NewBusiness, 'supportUrl' | 'status' | 'goalAmount' | 'givingDisplay'> & {
  relationship: NominatorRelationship;
  reason: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactSocial: string | null;
};

export type NewClaim = {
  claimantName: string;
  role: string;
  email: string;
  phone: string | null;
  note: string | null;
  /** The code from the invite we sent. A matching code hands over the listing right away. */
  code: string | null;
};

export type NominationForReview = { business: Business; nomination: Nomination };

export type NewNeighborRequest = Pick<
  NeighborRequest,
  | 'firstName'
  | 'title'
  | 'story'
  | 'need'
  | 'goalAmount'
  | 'givingDisplay'
  | 'fundraiserUrl'
  | 'city'
  | 'state'
  | 'lat'
  | 'lng'
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
  updateProfile(patch: { displayName?: string; homePlace?: Place | null; avatarUrl?: string | null }): Promise<Profile>;

  /** Stores a photo and returns the address to show it from. */
  uploadPhoto(photo: PreparedPhoto, kind: PhotoKind): Promise<string>;

  // Businesses
  listBusinesses(area: AreaQuery): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | null>;
  createBusiness(input: NewBusiness): Promise<Business>;
  updateBusiness(id: string, patch: Partial<NewBusiness>): Promise<Business>;
  myBusinesses(): Promise<Business[]>;
  listStatusUpdates(businessId: string): Promise<StatusUpdate[]>;
  postStatusUpdate(businessId: string, body: string): Promise<StatusUpdate>;

  // Nominations and claims
  nominateBusiness(input: NewNomination): Promise<Business>;
  /** Reviewers: nominations waiting for review, and approved ones whose owner hasn't claimed them yet. */
  listNominations(): Promise<NominationForReview[]>;
  reviewNomination(businessId: string, approve: boolean): Promise<void>;
  markInvited(businessId: string): Promise<void>;
  /** Returns 'claimed' when the invite code matched, otherwise 'pending' (a reviewer will verify). */
  claimBusiness(businessId: string, claim: NewClaim): Promise<'claimed' | 'pending'>;
  myClaim(businessId: string): Promise<BusinessClaim | null>;
  listPendingClaims(): Promise<BusinessClaim[]>;
  reviewClaim(claimId: string, approve: boolean): Promise<void>;

  // Neighbors in need
  listNeighbors(area: AreaQuery): Promise<NeighborRequest[]>;
  getNeighbor(id: string): Promise<NeighborRequest | null>;
  createNeighborRequest(input: NewNeighborRequest): Promise<NeighborRequest>;
  myNeighborRequests(): Promise<NeighborRequest[]>;
  /** The person who asked for help can change their goal and what their page shows. */
  updateNeighborRequest(
    id: string,
    patch: Partial<Pick<NeighborRequest, 'goalAmount' | 'givingDisplay'>>
  ): Promise<NeighborRequest>;
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
