import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { backend } from '@/data';
import { useColors } from '@/hooks/use-colors';
import { MAX_BUSINESS_PHOTOS, pickPhotos, type PhotoKind } from '@/lib/photos';
import { Brand, Radius, Space } from '@/lib/theme';

import { Button, Initials } from './ui';

/** Picks photos, compresses them and uploads them. Returns their addresses. */
export function usePhotoUpload(kind: PhotoKind) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload(limit = 1): Promise<string[]> {
    setError(null);
    try {
      const picked = await pickPhotos(kind, limit);
      if (picked.length === 0) return [];
      setBusy(true);
      return await Promise.all(picked.map((p) => backend.uploadPhoto(p, kind)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That photo couldn’t be added. Please try another one.');
      return [];
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, pickAndUpload };
}

export function Avatar({ uri, name, size = 72 }: { uri?: string | null; name: string; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        accessibilityLabel={`${name}'s photo`}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <Initials name={name || '?'} color={Brand.blue} size={size} />
    </View>
  );
}

/** A round profile photo with a camera badge; tapping it picks a new photo. */
export function AvatarPicker({
  uri,
  name,
  onChange,
  size = 88,
}: {
  uri?: string | null;
  name: string;
  onChange: (url: string) => void;
  size?: number;
}) {
  const colors = useColors();
  const { busy, error, pickAndUpload } = usePhotoUpload('avatar');
  return (
    <View style={{ alignItems: 'center', gap: Space.xs }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uri ? 'Change profile photo' : 'Add profile photo'}
        disabled={busy}
        onPress={async () => {
          const [url] = await pickAndUpload(1);
          if (url) onChange(url);
        }}>
        <Avatar uri={uri} name={name} size={size} />
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
        </View>
      </Pressable>
      {error ? <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center' }}>{error}</Text> : null}
    </View>
  );
}

/** The main photo for a business. */
export function CoverPhotoField({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const colors = useColors();
  const { busy, error, pickAndUpload } = usePhotoUpload('business');

  async function choose() {
    const [url] = await pickAndUpload(1);
    if (url) onChange(url);
  }

  return (
    <View style={{ gap: Space.sm }}>
      <Text style={{ color: colors.text, fontWeight: '700' }}>Main photo</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? 'Change main photo' : 'Add main photo'}
        onPress={choose}
        disabled={busy}
        style={[styles.cover, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {value ? (
          <Image source={{ uri: value }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Add your storefront, your work or your team</Text>
          </View>
        )}
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : null}
      </Pressable>
      {value ? (
        <View style={{ flexDirection: 'row', gap: Space.sm }}>
          <Button label="Change" icon="image-outline" small variant="secondary" onPress={choose} />
          <Button label="Remove" icon="trash-outline" small variant="ghost" onPress={() => onChange(null)} />
        </View>
      ) : null}
      {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

/** Extra business photos (up to MAX_BUSINESS_PHOTOS). */
export function GalleryField({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const colors = useColors();
  const { busy, error, pickAndUpload } = usePhotoUpload('business');
  const room = MAX_BUSINESS_PHOTOS - value.length;

  return (
    <View style={{ gap: Space.sm }}>
      <Text style={{ color: colors.text, fontWeight: '700' }}>
        More photos ({value.length}/{MAX_BUSINESS_PHOTOS})
      </Text>
      <View style={styles.grid}>
        {value.map((uri, i) => (
          <View key={uri} style={styles.thumb}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${i + 1}`}
              hitSlop={8}
              onPress={() => onChange(value.filter((u) => u !== uri))}
              style={styles.remove}>
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
          </View>
        ))}
        {room > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photos"
            disabled={busy}
            onPress={async () => {
              const urls = await pickAndUpload(room);
              if (urls.length) onChange([...value, ...urls].slice(0, MAX_BUSINESS_PHOTOS));
            }}
            style={[styles.thumb, styles.add, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {busy ? <ActivityIndicator /> : <Ionicons name="add" size={28} color={colors.primary} />}
          </Pressable>
        ) : null}
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
        Show off your space, your products and your people. Please only post photos you have permission to share.
      </Text>
      {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

/** A row of photos; tapping one opens it full-screen. */
export function PhotoGallery({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const { width, height } = useWindowDimensions();
  if (photos.length === 0) return null;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.sm }}>
        {photos.map((uri, i) => (
          <Pressable key={uri} accessibilityRole="imagebutton" accessibilityLabel={`Open photo ${i + 1}`} onPress={() => setOpen(i)}>
            <Image source={{ uri }} style={styles.galleryPhoto} contentFit="cover" />
          </Pressable>
        ))}
      </ScrollView>
      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={styles.viewer}>
          {open !== null ? (
            <Image
              source={{ uri: photos[open] }}
              style={{ width, height: height * 0.75 }}
              contentFit="contain"
              accessibilityLabel={`Photo ${open + 1} of ${photos.length}`}
            />
          ) : null}
          <View style={styles.viewerBar}>
            <Pressable
              accessibilityLabel="Previous photo"
              disabled={!open}
              onPress={() => setOpen((o) => (o ? o - 1 : o))}
              style={{ opacity: open ? 1 : 0.3, padding: 12 }}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </Pressable>
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              {(open ?? 0) + 1} / {photos.length}
            </Text>
            <Pressable
              accessibilityLabel="Next photo"
              disabled={open === photos.length - 1}
              onPress={() => setOpen((o) => (o !== null && o < photos.length - 1 ? o + 1 : o))}
              style={{ opacity: open === photos.length - 1 ? 0.3 : 1, padding: 12 }}>
              <Ionicons name="chevron-forward" size={28} color="#fff" />
            </Pressable>
          </View>
          <Pressable accessibilityLabel="Close photo" onPress={() => setOpen(null)} style={styles.close}>
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    height: 180,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: Space.lg,
  },
  busy: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  thumb: { width: 96, height: 96, borderRadius: Radius.sm, overflow: 'hidden' },
  add: { borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPhoto: { width: 150, height: 150, borderRadius: Radius.md },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerBar: { flexDirection: 'row', alignItems: 'center', gap: Space.xl, marginTop: Space.lg },
  close: { position: 'absolute', top: 48, right: 20, padding: 8 },
});
