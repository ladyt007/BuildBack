import { Platform } from 'react-native';

/**
 * App configuration. Values come from environment variables (see .env.example).
 * Anything starting with EXPO_PUBLIC_ is bundled into the app, so never put secrets here.
 */
export const Config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  /** Where people reach the BuildBack team. Empty until the BuildBack email address exists. */
  contactEmail: process.env.EXPO_PUBLIC_CONTACT_EMAIL ?? '',

  /** Who runs BuildBack, as named in the Terms of Use and Privacy Policy. */
  operatorName: process.env.EXPO_PUBLIC_OPERATOR_NAME ?? 'BuildBack',

  /**
   * BuildBack's own paid plans (Featured, Pro, Sponsor) are sold on the website. They're hidden in the
   * iPhone app, where Apple has its own rules for selling app features.
   */
  showPaidPlans: Platform.OS !== 'ios',

  /** Public website, used for share links. */
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? 'https://buildback-community.netlify.app',

  /** Payment links (e.g. Stripe Payment Links) for BuildBack's own paid plans. */
  links: {
    featured: process.env.EXPO_PUBLIC_LINK_FEATURED ?? '',
    pro: process.env.EXPO_PUBLIC_LINK_PRO ?? '',
    sponsor: process.env.EXPO_PUBLIC_LINK_SPONSOR ?? '',
    supportBuildBack: process.env.EXPO_PUBLIC_LINK_SUPPORT_BUILDBACK ?? '',
  },

  /** How many feed items between community sponsor cards. */
  sponsorEvery: 8,
  defaultRadiusMiles: 30,
};

export const isDemoMode = !Config.supabaseUrl || !Config.supabaseAnonKey;
