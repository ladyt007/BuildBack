import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';

import { useColors } from '@/hooks/use-colors';
import type { IconName } from '@/components/ui';

const WEB_BOTTOM_CLEARANCE = 44;

function icon(name: IconName, focusedName: IconName) {
  function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? focusedName : name} color={color as string} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // Icons above labels on every screen size (wide screens otherwise put them side by side).
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: [
          { backgroundColor: colors.card, borderTopColor: colors.border },
          // On the website, hosting badges can sit in the bottom corners; keep the tabs above them.
          Platform.OS === 'web' && { height: 50 + WEB_BOTTOM_CLEARANCE, paddingBottom: WEB_BOTTOM_CLEARANCE },
        ],
      }}>
      <Tabs.Screen name="index" options={{ title: 'Businesses', tabBarIcon: icon('storefront-outline', 'storefront') }} />
      <Tabs.Screen name="neighbors" options={{ title: 'Neighbors', tabBarIcon: icon('heart-outline', 'heart') }} />
      <Tabs.Screen name="wishes" options={{ title: 'Wishes', tabBarIcon: icon('sparkles-outline', 'sparkles') }} />
      <Tabs.Screen name="impact" options={{ title: 'Impact', tabBarIcon: icon('trophy-outline', 'trophy') }} />
      <Tabs.Screen name="profile" options={{ title: 'Me', tabBarIcon: icon('person-circle-outline', 'person-circle') }} />
    </Tabs>
  );
}
