import * as Location from 'expo-location';

import type { LatLng, Place } from './types';

const EARTH_RADIUS_MILES = 3958.8;

export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** A rough lat/lng box around a point, used to narrow database queries before exact distance checks. */
export function boundingBox(center: LatLng, radiusMiles: number) {
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.max(0.2, Math.cos((center.lat * Math.PI) / 180)));
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

export function formatDistance(miles: number): string {
  if (miles < 1) return 'Under 1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** Looks up a US ZIP code. Uses the free Zippopotam.us service, which needs no API key. */
export async function placeFromZip(zip: string): Promise<Place | null> {
  const clean = zip.trim().slice(0, 5);
  if (!/^\d{5}$/.test(clean)) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${clean}`);
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.places?.[0];
    if (!p) return null;
    return {
      lat: parseFloat(p.latitude),
      lng: parseFloat(p.longitude),
      label: `${p['place name']}, ${p['state abbreviation']}`,
    };
  } catch {
    return null;
  }
}

/** Asks for permission and returns the device's approximate location. */
export async function placeFromDevice(): Promise<Place | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const pos =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  let label = 'Near you';
  try {
    const [addr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (addr?.city) label = addr.region ? `${addr.city}, ${addr.region}` : addr.city;
  } catch {
    // Reverse geocoding isn't available everywhere (e.g. web). "Near you" is fine.
  }
  return { lat, lng, label };
}
