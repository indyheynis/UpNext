import { discardDraftPhoto } from './photos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system/legacy';
import { canExport, Creation, Format, Poster } from '../domain/poster';
const KEY = 'playerhype.library.v1';
const ROOT = `${FS.documentDirectory}playerhype/`;
type Library = { version: 1; freePosterId: string | null; creations: Creation[] };
const empty = (): Library => ({ version: 1, freePosterId: null, creations: [] });
export async function readLibrary(): Promise<Library> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return empty();
  const value = JSON.parse(raw);
  if (value.version !== 1 || !Array.isArray(value.creations))
    throw new Error('Local library could not be read. Your files have not been deleted.');
  return value;
}
export async function saveCreation(
  poster: Poster,
  temporaryPng: string,
  format: Format,
): Promise<Creation> {
  const state = await readLibrary();
  if (!canExport(poster.id, state.freePosterId))
    throw new Error(
      'Your free poster has been used. Reopen it in My Creations to edit or export it again. Paid credits are not available yet.',
    );
  const directory = `${ROOT}${poster.id}/${Date.now()}/`;
  await FS.makeDirectoryAsync(directory, { intermediates: true });
  try {
    const persist = async (uri: string | undefined, name: string) => {
      if (!uri) return undefined;
      const target = directory + name;
      if (uri === target) return target;
      if (uri.startsWith('data:image/png;base64,'))
        await FS.writeAsStringAsync(target, uri.split(',')[1], {
          encoding: FS.EncodingType.Base64,
        });
      else await FS.copyAsync({ from: uri, to: target });
      return target;
    };
    const stored = {
      ...poster,
      photoUri: await persist(poster.photoUri, poster.cutout ? 'cutout.png' : 'photo.jpg'),
      originalUri: await persist(poster.originalUri, 'original.jpg'),
    };
    const uri = `${directory}${Date.now()}-${format}.png`;
    await FS.copyAsync({ from: temporaryPng, to: uri });
    const creation: Creation = { poster: stored, uri, format, createdAt: new Date().toISOString() };
    const previous = state.creations.find((c) => c.poster.id === poster.id);
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        freePosterId: state.freePosterId || poster.id,
        creations: [creation, ...state.creations.filter((c) => c.poster.id !== poster.id)],
      }),
    );
    if (previous && previous.uri !== uri) {
      const oldDirectory = previous.uri.slice(0, previous.uri.lastIndexOf('/') + 1);
      await FS.deleteAsync(oldDirectory, { idempotent: true }).catch(() => {});
    }
    await discardDraftPhoto(poster.originalUri).catch(() => {});
    return creation;
  } catch (error) {
    await FS.deleteAsync(directory, { idempotent: true }).catch(() => {});
    throw error;
  }
}
export async function deleteCreation(id: string) {
  const state = await readLibrary();
  await FS.deleteAsync(`${ROOT}${id}/`, { idempotent: true });
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ ...state, creations: state.creations.filter((c) => c.poster.id !== id) }),
  );
}
export async function deleteAllCreations() {
  const state = await readLibrary();
  await FS.deleteAsync(ROOT, { idempotent: true });
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...state, creations: [] }));
}
