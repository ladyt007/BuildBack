import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type PhotoKind = 'avatar' | 'business';

/** A photo that has been resized and compressed on the device, ready to upload. */
export type PreparedPhoto = { uri: string; base64: string; width: number; height: number };

export const MAX_BUSINESS_PHOTOS = 6;

const MAX_SIDE: Record<PhotoKind, number> = { avatar: 480, business: 1080 };

async function prepare(asset: ImagePicker.ImagePickerAsset, kind: PhotoKind): Promise<PreparedPhoto> {
  const max = MAX_SIDE[kind];
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (asset.width > max || asset.height > max) {
    ctx.resize(asset.width >= asset.height ? { width: max } : { height: max });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return { uri: saved.uri, base64: saved.base64 ?? '', width: saved.width, height: saved.height };
}

/**
 * Lets someone choose photos from their device. Returns [] if they cancel.
 * Throws if photo access was denied.
 */
export async function pickPhotos(kind: PhotoKind, limit = 1): Promise<PreparedPhoto[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('BuildBack needs access to your photos to add a picture. You can allow it in Settings.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: kind === 'avatar',
    aspect: kind === 'avatar' ? [1, 1] : undefined,
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 1,
  });
  if (result.canceled) return [];
  return Promise.all(result.assets.slice(0, limit).map((a) => prepare(a, kind)));
}
