import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Text, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { C, FONT } from '@/lib/theme';

import { PrimaryCTA } from './primary-cta';

export type Rect = { x: number; y: number; width: number; height: number };

// Geometry handoff for the review → settle CTA morph. The review screen
// records its pill's window rect on layout; the settle footer's CTA mounts at
// that exact rect and expands into place while the screens cross-fade, so the
// pill reads as one continuous object travelling between screens.
export const ctaMorph: { from: { left: number; width: number } | null } = { from: null };

const SETTLE_EASE = Easing.bezier(0.23, 1, 0.32, 1); // fast start, soft landing

export function MorphingFooterCTA({
  sidePadding = 20,
  ...cta
}: Parameters<typeof PrimaryCTA>[0] & { sidePadding?: number }) {
  const { width: screenW } = useWindowDimensions();
  const fullWidth = screenW - sidePadding * 2;
  // Captured once on mount: a fresh arrival morphs, anything else lays out full width.
  const [from] = useState(() => ctaMorph.from);

  const w = useSharedValue(from ? from.width : fullWidth);
  const ml = useSharedValue(from ? from.left - sidePadding : 0);

  useEffect(() => {
    if (!from) return;
    // A short hold so the cross-fade registers the pill as the same object,
    // then a crisp 140ms expansion — same snap as the Add→Added pill morph.
    w.value = withDelay(70, withTiming(fullWidth, { duration: 140, easing: SETTLE_EASE }));
    ml.value = withDelay(70, withTiming(0, { duration: 140, easing: SETTLE_EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ width: w.value, marginLeft: ml.value }));

  return (
    <Animated.View style={style}>
      <PrimaryCTA {...cta} />
    </Animated.View>
  );
}

// Geometry handoff for the settle → done morph: the green "Finish" pill
// becomes the done screen's success circle instead of being replaced by it.
export const finishMorph: { from: Rect | null } = { from: null };

// The flying object itself: a green pill that travels from the footer to the
// success circle's rect, rounding into a circle as its label dissolves into
// the check. The real circle underneath takes over the moment this lands.
export function FinishGhost({ from, to, onDone }: { from: Rect; to: Rect; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MotiView
      pointerEvents="none"
      from={{
        left: from.x,
        top: from.y,
        width: from.width,
        height: from.height,
        borderRadius: from.height / 2,
      }}
      animate={{
        left: to.x,
        top: to.y,
        width: to.width,
        height: to.height,
        borderRadius: to.height / 2,
      }}
      transition={{ type: 'timing', duration: 360, easing: SETTLE_EASE }}
      className="absolute items-center justify-center overflow-hidden"
      style={{ backgroundColor: C.green }}>
      {/* pill face — releases the label as the flight begins */}
      <MotiView
        from={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ type: 'timing', duration: 120, easing: SETTLE_EASE }}
        className="absolute">
        <Text style={{ fontFamily: FONT, fontSize: 20, letterSpacing: -0.6, color: '#fff' }}>
          Finish
        </Text>
      </MotiView>
      {/* circle face — the check arrives mid-flight */}
      <MotiView
        from={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 200, delay: 140, easing: SETTLE_EASE }}
        className="absolute">
        <Feather name="check" size={48} color="#fff" />
      </MotiView>
    </MotiView>
  );
}
