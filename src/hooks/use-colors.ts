import { useColorScheme } from 'react-native';

import { Colors, type Palette } from '@/lib/theme';

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? Colors.dark : Colors.light;
}
