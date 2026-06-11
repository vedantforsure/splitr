import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/avatar';
import { Confetti } from '@/components/confetti';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { FinishGhost, finishMorph, Rect } from '@/components/cta-morph';
import { PrimaryCTA } from '@/components/primary-cta';
import { actions, HOST_ID, money, roundedTotals, useStore } from '@/lib/store';
import { C, FONT, T } from '@/lib/theme';

/* ─────────────────────────────────────────────────────────
 * ENTRANCE STORYBOARD
 *
 *    0ms   check circle pops in, scale 0.6 → 1.0 — unless the
 *          Finish pill is morphing in, in which case the circle
 *          is the pill's landing spot and everything else waits
 *          for touchdown (~240ms)
 *  120ms   "All settled" headline rises
 *  200ms   collected-amount copy rises
 *  300ms   crew avatar stack rises
 * ───────────────────────────────────────────────────────── */
const BEAT = {
  check: 0,
  headline: 120,
  copy: 200,
  avatars: 300,
};

const EASE = Easing.bezier(0.23, 1, 0.32, 1);

const rise = (delay: number) => ({
  from: { opacity: 0, translateY: 8 },
  animate: { opacity: 1, translateY: 0 },
  transition: { type: 'timing' as const, duration: 220, delay, easing: EASE },
});

export default function DoneScreen() {
  const state = useStore((s) => s);
  const others = useMemo(() => state.people.filter((p) => p.id !== HOST_ID), [state.people]);
  const rounded = useMemo(() => roundedTotals(state), [state]);
  const collected = useMemo(() => others.reduce((s, p) => s + (rounded[p.id] ?? 0), 0), [others, rounded]);

  // Exactly one light haptic on arrival; the confetti fires once on mount.
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Finish-pill handoff: consumed once on mount. While the ghost flies, the
  // real circle stays invisible at the landing rect; everything else holds
  // for touchdown so the morph leads the entrance.
  const [handoff] = useState<Rect | null>(() => {
    const f = finishMorph.from;
    finishMorph.from = null;
    return f;
  });
  const [target, setTarget] = useState<Rect | null>(null);
  const [landed, setLanded] = useState(!handoff);
  const checkRef = useRef<View>(null);
  const beatOffset = handoff ? 240 : 0;

  const measureCheck = () => {
    if (!handoff || target) return;
    requestAnimationFrame(() => {
      checkRef.current?.measureInWindow((x, y, width, height) => {
        setTarget({ x, y, width, height });
      });
    });
  };

  // Reset wipes the bill and its summary, so it gets a confirm first.
  const [confirmReset, setConfirmReset] = useState(false);
  const splitAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    actions.reset();
    router.dismissAll();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <Confetti />

      <View className="flex-1 items-center justify-center px-[28px]">
        <View ref={checkRef} collapsable={false} onLayout={measureCheck}>
          <MotiView
            from={handoff ? { scale: 1, opacity: 0 } : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: landed ? 1 : 0 }}
            transition={{
              type: 'timing',
              duration: handoff ? 0 : 240,
              delay: handoff ? 0 : BEAT.check,
              easing: EASE,
            }}
            className="h-[88px] w-[88px] items-center justify-center rounded-full"
            style={{ backgroundColor: C.green }}>
            <Feather name="check" size={48} color="#fff" />
          </MotiView>
        </View>

        <MotiView {...rise(BEAT.headline + beatOffset)} className="mt-[24px]">
          <Text style={{ fontFamily: FONT, fontSize: T.h1, letterSpacing: -0.78, color: C.text }}>
            All settled
          </Text>
        </MotiView>
        <MotiView {...rise(BEAT.copy + beatOffset)} className="mt-[10px]">
          <Text
            className="text-center"
            style={{ fontFamily: FONT, fontSize: T.body, lineHeight: 23, letterSpacing: -0.48, color: '#AAAAAA' }}>
            You collected {money(collected)} from {others.length} {others.length === 1 ? 'friend' : 'friends'}.
            {'\n'}No one owes you a thing.
          </Text>
        </MotiView>

        <MotiView {...rise(BEAT.avatars + beatOffset)} className="mt-[26px]">
          <AvatarStack people={others} all={state.people} size={48} max={6} borderColor={C.bg} />
        </MotiView>
      </View>

      <View className="px-[20px] pb-[12px]">
        <PrimaryCTA label="Split another bill" onPress={() => setConfirmReset(true)} />
        <Pressable onPress={() => router.push('/summary')} className="mt-[6px] items-center py-[14px] transition active:scale-[0.97] active:opacity-60">
          <Text style={{ fontFamily: FONT, fontSize: T.body, letterSpacing: -0.48, color: '#AAAAAA' }}>View summary</Text>
        </Pressable>
      </View>

      {/* The Finish pill, mid-flight from the settle screen */}
      {handoff && target && !landed && (
        <FinishGhost from={handoff} to={target} onDone={() => setLanded(true)} />
      )}

      <ConfirmSheet
        visible={confirmReset}
        title="Start a new split?"
        message="This clears the current bill and its summary."
        cancelLabel="Keep this one"
        confirmLabel="Start new"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          splitAnother();
        }}
      />
    </SafeAreaView>
  );
}
