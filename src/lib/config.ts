/**
 * App configuration. Values come from environment variables (see .env.example).
 * Anything starting with EXPO_PUBLIC_ is bundled into the app, so never put secrets here.
 */
export const Config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  /** Public website, used for share links. */
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? 'https://buildback.app',

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
