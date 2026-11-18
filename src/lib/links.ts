import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, Share } from 'react-native';

import { Config } from './config';

/**
 * Opens an outside website (payment pages, fundraisers, sponsors). On iPhone these open in Safari itself,
 * which is how Apple wants apps to send people to give.
 */
export async function openExternal(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener');
    return;
  }
  if (Platform.OS === 'ios' || url.startsWith('mailto:')) {
    await Linking.openURL(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

/** Opens an email to the BuildBack team, or returns false if no contact email is set up yet. */
export function emailTeam(subject: string): boolean {
  if (!Config.contactEmail) return false;
  openExternal(`mailto:${Config.contactEmail}?subject=${encodeURIComponent(subject)}`);
  return true;
}

/** Shares a link to a page in the app, e.g. "/business/123". */
export async function shareLink(path: string, message: string): Promise<void> {
  const url = `${Config.siteUrl}${path}`;
  if (Platform.OS === 'web') {
    const nav = window.navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      await nav.share({ title: 'BuildBack', text: message, url }).catch(() => {});
    } else {
      await nav.clipboard?.writeText(`${message} ${url}`);
      window.alert('Link copied!');
    }
    return;
  }
  await Share.share({ message: `${message} ${url}`, url });
}

/** Very light check that a link is a web address. */
export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value.trim());
}
