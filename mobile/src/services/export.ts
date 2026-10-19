import Svg from 'react-native-svg';
import * as FS from 'expo-file-system/legacy';
import { Format, sizes } from '../domain/poster';

/** Rasterize vector artwork directly at export resolution, independent of device pixel density. */
export async function renderPng(svg: Svg, format: Format): Promise<string> {
  const size = sizes[format];
  const base64 = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Rendering took too long. Please try again.')),
      15000,
    );
    try {
      svg.toDataURL((data) => {
        clearTimeout(timeout);
        if (data) resolve(data);
        else reject(new Error('The poster could not be rendered.'));
      }, size);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
  // Read PNG IHDR: refuse a blank/incorrectly-sized native export instead of saving it silently.
  const header = atob(base64.slice(0, 44));
  const uint32 = (offset: number) =>
    Array.from(header.slice(offset, offset + 4)).reduce((n, c) => n * 256 + c.charCodeAt(0), 0);
  if (
    !header.startsWith('\x89PNG\r\n\x1a\n') ||
    uint32(16) !== size.width ||
    uint32(20) !== size.height
  )
    throw new Error('The exported image has unexpected dimensions. Please retry on your device.');
  const uri = `${FS.cacheDirectory}playerhype-export-${Date.now()}.png`;
  await FS.writeAsStringAsync(uri, base64, { encoding: FS.EncodingType.Base64 });
  return uri;
}
export async function releaseExport(uri: string) {
  await FS.deleteAsync(uri, { idempotent: true });
}
