import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { PrimaryCTA } from '@/components/primary-cta';
import { actions } from '@/lib/store';
import { C, FONT, S } from '@/lib/theme';

const CORNER_SIZE = 38;
const CORNER_OFFSET = -2;
// The bracket arc sweeps a ~19px radius, so the box behind it matches at 20.
const BOX_RADIUS = 20;

// Scan-reticle corner. The SVG is the top-left bracket; rotating it 90° per step
// reuses the same path for all four corners.
function ScannerCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rotation = { tl: '0deg', tr: '90deg', br: '180deg', bl: '270deg' }[position];
  const placement = {
    tl: { top: CORNER_OFFSET, left: CORNER_OFFSET },
    tr: { top: CORNER_OFFSET, right: CORNER_OFFSET },
    br: { bottom: CORNER_OFFSET, right: CORNER_OFFSET },
    bl: { bottom: CORNER_OFFSET, left: CORNER_OFFSET },
  }[position];

  return (
    <View style={{ position: 'absolute', ...placement, transform: [{ rotate: rotation }] }}>
      <Svg width={CORNER_SIZE} height={CORNER_SIZE} viewBox="0 0 38 38" fill="none">
        <Path
          d="M34.8952 3.0001H22.2C15.4794 3.0001 12.1191 3.0001 9.55211 4.30802C7.29417 5.4585 5.4584 7.29427 4.30792 9.55221C3 12.1192 3 15.4795 3 22.2001V34.8953"
          stroke={C.accent}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export default function ScanScreen() {
  const [boxHeight, setBoxHeight] = useState(0);

  const begin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: camera / image picker, then OCR the receipt
    actions.beginCrew(); // fresh bill: host-only crew, cleared assignments
    router.push('/people');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <View className="flex-1 gap-[24px] p-[20px]">
        {/* Headline pair — same color-only hierarchy as ScreenHeader */}
        <View className="gap-[4px]">
          <Text
            className="text-center"
            style={{ fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text }}>
            Split the bill in seconds
          </Text>
          <Text
            className="text-center"
            style={{ fontFamily: FONT, fontSize: 20, lineHeight: 26, letterSpacing: -0.6, color: '#AAAAAA' }}>
            Scan a receipt and we&apos;ll do the math
          </Text>
        </View>

        {/* Viewfinder — resting surface, accent brackets, slow scanning sweep */}
        <View
          className="w-full flex-1 items-center justify-center overflow-hidden"
          style={{ borderRadius: BOX_RADIUS, backgroundColor: S.card }}
          onLayout={(e) => setBoxHeight(e.nativeEvent.layout.height)}>
          <View className="items-center gap-[10px]">
            <Feather name="file-text" size={28} color="rgba(255,255,255,0.25)" />
            <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: C.textFaint }}>
              Place your receipt in the frame
            </Text>
          </View>

          {boxHeight > 0 && (
            <MotiView
              pointerEvents="none"
              from={{ translateY: 14 }}
              animate={{ translateY: boxHeight - 16 }}
              transition={{ type: 'timing', duration: 2400, easing: Easing.inOut(Easing.ease), loop: true }}
              className="absolute left-[14px] right-[14px] top-0 h-[2px]"
              style={{ backgroundColor: C.accent, borderRadius: 1, opacity: 0.45 }}
            />
          )}

          <ScannerCorner position="tl" />
          <ScannerCorner position="tr" />
          <ScannerCorner position="bl" />
          <ScannerCorner position="br" />
        </View>

        {/* Primary scan action, quiet gallery fallback */}
        <View className="gap-[4px]">
          <PrimaryCTA label="Scan receipt" icon="camera" onPress={begin} />
          <Pressable
            onPress={begin}
            className="items-center py-[14px] transition active:scale-[0.97] active:opacity-60">
            <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: '#AAAAAA' }}>
              or upload from the gallery
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
