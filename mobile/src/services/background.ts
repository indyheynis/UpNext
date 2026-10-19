export type RemovalResult = { uri: string; cutout: boolean; message: string };
export interface BackgroundProvider {
  remove(uri: string): Promise<RemovalResult>;
}
export function createBackgroundProvider(
  apiUrl?: string,
  fetcher: typeof fetch = fetch,
): BackgroundProvider {
  return {
    async remove(uri) {
      if (!apiUrl)
        return {
          uri,
          cutout: false,
          message:
            'Studio framing is active. Your original photo stays intact; automatic cutouts are not configured.',
        };
      const form = new FormData();
      form.append('photo', { uri, name: 'athlete.jpg', type: 'image/jpeg' } as unknown as Blob);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35000);
      try {
        const response = await fetcher(`${apiUrl.replace(/\/$/, '')}/api/background/remove`, {
          method: 'POST',
          body: form,
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Cutout service unavailable.');
        const result = await response.json();
        if (
          result.status !== 'processed' ||
          typeof result.image !== 'string' ||
          !result.image.startsWith('data:image/png;base64,')
        )
          throw new Error('Original-photo fallback.');
        return {
          uri: result.image,
          cutout: true,
          message: 'Cutout ready. No generative changes have been made to your player.',
        };
      } catch {
        return {
          uri,
          cutout: false,
          message:
            'Cutout unavailable. Your original photo is ready in studio framing. You can still create and export.',
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
export const backgroundProvider = createBackgroundProvider(process.env.EXPO_PUBLIC_API_URL);
