/**
 * Sample data for demo mode. All businesses, people and sponsors here are made up.
 * Real cities are used so distances and "near you" features can be tried out.
 */
import type { Business, NeighborRequest, Sponsor, StatusUpdate, Wish } from '@/lib/types';

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

type SeedBiz = Omit<Business, 'id' | 'ownerId' | 'createdAt' | 'isPro' | 'featuredUntil' | 'imageUrl' | 'photos' | 'website' | 'phone'> &
  Partial<Pick<Business, 'isPro' | 'featuredUntil' | 'website' | 'phone'>>;

const biz: SeedBiz[] = [
  { name: 'Fresh Fade Barbershop', category: 'beauty', kind: 'Barber shop', ownershipTags: ['Black-owned', 'Veteran-owned'], description: 'Classic cuts, hot towel shaves and a chair for every generation. Back open after a tough year and grateful for every client.', city: 'Macon', state: 'GA', lat: 32.8407, lng: -83.6324, supportUrl: 'https://example.com/support/fresh-fade', status: 'open', followerCount: 214, supporterCount: 37, featuredUntil: daysFromNow(5) },
  { name: 'Crowned & Coiled Natural Hair', category: 'beauty', kind: 'Natural hair salon', ownershipTags: ['Black-owned', 'Woman-owned'], description: 'Locs, twists, silk presses and braids. We specialize in healthy natural hair care.', city: 'Warner Robins', state: 'GA', lat: 32.613, lng: -83.6242, supportUrl: 'https://example.com/support/crowned', status: 'reopening', followerCount: 162, supporterCount: 21 },
  { name: 'Mama Dee’s Soul Kitchen', category: 'food', kind: 'Soul food restaurant', ownershipTags: ['Black-owned', 'Family-owned', 'Woman-owned'], description: 'Smothered chicken, collards and peach cobbler like Sunday at Grandma’s. Three generations in the kitchen.', city: 'Macon', state: 'GA', lat: 32.8301, lng: -83.6488, supportUrl: 'https://example.com/support/mama-dees', status: 'struggling', followerCount: 389, supporterCount: 58, isPro: true },
  { name: 'Kente & Co. Boutique', category: 'clothing', kind: 'Afrocentric clothing', ownershipTags: ['Black-owned', 'Woman-owned', 'Immigrant-owned'], description: 'Handmade Afrocentric fashion, head wraps and accessories made with fabric from Ghana and Nigeria.', city: 'Milledgeville', state: 'GA', lat: 33.0801, lng: -83.2321, supportUrl: 'https://example.com/support/kente', status: 'open', followerCount: 97, supporterCount: 12 },
  { name: 'Sweet Auburn Coffee', category: 'food', kind: 'Coffee shop', ownershipTags: ['Black-owned'], description: 'Locally roasted beans, fresh pastries and a gathering place for the neighborhood.', city: 'Atlanta', state: 'GA', lat: 33.755, lng: -84.375, supportUrl: 'https://example.com/support/sweet-auburn', status: 'open', followerCount: 512, supporterCount: 44, isPro: true, featuredUntil: daysFromNow(3) },
  { name: 'Decatur Little Learners', category: 'services', kind: 'Daycare', ownershipTags: ['Woman-owned', 'Black-owned'], description: 'Licensed early learning center with a focus on literacy and culture.', city: 'Decatur', state: 'GA', lat: 33.7748, lng: -84.2963, supportUrl: null, status: 'open', followerCount: 76, supporterCount: 0 },
  { name: 'Delta Blues Grocery', category: 'grocery', kind: 'Grocery store', ownershipTags: ['Black-owned', 'Family-owned'], description: 'The only full grocery store for 20 miles. Fresh produce from local farmers.', city: 'Clarksdale', state: 'MS', lat: 34.2001, lng: -90.5709, supportUrl: 'https://example.com/support/delta-blues', status: 'struggling', followerCount: 143, supporterCount: 29 },
  { name: 'Farish Street Books', category: 'arts', kind: 'Bookstore', ownershipTags: ['Black-owned'], description: 'Black authors, children’s books and a Saturday story hour.', city: 'Jackson', state: 'MS', lat: 32.2988, lng: -90.1848, supportUrl: 'https://example.com/support/farish', status: 'open', followerCount: 88, supporterCount: 15 },
  { name: 'Bridge City Auto', category: 'services', kind: 'Auto repair', ownershipTags: ['Black-owned', 'Veteran-owned'], description: 'Honest repairs, fair prices. Ask about payment plans.', city: 'Selma', state: 'AL', lat: 32.4074, lng: -87.0211, supportUrl: null, status: 'open', followerCount: 41, supporterCount: 0 },
  { name: 'Motor City Threads', category: 'clothing', kind: 'Boutique', ownershipTags: ['Black-owned'], description: 'Detroit-made streetwear and vintage finds.', city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458, supportUrl: 'https://example.com/support/motor-city', status: 'open', followerCount: 230, supporterCount: 33 },
  { name: 'Bronzeville Wellness', category: 'health', kind: 'Therapist', ownershipTags: ['Black-owned', 'Woman-owned'], description: 'Culturally responsive counseling for individuals and families. Sliding-scale fees.', city: 'Chicago', state: 'IL', lat: 41.8169, lng: -87.6168, supportUrl: null, status: 'open', followerCount: 120, supporterCount: 0 },
  { name: 'Third Ward Tacos y Más', category: 'food', kind: 'Food truck', ownershipTags: ['Latino-owned', 'Family-owned'], description: 'Street tacos, birria and agua fresca. Find us outside the park on weekends.', city: 'Houston', state: 'TX', lat: 29.7342, lng: -95.3617, supportUrl: 'https://example.com/support/third-ward', status: 'open', followerCount: 301, supporterCount: 40 },
  { name: 'Lake Merritt Braids', category: 'beauty', kind: 'Braiding studio', ownershipTags: ['Black-owned', 'Woman-owned', 'Immigrant-owned'], description: 'Box braids, knotless and kids’ styles by a family of braiders from Senegal.', city: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712, supportUrl: 'https://example.com/support/lake-merritt', status: 'open', followerCount: 178, supporterCount: 26 },
  { name: 'Charm City Crab & Fish', category: 'food', kind: 'Seafood restaurant', ownershipTags: ['Black-owned'], description: 'Steamed crabs, fried whiting and the best fish sandwich in West Baltimore.', city: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122, supportUrl: 'https://example.com/support/charm-city', status: 'reopening', followerCount: 205, supporterCount: 19 },
  { name: 'Flatbush Caribbean Market', category: 'grocery', kind: 'Caribbean market', ownershipTags: ['Black-owned', 'Immigrant-owned'], description: 'Scotch bonnets, plantains, spices and fresh hard-dough bread every morning.', city: 'Brooklyn', state: 'NY', lat: 40.6501, lng: -73.9496, supportUrl: 'https://example.com/support/flatbush', status: 'open', followerCount: 266, supporterCount: 31 },
  { name: 'Queen City Tax & Books', category: 'professional', kind: 'Tax preparer', ownershipTags: ['Black-owned', 'Woman-owned'], description: 'Tax prep and bookkeeping for families and small businesses.', city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431, supportUrl: null, status: 'open', followerCount: 64, supporterCount: 0 },
  { name: 'The Brass Shamrock', category: 'food', kind: 'Irish pub', ownershipTags: ['Family-owned', 'Immigrant-owned'], description: 'Live trad music on Thursdays, fish and chips and a warm welcome.', city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589, supportUrl: 'https://example.com/support/brass-shamrock', status: 'struggling', followerCount: 190, supporterCount: 22 },
  { name: 'Greenwood Rising Gallery', category: 'arts', kind: 'Art gallery', ownershipTags: ['Black-owned'], description: 'Celebrating Black artists on historic Black Wall Street.', city: 'Tulsa', state: 'OK', lat: 36.1594, lng: -95.9864, supportUrl: 'https://example.com/support/greenwood', status: 'open', followerCount: 340, supporterCount: 47 },
  { name: 'Beale Street Barbers', category: 'beauty', kind: 'Barber shop', ownershipTags: ['Black-owned'], description: 'Walk-ins welcome. Kids’ cuts free on the first Saturday of the month.', city: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.049, supportUrl: 'https://example.com/support/beale', status: 'open', followerCount: 133, supporterCount: 18 },
  { name: 'Tremé Second Line Brass Lessons', category: 'arts', kind: 'Music school', ownershipTags: ['Black-owned'], description: 'Brass lessons for kids, taught by working musicians.', city: 'New Orleans', state: 'LA', lat: 29.9636, lng: -90.0687, supportUrl: 'https://example.com/support/treme', status: 'open', followerCount: 158, supporterCount: 24 },
  { name: 'Nuevo México Panadería', category: 'food', kind: 'Bakery', ownershipTags: ['Latino-owned', 'Family-owned'], description: 'Conchas, bizcochitos and green chile breakfast burritos since 1998.', city: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504, supportUrl: 'https://example.com/support/panaderia', status: 'open', followerCount: 222, supporterCount: 28 },
  { name: 'Lake Street Laundromat', category: 'services', kind: 'Laundromat', ownershipTags: ['Immigrant-owned', 'Family-owned'], description: 'Rebuilt after the fires. Clean machines, free Wi-Fi and a kids’ corner.', city: 'Minneapolis', state: 'MN', lat: 44.9483, lng: -93.2615, supportUrl: 'https://example.com/support/lake-street', status: 'reopening', followerCount: 95, supporterCount: 39 },
];

export const seedBusinesses: Business[] = biz.map((b, i) => ({
  id: `b${i + 1}`,
  ownerId: null,
  createdAt: daysAgo(120 - i * 4),
  imageUrl: null,
  photos: [],
  website: b.website ?? null,
  phone: b.phone ?? null,
  isPro: b.isPro ?? false,
  featuredUntil: b.featuredUntil ?? null,
  ...b,
}));

export const seedStatusUpdates: StatusUpdate[] = [
  { id: 'u1', businessId: 'b1', body: 'We’re fully open again! Saturday hours are back, 8am–6pm. Thank you to everyone who helped us keep the lights on. 💈', createdAt: daysAgo(2) },
  { id: 'u2', businessId: 'b1', body: 'New barber joining the team next month — welcome, Marcus!', createdAt: daysAgo(18) },
  { id: 'u3', businessId: 'b3', body: 'Our walk-in freezer broke down. We’re raising money to replace it so we can keep serving. Every bit helps. 🙏', createdAt: daysAgo(1) },
  { id: 'u4', businessId: 'b3', body: 'Sunday dinner plates are back: $14 with two sides and cornbread.', createdAt: daysAgo(9) },
  { id: 'u5', businessId: 'b2', body: 'Reopening in our new location on Watson Blvd on the 1st. Booking now!', createdAt: daysAgo(4) },
  { id: 'u6', businessId: 'b7', body: 'Fresh peaches and greens just came in from the Henderson farm.', createdAt: daysAgo(3) },
  { id: 'u7', businessId: 'b17', body: 'Rent went up 40%. We’re fighting to stay. Come have a pint with us.', createdAt: daysAgo(6) },
];

export const seedNeighbors: NeighborRequest[] = [
  { id: 'n1', ownerId: 'seed', firstName: 'Denise', title: 'Help Denise keep her home after surgery', story: 'I’m a school bus driver in Macon. After back surgery I’ve been out of work for two months and fell behind on rent. I go back to work in January and just need to bridge the gap.', need: 'rent', goalAmount: 2400, fundraiserUrl: 'https://example.com/fundraiser/denise', city: 'Macon', state: 'GA', lat: 32.85, lng: -83.62, imageUrl: null, status: 'approved', createdAt: daysAgo(3), supporterCount: 23 },
  { id: 'n2', ownerId: 'seed', firstName: 'Marcus', title: 'Get Marcus back on the road to work', story: 'My car’s transmission went out and I need it to get to my job at the plant 25 miles away. A local shop quoted $1,800.', need: 'car', goalAmount: 1800, fundraiserUrl: 'https://example.com/fundraiser/marcus', city: 'Warner Robins', state: 'GA', lat: 32.62, lng: -83.63, imageUrl: null, status: 'approved', createdAt: daysAgo(6), supporterCount: 11 },
  { id: 'n3', ownerId: 'seed', firstName: 'The Johnson family', title: 'Rebuilding after a house fire', story: 'We lost almost everything in a kitchen fire. Everyone is safe, thank God. We’re raising money for clothes, school supplies and a deposit on a new place.', need: 'disaster', goalAmount: 6000, fundraiserUrl: 'https://example.com/fundraiser/johnson', city: 'Jackson', state: 'MS', lat: 32.31, lng: -90.19, imageUrl: null, status: 'approved', createdAt: daysAgo(10), supporterCount: 64 },
  { id: 'n4', ownerId: 'seed', firstName: 'Aaliyah', title: 'Aaliyah’s nursing school books & scrubs', story: 'First in my family to go to college! I got into the nursing program but can’t cover books, scrubs and my clinical fees.', need: 'school', goalAmount: 900, fundraiserUrl: 'https://example.com/fundraiser/aaliyah', city: 'Detroit', state: 'MI', lat: 42.34, lng: -83.05, imageUrl: null, status: 'approved', createdAt: daysAgo(2), supporterCount: 31 },
  { id: 'n5', ownerId: 'seed', firstName: 'Rosa', title: 'Rosa’s medical bills after her stroke', story: 'Our mom had a stroke in September. Insurance covered some of it, but the rehab bills keep coming.', need: 'medical', goalAmount: 5000, fundraiserUrl: 'https://example.com/fundraiser/rosa', city: 'Houston', state: 'TX', lat: 29.75, lng: -95.37, imageUrl: null, status: 'approved', createdAt: daysAgo(14), supporterCount: 48 },
  { id: 'n6', ownerId: 'seed', firstName: 'James', title: 'Help James after being laid off', story: 'I was laid off after 12 years at the mill. I have interviews lined up but need help with utilities this winter.', need: 'job', goalAmount: 1200, fundraiserUrl: 'https://example.com/fundraiser/james', city: 'Milledgeville', state: 'GA', lat: 33.08, lng: -83.23, imageUrl: null, status: 'pending', createdAt: daysAgo(0), supporterCount: 0 },
];

type SeedWish = [kind: string, category: string, count: number, label: string, lat: number, lng: number];

const wishSeeds: SeedWish[] = [
  ['Black-owned barber shop', 'beauty', 9, 'Milledgeville, GA', 33.08, -83.23],
  ['Natural hair salon', 'beauty', 14, 'Milledgeville, GA', 33.07, -83.24],
  ['Afrocentric clothing', 'clothing', 6, 'Macon, GA', 32.84, -83.63],
  ['Grocery store', 'grocery', 21, 'Macon, GA', 32.82, -83.68],
  ['Irish pub', 'food', 4, 'Macon, GA', 32.84, -83.63],
  ['Bookstore', 'arts', 7, 'Warner Robins, GA', 32.61, -83.62],
  ['Caribbean restaurant', 'food', 5, 'Warner Robins, GA', 32.6, -83.6],
  ['Black therapist', 'health', 11, 'Macon, GA', 32.85, -83.6],
  ['Daycare', 'services', 8, 'Selma, AL', 32.41, -87.02],
  ['Grocery store', 'grocery', 17, 'Selma, AL', 32.4, -87.03],
  ['Natural hair salon', 'beauty', 12, 'Clarksdale, MS', 34.2, -90.57],
  ['Pharmacy', 'health', 9, 'Clarksdale, MS', 34.21, -90.56],
  ['Irish pub', 'food', 3, 'Tulsa, OK', 36.15, -95.99],
  ['Black-owned barber shop', 'beauty', 6, 'Albuquerque, NM', 35.08, -106.65],
  ['Coffee shop', 'food', 10, 'Detroit, MI', 42.35, -83.06],
];

export const seedWishes: Wish[] = wishSeeds.flatMap(([kind, category, count, placeLabel, lat, lng], gi) =>
  Array.from({ length: count }, (_, i) => ({
    id: `w${gi}-${i}`,
    userId: `seed-${gi}-${i}`,
    category,
    kind,
    note: null,
    lat: lat + ((i % 5) - 2) * 0.01,
    lng: lng + ((i % 3) - 1) * 0.01,
    placeLabel,
    createdAt: daysAgo(i + gi),
  }))
);

export const seedSponsors: Sponsor[] = [
  { id: 's1', name: 'Middle Georgia Community Credit Union', tagline: 'Small business loans made for our neighborhoods. Proud BuildBack sponsor.', url: 'https://example.com/sponsor/credit-union', city: null, state: 'GA' },
  { id: 's2', name: 'Heritage Hardware', tagline: 'Helping our neighbors rebuild, one project at a time.', url: 'https://example.com/sponsor/hardware', city: null, state: null },
];

/** Members who joined before the people on this device. */
export const seedMemberCount = 1283;
