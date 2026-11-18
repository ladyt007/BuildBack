export type LatLng = { lat: number; lng: number };

export type Place = LatLng & {
  label: string; // e.g. "Macon, GA" or "31201"
};

export type Profile = {
  id: string;
  displayName: string;
  email: string;
  memberNumber: number;
  joinedAt: string;
  isAdmin: boolean;
  homePlace?: Place | null;
  avatarUrl?: string | null;
};

/** What a business or neighbor shows publicly about the gifts they receive. */
export type GivingDisplay = 'amount_and_count' | 'amount' | 'count' | 'hidden';

export type BusinessStatus = 'open' | 'reopening' | 'struggling' | 'temporarily_closed';

export type Business = {
  id: string;
  ownerId: string | null;
  name: string;
  category: string; // top-level category id, e.g. "beauty"
  kind: string; // free text: "Barber shop", "Irish pub"
  ownershipTags: string[];
  description: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  imageUrl: string | null; // cover photo
  photos: string[]; // gallery, up to MAX_BUSINESS_PHOTOS
  supportUrl: string | null; // their own Stripe/PayPal/Cash App/GoFundMe link
  website: string | null;
  phone: string | null;
  status: BusinessStatus;
  isPro: boolean;
  featuredUntil: string | null;
  /** 'unclaimed' = nominated by the community and not yet taken over by its owner. */
  claimStatus: ClaimStatus;
  /** Nominated listings are reviewed before they're public. */
  reviewStatus: ReviewStatus;
  nominatedBy: string | null;
  createdAt: string;
  followerCount: number;
  supporterCount: number;
  /** Total of the amounts givers reported through BuildBack. Self-reported, not verified. */
  reportedTotal: number;
  /** Optional fundraising goal; null means open to any amount. */
  goalAmount: number | null;
  givingDisplay: GivingDisplay;
};

export type ClaimStatus = 'claimed' | 'unclaimed';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type NominatorRelationship = 'customer' | 'friend_family' | 'employee' | 'neighbor' | 'other';

/** Private details from a nomination. Only the BuildBack team can see these. */
export type Nomination = {
  businessId: string;
  businessName: string;
  nominatedBy: string;
  relationship: NominatorRelationship;
  reason: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactSocial: string | null;
  inviteCode: string;
  invitedAt: string | null;
  createdAt: string;
};

/** Someone asking to take over a listing that was nominated by the community. */
export type BusinessClaim = {
  id: string;
  businessId: string;
  businessName: string;
  userId: string;
  claimantName: string;
  role: string;
  email: string;
  phone: string | null;
  note: string | null;
  status: ReviewStatus;
  createdAt: string;
};

export type StatusUpdate = {
  id: string;
  businessId: string;
  body: string;
  createdAt: string;
};

export type NeighborStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';

export type NeighborRequest = {
  id: string;
  ownerId: string;
  firstName: string;
  title: string;
  story: string;
  need: string; // category id, e.g. "rent"
  goalAmount: number | null;
  fundraiserUrl: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  status: NeighborStatus;
  createdAt: string;
  supporterCount: number;
  /** Total of the amounts givers reported through BuildBack. Self-reported, not verified. */
  reportedTotal: number;
  givingDisplay: GivingDisplay;
};

export type Wish = {
  id: string;
  userId: string;
  category: string;
  kind: string; // "Irish pub", "Black-owned barber"
  note: string | null;
  lat: number;
  lng: number;
  placeLabel: string;
  createdAt: string;
};

/** Wishes for the same kind of place that are near each other. */
export type WishGroup = {
  key: string;
  category: string;
  kind: string;
  count: number;
  placeLabel: string;
  distanceMiles: number | null;
  wishedByMe: boolean;
};

export type SupportTarget = 'business' | 'neighbor';

/** A self-reported gift. BuildBack never touches the money. */
export type Support = {
  id: string;
  userId: string;
  targetType: SupportTarget;
  targetId: string;
  amount: number | null;
  createdAt: string;
};

export type Sponsor = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  city: string | null;
  state: string | null;
};

export type CommunityStats = {
  businessesHelped: number;
  neighborsHelped: number;
  members: number;
  wishes: number;
  businessesListed: number;
};

export type MyActivity = {
  supports: Support[];
  wishes: Wish[];
  followingIds: string[];
  /** Businesses this person nominated (any review status). */
  nominationIds: string[];
  /** Businesses this person owns. */
  ownedBusinessIds: string[];
};
