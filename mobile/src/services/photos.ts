import * as FS from 'expo-file-system/legacy';
import * as Manipulator from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
const DRAFTS = `${FS.cacheDirectory}playerhype-drafts/`;
export async function preparePhoto(asset: ImagePickerAsset): Promise<string> {
  // Re-encode locally to normalize orientation and omit source EXIF metadata.
  const actions: Manipulator.Action[] =
    Math.max(asset.width, asset.height) > 2400
      ? [{ resize: asset.width > asset.height ? { width: 2400 } : { height: 2400 } }]
      : [];
  const image = await Manipulator.manipulateAsync(asset.uri, actions, {
    compress: 0.95,
    format: Manipulator.SaveFormat.JPEG,
  });
  await FS.makeDirectoryAsync(DRAFTS, { intermediates: true });
  const uri = `${DRAFTS}${Date.now()}.jpg`;
  try {
    await FS.copyAsync({ from: image.uri, to: uri });
    return uri;
  } finally {
    for (const temporary of [image.uri, asset.uri]) {
      if (FS.cacheDirectory && temporary.startsWith(FS.cacheDirectory))
        await FS.deleteAsync(temporary, { idempotent: true }).catch(() => {});
    }
  }
}
export async function clearDraftPhotos() {
  await FS.deleteAsync(DRAFTS, { idempotent: true });
}
export async function discardDraftPhoto(uri?: string) {
  if (uri?.startsWith(DRAFTS)) await FS.deleteAsync(uri, { idempotent: true });
}
