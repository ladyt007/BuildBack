import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type Category = {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  /** Suggestions shown when someone makes a wish. People can always type their own. */
  examples: string[];
};

export const BUSINESS_CATEGORIES: Category[] = [
  { id: 'beauty', label: 'Hair & Beauty', icon: 'cut-outline', color: '#C2410C', examples: ['Barber shop', 'Natural hair salon', 'Braiding studio', 'Nail salon', 'Lash & brow studio'] },
  { id: 'food', label: 'Food & Drink', icon: 'restaurant-outline', color: '#B91C1C', examples: ['Soul food restaurant', 'Caribbean restaurant', 'Irish pub', 'Coffee shop', 'Bakery', 'Food truck'] },
  { id: 'grocery', label: 'Grocery & Market', icon: 'basket-outline', color: '#15803D', examples: ['Grocery store', 'Farmers market', 'African market', 'Halal butcher', 'Latin market'] },
  { id: 'clothing', label: 'Clothing & Style', icon: 'shirt-outline', color: '#7E22CE', examples: ['Afrocentric clothing', 'Boutique', 'Tailor', 'Sneaker shop', 'Thrift store'] },
  { id: 'health', label: 'Health & Wellness', icon: 'medkit-outline', color: '#0E7490', examples: ['Doctor', 'Therapist', 'Dentist', 'Pharmacy', 'Gym', 'Yoga studio'] },
  { id: 'services', label: 'Home & Services', icon: 'construct-outline', color: '#A16207', examples: ['Plumber', 'Electrician', 'Auto repair', 'Daycare', 'Cleaning service', 'Laundromat'] },
  { id: 'professional', label: 'Professional', icon: 'briefcase-outline', color: '#1D4ED8', examples: ['Accountant', 'Lawyer', 'Tax preparer', 'Real estate agent', 'Insurance agent'] },
  { id: 'arts', label: 'Arts & Culture', icon: 'color-palette-outline', color: '#DB2777', examples: ['Bookstore', 'Art gallery', 'Music venue', 'Dance studio', 'Photographer'] },
  { id: 'other', label: 'Something else', icon: 'sparkles-outline', color: '#4B5563', examples: [] },
];

export const NEIGHBOR_NEEDS: Category[] = [
  { id: 'rent', label: 'Rent & housing', icon: 'home-outline', color: '#1D4ED8', examples: [] },
  { id: 'medical', label: 'Medical bills', icon: 'medkit-outline', color: '#0E7490', examples: [] },
  { id: 'car', label: 'Car repair & transport', icon: 'car-outline', color: '#A16207', examples: [] },
  { id: 'job', label: 'Job loss', icon: 'briefcase-outline', color: '#4B5563', examples: [] },
  { id: 'family', label: 'Kids & family', icon: 'people-outline', color: '#DB2777', examples: [] },
  { id: 'funeral', label: 'Funeral costs', icon: 'flower-outline', color: '#7E22CE', examples: [] },
  { id: 'disaster', label: 'Fire or disaster', icon: 'thunderstorm-outline', color: '#B91C1C', examples: [] },
  { id: 'school', label: 'School & training', icon: 'school-outline', color: '#15803D', examples: [] },
  { id: 'other', label: 'Something else', icon: 'heart-outline', color: '#C2410C', examples: [] },
];

/** Optional. Lets people find the businesses they want to support without narrowing who can join. */
export const OWNERSHIP_TAGS = [
  'Black-owned',
  'Woman-owned',
  'Latino-owned',
  'Asian-owned',
  'Indigenous-owned',
  'Veteran-owned',
  'LGBTQ+-owned',
  'Immigrant-owned',
  'Family-owned',
  'Disability-owned',
];

const fallback = BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1];

export function businessCategory(id: string): Category {
  return BUSINESS_CATEGORIES.find((c) => c.id === id) ?? fallback;
}

export function neighborNeed(id: string): Category {
  return NEIGHBOR_NEEDS.find((c) => c.id === id) ?? NEIGHBOR_NEEDS[NEIGHBOR_NEEDS.length - 1];
}
