import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CelebrationProvider } from '@/components/celebration';
import { IntroAnimation } from '@/components/intro-animation';
import { Colors } from '@/lib/theme';
import { INTRO_ENABLED_KEY, loadJSON, WELCOMED_KEY } from '@/lib/storage';
import { AppProvider, useApp } from '@/state/app-state';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate() {
  const { ready, profile } = useApp();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    // First time on the home screen without an account: show the welcome screen once.
    if (!profile && pathname === '/') {
      loadJSON<boolean>(WELCOMED_KEY, false).then((seen) => {
        if (!seen) router.replace('/welcome');
      });
    }
    // Only on startup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return null;
}

/** Plays the brick-building intro over the app while it loads. */
function Intro() {
  const { ready } = useApp();
  // null while we check whether the person turned the animation off.
  const [showing, setShowing] = useState<boolean | null>(null);
  const done = useCallback(() => setShowing(false), []);

  useEffect(() => {
    loadJSON<boolean>(INTRO_ENABLED_KEY, true).then((enabled) => {
      setShowing(enabled);
      // The native splash is a plain blue screen; swap to the animation (or the app) right away.
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  return showing ? <IntroAnimation ready={ready} onDone={done} /> : null;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? Colors.dark : Colors.light;
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.border,
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <CelebrationProvider>
          <AppProvider>
            <Gate />
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerTintColor: palette.primary }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
              <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="auth" options={{ title: '', presentation: 'modal' }} />
              <Stack.Screen name="business/[id]" options={{ title: '' }} />
              <Stack.Screen name="business/new" options={{ title: 'List a business', presentation: 'modal' }} />
              <Stack.Screen name="business/nominate" options={{ title: 'Nominate a business', presentation: 'modal' }} />
              <Stack.Screen name="business/claim" options={{ title: 'Claim your business' }} />
              <Stack.Screen name="neighbor/[id]" options={{ title: '' }} />
              <Stack.Screen name="neighbor/new" options={{ title: 'Ask for help', presentation: 'modal' }} />
              <Stack.Screen name="wish/new" options={{ title: 'Make a wish', presentation: 'modal' }} />
              <Stack.Screen name="promote" options={{ title: 'Grow with BuildBack' }} />
              <Stack.Screen name="admin" options={{ title: 'Review requests' }} />
              <Stack.Screen name="terms" options={{ title: 'Terms of Use' }} />
              <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
            </Stack>
            <Intro />
          </AppProvider>
        </CelebrationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
