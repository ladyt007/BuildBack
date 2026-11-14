import { Platform } from 'react-native';

/** Brand palette, taken from the BuildBack logo (electric blue fading into gold). */
export const Brand = {
  blue: '#1F3BE0',
  blueDeep: '#0B1A8C',
  gold: '#E0B415',
  goldSoft: '#FFF3C4',
  ink: '#1C1717',
  green: '#1E9E5A',
  red: '#D6453D',
};

export const Colors = {
  light: {
    text: '#1C1717',
    textSecondary: '#5F5B66',
    background: '#FAF8F3',
    card: '#FFFFFF',
    border: '#E7E2D8',
    muted: '#F1EDE4',
    primary: Brand.blue,
    onPrimary: '#FFFFFF',
    accent: Brand.gold,
    accentSoft: Brand.goldSoft,
    success: Brand.green,
    danger: Brand.red,
  },
  dark: {
    text: '#F6F3EC',
    textSecondary: '#B4AFBA',
    background: '#121016',
    card: '#1D1A22',
    border: '#2E2A35',
    muted: '#26222C',
    primary: '#6B7FFF',
    onPrimary: '#FFFFFF',
    accent: '#F2C935',
    accentSoft: '#3A3216',
    success: '#3CC57C',
    danger: '#F0645C',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
export const MaxWidth = 720;

export const Fonts = {
  heading: Platform.select({ ios: 'ui-rounded', web: 'ui-rounded, system-ui, sans-serif', default: undefined }),
};
