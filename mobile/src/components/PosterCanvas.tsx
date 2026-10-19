import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  Text,
  Image,
  ClipPath,
  G,
  Line,
} from 'react-native-svg';
import { Poster, Format, sizes } from '../domain/poster';

type Props = {
  poster: Poster;
  format: Format;
  width: number;
  svgRef?: React.Ref<Svg>;
  onPhotoLoad?: () => void;
};
// One vector composition is used for both preview and native PNG capture.
export function PosterCanvas({ poster: p, format, width, onPhotoLoad, svgRef }: Props) {
  const H = sizes[format].height;
  const compact = format === 'post';
  const accent = p.primary;
  const second = p.secondary;
  const cinematic = p.template === 'cinematic';
  const neon = p.template === 'neon';
  const photoY = compact ? 210 : 320;
  const photoH = compact ? 780 : 1170;
  const nameY = H - 310;
  return (
    <Svg
      ref={svgRef}
      fontFamily="Arial"
      width={width}
      height={(width * H) / 1080}
      viewBox={`0 0 1080 ${H}`}
      accessibilityLabel={`${p.template} poster for ${p.name || 'your athlete'}`}
    >
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={neon ? '#111633' : '#242B29'} />
          <Stop offset="0.6" stopColor="#090C11" />
          <Stop offset="1" stopColor={neon ? '#251534' : '#111618'} />
        </LinearGradient>
        <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#080B10" stopOpacity="0" />
          <Stop offset="0.62" stopColor="#080B10" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#080B10" />
        </LinearGradient>
        <LinearGradient id="beam">
          <Stop offset="0" stopColor={accent} stopOpacity="0.4" />
          <Stop offset="1" stopColor={accent} stopOpacity="0" />
        </LinearGradient>
        <ClipPath id="photo">
          <Rect x="90" y={photoY} width="900" height={photoH} rx={neon ? 30 : 0} />
        </ClipPath>
      </Defs>
      <Rect width="1080" height={H} fill="url(#bg)" />
      {cinematic && (
        <G>
          <Path d={`M-100 50 L210 0 L1080 ${H - 400} L750 ${H}`} fill="url(#beam)" />
          <Path
            d={`M1100 0 L900 0 L0 ${H - 300}`}
            fill="none"
            stroke="white"
            strokeOpacity="0.09"
            strokeWidth="100"
          />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <G key={i}>
              <Rect x={90 + i * 140} y="180" width="68" height="12" fill="#FFFFFF" opacity="0.7" />
              <Line
                x1={i * 180}
                y1={H - 530}
                x2={i * 180 + 240}
                y2={H}
                stroke="white"
                strokeOpacity="0.08"
                strokeWidth="2"
              />
            </G>
          ))}
        </G>
      )}
      {!cinematic && !neon && (
        <G>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Line
              key={i}
              x1="-50"
              y1={i * 310}
              x2="1130"
              y2={i * 310 + 600}
              stroke="#CFD5CC"
              strokeOpacity="0.08"
              strokeWidth="2"
            />
          ))}
          <Rect x="50" y="210" width="12" height={H - 420} fill={accent} />
        </G>
      )}
      {neon && (
        <G>
          <Path
            d={`M160 ${H - 350} L40 250 L850 180 L1040 ${H - 300} Z`}
            stroke={accent}
            strokeWidth="32"
            opacity="0.08"
            fill="none"
          />
          <Path
            d={`M160 ${H - 350} L40 250 L850 180 L1040 ${H - 300}`}
            stroke={accent}
            strokeWidth="4"
            fill="none"
          />
          <Circle cx="830" cy={H / 2} r="360" stroke={second} strokeWidth="5" fill="none" />
          <Circle
            cx="830"
            cy={H / 2}
            r="375"
            stroke={second}
            strokeWidth="25"
            opacity="0.06"
            fill="none"
          />
        </G>
      )}
      {p.sport === 'basketball' ? (
        <G opacity="0.13" stroke={second} strokeWidth="3" fill="none">
          <Circle cx="540" cy={H - 520} r="420" />
          <Rect x="340" y={H - 650} width="400" height="600" />
          <Circle cx="540" cy={H - 650} r="140" />
        </G>
      ) : (
        <G opacity="0.15" stroke={second} strokeWidth="3">
          {[0, 1, 2, 3, 4].map((i) => (
            <G key={i}>
              <Line x1="60" x2="1020" y1={500 + i * 230} y2={500 + i * 230} />
              <Line x1="330" x2="330" y1={520 + i * 230} y2={555 + i * 230} />
              <Line x1="750" x2="750" y1={520 + i * 230} y2={555 + i * 230} />
            </G>
          ))}
        </G>
      )}
      <Text x="70" y="92" fill="#FFFFFF" fontSize="32" fontWeight="900" letterSpacing="4">
        PLAYERHYPE<Text fill={accent}> / </Text>
        {p.sport === 'football' ? 'FB' : 'BB'}
      </Text>
      <Text x="1000" y="92" textAnchor="end" fill={accent} fontSize="24" letterSpacing="3">
        GAME DAY
      </Text>
      <Text
        x="540"
        y={compact ? 370 : 610}
        textAnchor="middle"
        fill={accent}
        opacity="0.11"
        fontSize={compact ? 380 : 520}
        fontWeight="900"
        fontFamily="BarlowCondensed_800ExtraBold"
      >
        {p.number || '01'}
      </Text>
      {p.photoUri ? (
        <Image
          href={{ uri: p.photoUri }}
          x="90"
          y={photoY}
          width="900"
          height={photoH}
          preserveAspectRatio={p.cutout ? 'xMidYMax meet' : 'xMidYMid slice'}
          clipPath="url(#photo)"
          onLoad={onPhotoLoad}
        />
      ) : (
        <G>
          {/* Original geometric athlete illustration, not a real person's photograph. */}
          <Circle
            cx="545"
            cy={photoY + 180}
            r="95"
            fill="#303B3C"
            stroke={accent}
            strokeWidth="4"
          />
          <Path
            d={`M450 ${photoY + 270} L340 ${photoY + 340} L250 ${photoY + 700} L355 ${photoY + 725} L410 ${photoY + 530} L395 ${photoY + photoH} L700 ${photoY + photoH} L680 ${photoY + 530} L750 ${photoY + 725} L850 ${photoY + 700} L740 ${photoY + 340} L635 ${photoY + 270} Z`}
            fill="#263335"
            stroke={accent}
            strokeWidth="3"
          />
          <Text
            x="545"
            y={photoY + 560}
            textAnchor="middle"
            fontSize="180"
            fill={accent}
            fontWeight="900"
          >
            {p.number || '01'}
          </Text>
          <Path
            d={`M475 ${photoY + 165} L620 ${photoY + 165} M490 ${photoY + 190} L605 ${photoY + 190}`}
            stroke={accent}
            strokeWidth="8"
          />
        </G>
      )}
      <Rect
        y={photoY + photoH * 0.45}
        width="1080"
        height={H - photoY - photoH * 0.45}
        fill="url(#wash)"
      />
      <Text x="72" y={nameY - 85} fill={accent} fontSize="27" letterSpacing="7">
        {p.team.toUpperCase() || 'YOUR TEAM'} • #{p.number || '01'}
      </Text>
      <Text
        x="65"
        y={nameY + 25}
        fill="white"
        fontSize={Math.min(132, 920 / (Math.max(p.name.length, 9) * 0.65))}
        fontFamily="BarlowCondensed_800ExtraBold"
        fontWeight="800"
        letterSpacing="-1"
      >
        {p.name.toUpperCase() || 'YOUR NAME'}
      </Text>
      <Rect x="72" y={nameY + 61} width="100" height="7" fill={accent} />
      <Text x="72" y={nameY + 125} fill="white" fontSize="38" fontWeight="700">
        {p.opponent ? `VS ${p.opponent.toUpperCase()}` : 'BUILT FOR THIS MOMENT.'}
      </Text>
      <Text x="72" y={H - 90} fill="#C6CBCF" fontSize="25" letterSpacing="2">
        {[p.date, p.time].filter(Boolean).join('  /  ') || 'YOUR GAME. YOUR MOMENT. YOUR HYPE.'}
      </Text>
      <Text x="1000" y={H - 90} textAnchor="end" fill={accent} fontSize="22" fontWeight="900">
        PH /
      </Text>
      <Rect x="0" y={H - 16} width="1080" height="16" fill={accent} />
    </Svg>
  );
}
