import * as Manipulator from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
export async function preparePhoto(asset: ImagePickerAsset): Promise<string> {
  const image = await Manipulator.manipulateAsync(
    asset.uri,
    Math.max(asset.width, asset.height) > 2400
      ? [{ resize: asset.width > asset.height ? { width: 2400 } : { height: 2400 } }]
      : [],
    { compress: 0.95, format: Manipulator.SaveFormat.JPEG },
  );
  return image.uri;
}
export async function clearDraftPhotos() {
  /* Browser preview has no persistent photo files. */
}
export async function discardDraftPhoto(uri?: string) {
  if (uri?.startsWith('blob:')) URL.revokeObjectURL(uri);
}
