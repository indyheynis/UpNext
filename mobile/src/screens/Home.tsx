import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PosterCanvas } from '../components/PosterCanvas';
import { Button, colors, s, Tag } from '../components/ui';
import { newPoster } from '../domain/poster';
export function Home({
  onCreate,
  onLibrary,
  freeUsed,
}: {
  onCreate: () => void;
  onLibrary: () => void;
  freeUsed: boolean;
}) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [opacity]);
  const demo = {
    ...newPoster(),
    name: 'JORDAN DAVIS',
    number: '01',
    team: 'NORTHSIDE',
    opponent: 'WESTSIDE',
    date: 'FRIDAY NIGHT',
    time: '7:30 PM',
  };
  return (
    <Animated.View style={{ gap: 26, opacity }}>
      <View style={s.between}>
        <Tag>MADE FOR YOUR MOMENT</Tag>
        <Text style={{ color: colors.muted, fontSize: 11 }}>EST. 2026</Text>
      </View>
      <View>
        <Text style={st.headline}>
          YOUR GAME.{'\n'}YOUR MOMENT.{'\n'}
          <Text style={{ color: colors.lime }}>YOUR HYPE.</Text>
        </Text>
        <Text style={[s.body, { marginTop: 14, maxWidth: 290 }]}>
          Big-league graphics. Your name on them.{'\n'}Make your next moment impossible to miss.
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        <Button
          title={freeUsed ? 'Create a poster' : 'Make my first poster'}
          icon="arrow-forward"
          onPress={onCreate}
        />
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>
          {freeUsed
            ? 'Your saved first poster can be edited and re-exported.'
            : 'First poster free. No account. No card.'}
        </Text>
      </View>
      <View style={st.hero}>
        <View style={st.poster}>
          <PosterCanvas poster={demo} format="post" width={260} />
        </View>
        <View style={st.heroLabel}>
          <Tag>THE CINEMATIC COLLECTION</Tag>
          <Text style={{ color: 'white', fontSize: 12, marginTop: 6 }}>
            Your photo. Main-event energy.
          </Text>
        </View>
        <View style={st.badge}>
          <Ionicons name="flash" color={colors.bg} size={16} />
          <Text style={{ fontSize: 10, fontWeight: '900' }}>ALL YOU.</Text>
        </View>
      </View>

      <View style={st.stats}>
        <View>
          <Text style={st.statValue}>2 SPORTS</Text>
          <Text style={s.label}>ONE SPOTLIGHT</Text>
        </View>
        <View style={st.divider} />
        <View>
          <Text style={st.statValue}>3 STYLES</Text>
          <Text style={s.label}>YOUR SIGNATURE</Text>
        </View>
        <Ionicons name="arrow-up-right-box-outline" size={28} color={colors.lime} />
      </View>
      <Pressable accessibilityRole="button" onPress={onLibrary} style={s.between}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Your highlight reel</Text>
        <Text style={s.link}>My Creations →</Text>
      </Pressable>
    </Animated.View>
  );
}
const st = StyleSheet.create({
  headline: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 62,
    lineHeight: 59,
    color: colors.white,
    letterSpacing: -0.7,
  },
  hero: {
    height: 350,
    backgroundColor: '#171F22',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C363D',
    alignItems: 'center',
  },
  poster: {
    transform: [{ rotate: '-7deg' }, { translateY: 15 }],
    shadowColor: '#000',
    shadowRadius: 20,
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 10 },
  },
  heroLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    backgroundColor: '#10161FF2',
  },
  badge: {
    position: 'absolute',
    right: 14,
    top: 17,
    backgroundColor: colors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 9,
    borderRadius: 8,
    transform: [{ rotate: '7deg' }],
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  statValue: {
    fontFamily: 'BarlowCondensed_800ExtraBold',
    fontSize: 26,
    color: colors.white,
    marginBottom: 6,
  },
  divider: { width: 1, height: 35, backgroundColor: colors.line },
});
