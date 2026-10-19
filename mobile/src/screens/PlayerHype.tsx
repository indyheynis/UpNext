import { router, usePathname, type Href } from 'expo-router';
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed/800ExtraBold';
import * as ImagePicker from 'expo-image-picker';
import { preparePhoto, discardDraftPhoto, clearDraftPhotos } from '../services/photos';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import Svg from 'react-native-svg';
import { renderPng, releaseExport } from '../services/export';
import { Button, colors, Field, s, Tag } from '../components/ui';
import { PosterCanvas } from '../components/PosterCanvas';
import { Home } from '../screens/Home';
import {
  canExport,
  Creation,
  Format,
  newPoster,
  Poster,
  sizes,
  templates,
  validateDetails,
} from '../domain/poster';
import { backgroundProvider } from '../services/background';
import { deleteAllCreations, deleteCreation, readLibrary, saveCreation } from '../services/library';

type Screen =
  | 'home'
  | 'sport'
  | 'upload'
  | 'details'
  | 'template'
  | 'editor'
  | 'export'
  | 'library'
  | 'settings';
const flow: Screen[] = ['sport', 'upload', 'details', 'template', 'editor', 'export'];
const PlayerHypeContext = createContext<ReturnType<typeof usePlayerHypeController> | null>(null);
function usePlayerHypeController() {
  const [fonts, fontError] = useFonts({ BarlowCondensed_800ExtraBold });
  const pathname = usePathname();
  const route = pathname === '/' ? 'home' : pathname.slice(1);
  const screen: Screen = ['home', ...flow, 'library', 'settings'].includes(route)
    ? (route as Screen)
    : 'home';
  const setScreen = useCallback(
    (next: Screen) => router.replace((next === 'home' ? '/' : `/${next}`) as Href),
    [],
  );
  const [poster, setPoster] = useState<Poster>(newPoster);
  const [format, setFormat] = useState<Format>('story');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [consent, setConsent] = useState(false);
  const [rights, setRights] = useState(false);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [freeId, setFreeId] = useState<string | null>(null);
  const [exported, setExported] = useState<Creation | null>(null);
  const [loadedPhotoKey, setLoadedPhotoKey] = useState<string | null>(null);
  const photoKey = `${poster.photoUri}|${screen}|${format}`;
  const photoReady = !poster.photoUri || loadedPhotoKey === photoKey;
  const setPhotoReady = (ready: boolean) => setLoadedPhotoKey(ready ? photoKey : null);
  const preview = useRef<Svg>(null);
  const scroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const { width } = useWindowDimensions();
  const posterWidth = Math.min(width - 44, 390);
  const step = flow.indexOf(screen);
  const change = (values: Partial<Poster>) => {
    setPoster((p) => ({ ...p, ...values }));
    setExported(null);
  };
  const go = useCallback(
    (next: Screen) => {
      if (busyRef.current) return;
      setError('');
      setNotice('');
      setScreen(next);
      scroll.current?.scrollTo({ y: 0, animated: false });
    },
    [setScreen, setError, setNotice],
  );
  const back = useCallback(() => go(step > 0 ? flow[step - 1] : 'home'), [step, go]);
  const refresh = async () => {
    const state = await readLibrary();
    setCreations(state.creations);
    setFreeId(state.freePosterId);
  };
  useEffect(() => {
    readLibrary()
      .then((state) => {
        setCreations(state.creations);
        setFreeId(state.freePosterId);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      back();
      return true;
    });
    return () => sub.remove();
  }, [screen, back]);
  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const pickPhoto = () =>
    run(async () => {
      // The system picker grants access only to the selected asset; no broad library read permission.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const uri = await preparePhoto(asset);
      await discardDraftPhoto(poster.originalUri).catch(() => {});
      change({ photoUri: uri, originalUri: uri, cutout: false });
      setRights(false);
    });
  const removeBackground = () =>
    run(async () => {
      if (!poster.originalUri) return;
      const result = await backgroundProvider.remove(poster.originalUri);
      change({ photoUri: result.uri, cutout: result.cutout });
      setNotice(result.message);
    });
  const exportPoster = () =>
    run(async () => {
      const problem = validateDetails(poster);
      if (problem) throw new Error(problem);
      if (!poster.photoUri) throw new Error('Choose a photo before exporting.');
      if (!canExport(poster.id, freeId))
        throw new Error(
          'Your first free poster is already saved. Reopen it in My Creations to edit and export again. Paid credits are not available yet.',
        );
      if (!photoReady)
        throw new Error('Your photo is still loading. Please try again in a moment.');
      if (Platform.OS === 'web')
        throw new Error(
          'PNG export is available in the iOS and Android app. Open this project in Expo Go or a native build.',
        );
      let uri: string | undefined;
      try {
        if (!preview.current) throw new Error('The poster is not ready yet.');
        uri = await renderPng(preview.current, format);
        const saved = await saveCreation(poster, uri, format);
        setExported(saved);
        setPoster(saved.poster);
        await refresh();
        setScreen('export');
        scroll.current?.scrollTo({ y: 0, animated: false });
      } finally {
        if (uri) await releaseExport(uri).catch(() => {});
      }
    });
  const saveToPhotos = () =>
    run(async () => {
      if (!exported) return;
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted)
        throw new Error(
          'Photo access was declined. Allow saving in your phone settings, or use Share instead.',
        );
      await MediaLibrary.saveToLibraryAsync(exported.uri);
      setNotice('Saved to your photo library.');
    });
  const share = () =>
    run(async () => {
      if (!exported) return;
      if (!(await Sharing.isAvailableAsync()))
        throw new Error('Sharing is not available on this device.');
      await Sharing.shareAsync(exported.uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: 'Share your PlayerHype poster',
      });
    });
  const confirmDelete = (item: Creation) =>
    Alert.alert(
      'Delete this creation?',
      'The photo and poster will be deleted from this app. Copies saved to Photos or shared elsewhere remain. The free poster credit is not reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            run(async () => {
              await deleteCreation(item.poster.id);
              if (poster.id === item.poster.id) {
                await discardDraftPhoto(poster.originalUri);
                setPoster(newPoster());
                setExported(null);
              }
              await refresh();
            }),
        },
      ],
    );
  return {
    fonts,
    fontError,
    screen,
    poster,
    setPoster,
    format,
    setFormat,
    busy,
    error,
    setError,
    notice,
    setNotice,
    consent,
    setConsent,
    rights,
    setRights,
    creations,
    freeId,
    exported,
    setExported,
    photoReady,
    setPhotoReady,
    preview,
    scroll,
    posterWidth,
    step,
    change,
    go,
    back,
    refresh,
    run,
    pickPhoto,
    removeBackground,
    exportPoster,
    saveToPhotos,
    share,
    confirmDelete,
  };
}
export function PlayerHypeProvider({ children }: { children: React.ReactNode }) {
  const state = usePlayerHypeController();
  return <PlayerHypeContext.Provider value={state}>{children}</PlayerHypeContext.Provider>;
}
export default function PlayerHypeScreen() {
  const state = useContext(PlayerHypeContext);
  if (!state) throw new Error('PlayerHype provider missing');
  const {
    fonts,
    fontError,
    screen,
    poster,
    setPoster,
    format,
    setFormat,
    busy,
    error,
    setError,
    notice,
    setNotice,
    consent,
    setConsent,
    rights,
    setRights,
    creations,
    freeId,
    exported,
    setExported,
    photoReady,
    setPhotoReady,
    preview,
    scroll,
    posterWidth,
    step,
    change,
    go,
    back,
    refresh,
    run,
    pickPhoto,
    removeBackground,
    exportPoster,
    saveToPhotos,
    share,
    confirmDelete,
  } = state;
  if (!fonts && !fontError)
    return (
      <SafeAreaView style={[s.page, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={s.title}>PLAYERHYPE</Text>
        <Text style={s.body}>Getting your spotlight ready…</Text>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.page} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={st.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={screen === 'home' ? 'PlayerHype home' : 'Back'}
          disabled={busy}
          onPress={screen === 'home' ? () => go('home') : back}
          style={s.row}
        >
          {screen !== 'home' && <Ionicons name="arrow-back" size={23} color="white" />}
          <Text style={st.wordmark}>
            PLAYER<Text style={{ color: colors.lime }}>HYPE</Text>
            <Text style={{ color: colors.lime, fontSize: 18 }}> /</Text>
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings and privacy"
          disabled={busy}
          onPress={() => go('settings')}
          style={st.iconButton}
        >
          <Ionicons name="options-outline" size={21} color="white" />
        </Pressable>
      </View>
      {step >= 0 && (
        <View style={st.progress}>
          {flow.map((item, i) => (
            <View
              key={item}
              style={{
                flex: 1,
                height: 3,
                backgroundColor: i <= step ? colors.lime : colors.line,
                borderRadius: 3,
              }}
            />
          ))}
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.content, { maxWidth: 520, width: '100%', alignSelf: 'center' }]}
        >
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          {notice ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[s.card, s.body, { color: colors.white }]}
            >
              {notice}
            </Text>
          ) : null}
          {screen === 'home' && (
            <Home
              onCreate={() => {
                setPoster(newPoster());
                setExported(null);
                setRights(false);
                go('sport');
              }}
              onLibrary={() => go('library')}
              freeUsed={!!freeId}
            />
          )}
          {screen === 'sport' && (
            <>
              <Tag>01 / CHOOSE YOUR ARENA</Tag>
              <Text style={s.title}>Different game.{'\n'}Same hunger.</Text>
              <Text style={s.body}>Pick your sport. Own the spotlight.</Text>
              {(
                [
                  {
                    id: 'football',
                    title: 'FOOTBALL',
                    sub: 'Friday nights. Forever moments.',
                    icon: 'american-football',
                  },
                  {
                    id: 'basketball',
                    title: 'BASKETBALL',
                    sub: 'From the hardwood to the feed.',
                    icon: 'basketball',
                  },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: poster.sport === item.id }}
                  aria-checked={poster.sport === item.id}
                  onPress={() => change({ sport: item.id })}
                  style={[
                    s.card,
                    st.sport,
                    poster.sport === item.id && { borderColor: colors.lime },
                  ]}
                >
                  <View style={s.between}>
                    <Ionicons
                      name={item.icon}
                      size={64}
                      color={poster.sport === item.id ? colors.lime : '#697580'}
                    />
                    <Ionicons
                      name={poster.sport === item.id ? 'checkmark-circle' : 'ellipse-outline'}
                      size={25}
                      color={colors.lime}
                    />
                  </View>
                  <Text style={[s.title, { fontSize: 37 }]}>{item.title}</Text>
                  <Text style={s.body}>{item.sub}</Text>
                </Pressable>
              ))}
              <Button title="That's my game" onPress={() => go('upload')} icon="arrow-forward" />
            </>
          )}
          {screen === 'upload' && (
            <>
              <Tag>02 / THE MAIN CHARACTER</Tag>
              <Text style={s.title}>Put yourself{'\n'}in the picture.</Text>
              <Text style={s.body}>
                A clear, full-body photo works best. Good light. Big energy. We’ll handle the frame.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose athlete photo"
                disabled={busy}
                onPress={pickPhoto}
                style={st.upload}
              >
                {poster.photoUri ? (
                  <Image
                    source={{ uri: poster.photoUri }}
                    style={{ width: '100%', height: 310 }}
                    resizeMode="contain"
                  />
                ) : (
                  <>
                    <Ionicons name="add" size={44} color={colors.lime} />
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
                      Drop into the spotlight
                    </Text>
                    <Text style={s.body}>Choose a photo from your phone</Text>
                  </>
                )}
              </Pressable>
              {poster.photoUri && (
                <Button
                  title="Choose a different photo"
                  secondary
                  onPress={pickPhoto}
                  disabled={busy}
                />
              )}
              <View style={s.card}>
                <View style={s.between}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontWeight: '700' }}>
                      Automatic player cutout
                    </Text>
                    <Text style={[s.body, { fontSize: 12 }]}>
                      Optional • sends this photo to the configured service
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel="Allow photo upload for background removal"
                    value={consent}
                    onValueChange={setConsent}
                    trackColor={{ true: colors.lime }}
                    disabled={busy}
                  />
                </View>
                <Text style={[s.body, { fontSize: 12 }]}>
                  Only use a photo you own or have permission to use. The service removes the
                  background; it does not generate or alter your face or body. Provider retention
                  terms apply. Without a service, your original photo stays in a studio frame.
                </Text>
                <Button
                  title={poster.cutout ? 'Try cutout again' : 'Remove background'}
                  secondary
                  disabled={!poster.originalUri || !consent || busy}
                  loading={busy}
                  onPress={removeBackground}
                />
                {poster.cutout && (
                  <Button
                    title="Use original photo"
                    secondary
                    onPress={() => change({ photoUri: poster.originalUri, cutout: false })}
                  />
                )}
              </View>
              <View style={s.row}>
                <Switch
                  accessibilityLabel="I have permission to use this photo and I am 18 or older"
                  value={rights}
                  onValueChange={setRights}
                />
                <Text style={[s.body, { flex: 1, fontSize: 12 }]}>
                  I am 18 or older and have permission to use this photo and the player’s likeness.
                </Text>
              </View>
              <Button
                title="Make it mine"
                disabled={!poster.photoUri || !rights || busy}
                onPress={() => go('details')}
                icon="arrow-forward"
              />
            </>
          )}
          {screen === 'details' && (
            <>
              <Tag>03 / MAKE A NAME</Tag>
              <Text style={s.title}>The details.{'\n'}The difference.</Text>
              <Field
                label="Player name"
                placeholder="Jordan Davis"
                maxLength={24}
                value={poster.name}
                onChangeText={(name) => change({ name })}
                autoCapitalize="words"
              />
              <View style={s.row}>
                <View style={{ width: 95 }}>
                  <Field
                    label="Number"
                    placeholder="01"
                    maxLength={2}
                    keyboardType="number-pad"
                    value={poster.number}
                    onChangeText={(number) => change({ number })}
                  />
                </View>
                <Field
                  label="Team name"
                  placeholder="Northside"
                  maxLength={24}
                  value={poster.team}
                  onChangeText={(team) => change({ team })}
                />
              </View>
              <Field
                label="Opponent (optional)"
                placeholder="Westside"
                maxLength={24}
                value={poster.opponent}
                onChangeText={(opponent) => change({ opponent })}
              />
              <View style={s.row}>
                <Field
                  label="Date (optional)"
                  placeholder="2026-11-06"
                  maxLength={10}
                  value={poster.date}
                  onChangeText={(date) => change({ date })}
                />
                <Field
                  label="Time (optional)"
                  placeholder="19:30"
                  maxLength={5}
                  value={poster.time}
                  onChangeText={(time) => change({ time })}
                />
              </View>
              <Text style={s.label}>TEAM COLORS</Text>
              <View style={s.row}>
                {['#C7FF43', '#FF583E', '#37D9FF', '#B99AFF', '#FFFFFF'].map((color) => (
                  <Pressable
                    key={color}
                    accessibilityRole="button"
                    accessibilityLabel={`Set primary color ${color}`}
                    onPress={() => change({ primary: color })}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: color,
                      borderWidth: poster.primary === color ? 4 : 0,
                      borderColor: '#697580',
                    }}
                  />
                ))}
              </View>
              <View style={s.row}>
                <Field
                  label="Primary hex"
                  autoCapitalize="characters"
                  maxLength={7}
                  value={poster.primary}
                  onChangeText={(primary) => change({ primary })}
                />
                <Field
                  label="Accent hex"
                  autoCapitalize="characters"
                  maxLength={7}
                  value={poster.secondary}
                  onChangeText={(secondary) => change({ secondary })}
                />
              </View>
              <Button
                title="Find my style"
                onPress={() => {
                  const issue = validateDetails(poster);
                  if (issue) setError(issue);
                  else go('template');
                }}
                icon="arrow-forward"
              />
            </>
          )}
          {screen === 'template' && (
            <>
              <Tag>04 / PICK YOUR ENERGY</Tag>
              <Text style={s.title}>Built to{'\n'}turn heads.</Text>
              <Text style={s.body}>Three original looks. All included with your first poster.</Text>
              {templates.map((t) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: poster.template === t.id }}
                  aria-checked={poster.template === t.id}
                  onPress={() => change({ template: t.id })}
                  style={[
                    s.card,
                    { padding: 12 },
                    poster.template === t.id && { borderColor: colors.lime },
                  ]}
                >
                  <View
                    style={{
                      height: 260,
                      overflow: 'hidden',
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: '#0A0D10',
                    }}
                  >
                    <PosterCanvas
                      poster={{ ...poster, template: t.id }}
                      format="post"
                      width={230}
                    />
                  </View>
                  <View style={s.between}>
                    <Text style={[s.title, { fontSize: 32 }]}>{t.title}</Text>
                    <Ionicons
                      name={poster.template === t.id ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={colors.lime}
                    />
                  </View>
                  <Tag>{t.subtitle}</Tag>
                </Pressable>
              ))}
              <Button title="See my poster" onPress={() => go('editor')} icon="arrow-forward" />
            </>
          )}
          {screen === 'editor' && (
            <>
              <Tag>05 / THIS IS YOUR MOMENT</Tag>
              <View style={s.between}>
                <Text style={[s.title, { fontSize: 40 }]}>LOOKING ELITE.</Text>
                <Pressable accessibilityRole="button" onPress={() => go('details')}>
                  <Text style={s.link}>Edit details</Text>
                </Pressable>
              </View>
              <View style={st.segment}>
                {(['story', 'post'] as const).map((f) => (
                  <Pressable
                    key={f}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: format === f }}
                    aria-checked={format === f}
                    onPress={() => {
                      setFormat(f);
                      setExported(null);
                    }}
                    style={[st.segmentItem, format === f && { backgroundColor: colors.lime }]}
                  >
                    <Text
                      style={{
                        fontWeight: '800',
                        fontSize: 12,
                        color: format === f ? colors.bg : colors.muted,
                      }}
                    >
                      {f === 'story' ? 'STORY  9:16' : 'POST  4:5'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ alignSelf: 'center' }}>
                <View
                  collapsable={false}
                  style={{
                    width: posterWidth,
                    height: (posterWidth * sizes[format].height) / 1080,
                    backgroundColor: '#090C10',
                  }}
                >
                  <PosterCanvas
                    poster={poster}
                    format={format}
                    width={posterWidth}
                    svgRef={preview}
                    onPhotoLoad={() => setPhotoReady(true)}
                  />
                </View>
              </View>
              <View style={s.row}>
                {templates.map((t) => (
                  <Pressable
                    key={t.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: poster.template === t.id }}
                    aria-checked={poster.template === t.id}
                    onPress={() => change({ template: t.id })}
                    style={[st.chip, poster.template === t.id && { borderColor: colors.lime }]}
                  >
                    <Text
                      style={{
                        color: poster.template === t.id ? colors.lime : colors.muted,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {t.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[s.body, { fontSize: 12, textAlign: 'center' }]}>
                {sizes[format].width} × {sizes[format].height} PNG • no watermark
              </Text>
              <Button
                title="Export my poster"
                loading={busy}
                disabled={!photoReady}
                onPress={exportPoster}
                icon="download-outline"
              />
              <Button title="Change photo" secondary disabled={busy} onPress={() => go('upload')} />
            </>
          )}
          {screen === 'export' && !exported && (
            <View style={s.card}>
              <Text style={s.body}>Export a poster from the editor to save or share it.</Text>
              <Button title="Open My Creations" onPress={() => go('library')} />
            </View>
          )}
          {screen === 'export' && exported && (
            <>
              <Tag>YOUR HYPE IS READY</Tag>
              <Text style={s.title}>Made by you.{'\n'}Seen by everyone.</Text>
              <Image
                source={{ uri: exported.uri }}
                style={{
                  width: posterWidth * 0.75,
                  height: (posterWidth * 0.75 * sizes[exported.format].height) / 1080,
                  alignSelf: 'center',
                  borderRadius: 12,
                }}
                resizeMode="contain"
              />
              <Text style={s.body}>
                Saved privately in My Creations. Download it to Photos or send it straight to your
                next big moment.
              </Text>
              <Button
                title="Save to Photos"
                onPress={saveToPhotos}
                disabled={busy}
                icon="download-outline"
              />
              <Button
                title="Share poster"
                secondary
                onPress={share}
                disabled={busy}
                icon="share-outline"
              />
              <Button
                title="Back to editor"
                secondary
                onPress={() => go('editor')}
                disabled={busy}
              />
              <Pressable accessibilityRole="button" onPress={() => go('library')}>
                <Text style={[s.link, { textAlign: 'center' }]}>Open My Creations →</Text>
              </Pressable>
            </>
          )}
          {screen === 'library' && (
            <>
              <Tag>THE HIGHLIGHT REEL</Tag>
              <Text style={s.title}>My creations.</Text>
              <Text style={s.body}>
                Private to this device. Reopen your poster to edit it or export another format.
              </Text>
              {!creations.length && (
                <View style={s.card}>
                  <Ionicons name="images-outline" size={38} color={colors.lime} />
                  <Text style={s.body}>
                    Your next highlight belongs here. Export a poster to start your collection.
                  </Text>
                  <Button
                    title="Create a poster"
                    onPress={() => {
                      setPoster(newPoster());
                      setRights(false);
                      go('sport');
                    }}
                  />
                </View>
              )}
              {creations.map((c) => (
                <View key={c.poster.id} style={s.card}>
                  <Image
                    source={{ uri: c.uri }}
                    style={{ height: 280, width: '100%' }}
                    resizeMode="contain"
                  />
                  <Text style={[s.title, { fontSize: 30 }]}>{c.poster.name}</Text>
                  <Tag>
                    {c.poster.template} / {c.format}
                  </Tag>
                  <Button
                    title="Edit & re-export"
                    onPress={() => {
                      setPoster(c.poster);
                      setFormat(c.format);
                      setRights(true);
                      setExported(c);
                      go('editor');
                    }}
                  />
                  <Button
                    title="Delete creation"
                    secondary
                    onPress={() => confirmDelete(c)}
                    disabled={busy}
                  />
                </View>
              ))}
            </>
          )}
          {screen === 'settings' && (
            <>
              <Tag>YOUR DATA. YOUR CALL.</Tag>
              <Text style={s.title}>Settings{'\n'}& privacy.</Text>
              <View style={s.card}>
                <Text style={st.sectionTitle}>Local by default</Text>
                <Text style={s.body}>
                  Photos, player details and exports stay in this app on your phone. We use no
                  analytics, advertising IDs or cloud accounts. Selecting a photo does not give us
                  access to your whole library.
                </Text>
              </View>
              <View style={s.card}>
                <Text style={st.sectionTitle}>Optional cutouts</Text>
                <Text style={s.body}>
                  Only the photo is uploaded after you enable cutout consent and tap Remove
                  background. The backend temporarily processes it and does not retain it. If
                  configured, a third-party removal provider receives it; its own retention policy
                  applies. Keep this option off if you do not want to upload.
                </Text>
              </View>
              <View style={s.card}>
                <Text style={st.sectionTitle}>First poster, on us</Text>
                <Text style={s.body}>
                  One poster is free, including edits and repeat exports in both formats. Additional
                  credits and premium templates are planned. There are no purchases or subscriptions
                  in this version. Deleting a poster does not reset the free credit.
                </Text>
              </View>
              <View style={s.card}>
                <Text style={st.sectionTitle}>Made for athletes 18+</Text>
                <Text style={s.body}>
                  Use your own photos or obtain permission from the photographer and athlete. Do not
                  use protected team logos without permission. Youth accounts and parental consent
                  are not supported in this version.
                </Text>
              </View>
              <Button
                title="Delete all local creations"
                secondary
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    'Delete all creations?',
                    'This deletes app copies of your photos and posters. Shared files and your phone photo library are unaffected. The used free credit stays recorded.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete all',
                        style: 'destructive',
                        onPress: () =>
                          run(async () => {
                            await deleteAllCreations();
                            await clearDraftPhotos();
                            setPoster(newPoster());
                            setExported(null);
                            await refresh();
                            setNotice('All saved creations have been deleted.');
                          }),
                      },
                    ],
                  )
                }
              />
              <Text style={[s.label, { textAlign: 'center' }]}>PLAYERHYPE / MVP 1.0</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {['home', 'library', 'settings'].includes(screen) && (
        <View style={st.tabs}>
          {(
            [
              { id: 'home', icon: 'flash-outline', label: 'Create' },
              { id: 'library', icon: 'grid-outline', label: 'My Creations' },
              { id: 'settings', icon: 'shield-checkmark-outline', label: 'Privacy' },
            ] as const
          ).map((tab) => (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: screen === tab.id }}
              onPress={() => go(tab.id)}
              style={st.tab}
            >
              <Ionicons
                name={tab.icon}
                size={21}
                color={screen === tab.id ? colors.lime : colors.muted}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: screen === tab.id ? colors.lime : colors.muted,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
const st = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 28,
    color: 'white',
    letterSpacing: 0.3,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { flexDirection: 'row', gap: 5, paddingHorizontal: 22, paddingVertical: 10 },
  sport: { minHeight: 190 },
  upload: {
    minHeight: 290,
    borderWidth: 1,
    borderColor: '#556744',
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: '#131C18',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  segment: { flexDirection: 'row', backgroundColor: colors.card, padding: 5, borderRadius: 13 },
  segmentItem: { flex: 1, padding: 13, borderRadius: 9, alignItems: 'center' },
  chip: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabs: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  tab: { flex: 1, alignItems: 'center', gap: 6, minHeight: 42 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: 'white' },
});
