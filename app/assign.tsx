import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssignChips } from '@/components/assign-chips';
import { EntrySheet, SheetState } from '@/components/entry-sheet';
import { PrimaryCTA } from '@/components/primary-cta';
import { ProgressBar } from '@/components/progress-bar';
import { ScreenHeader } from '@/components/screen-header';
import { Toggle } from '@/components/toggle';
import { actions, Item, lineTotal, money, Person, useStore } from '@/lib/store';
import { C, FONT, R, T } from '@/lib/theme';

/* ─────────────────────────────────────────────────────────
 * DECK GESTURE STORYBOARD
 *
 *  drag      card follows the finger, tilting translateX/18°;
 *            drags that can't succeed move at 1/3 (friction)
 *  → release card with assignees hands off to an exit overlay
 *            that finishes the flight (240ms, fast start so it
 *            inherits the throw); the next card promotes up from
 *            the peek slot in the same frame
 *  → release unassigned card wiggles back (−12 → 8 → 0) + warning haptic
 *  ← release previous card flies back in from the right
 *  ← on 1st  nothing to bring back: wiggle + warning haptic
 *  let go    snap-back is a velocity-aware spring, no bounce
 *  idle      deck nudges right — top card leads, peek follows a
 *            beat later — on landing and every few idle seconds,
 *            hinting that the cards swipe
 * ───────────────────────────────────────────────────────── */
const SETTLE = Easing.bezier(0.23, 1, 0.32, 1); // fast start, soft landing
// Crisp snap-back that keeps the finger's velocity; clamped = no bounce.
const SNAP = { damping: 28, stiffness: 320, overshootClamping: true } as const;

const warn = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
const tick = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

export default function AssignScreen() {
  const state = useStore((s) => s);
  const { people, items, splitEvenly } = state;
  const { width } = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState<SheetState>(null);

  // Items can be edited/deleted mid-deck; never point past the end.
  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const item: Item | undefined = items[safeIndex];
  const peek: Item | undefined = items[safeIndex + 1];

  // The card that just flew off lives on its own overlay + shared value. The
  // top card's drag position belongs to the card itself (see TopCard), so the
  // swap never resets a shared transform — that reset racing React's re-render
  // was what made the swiped card flash back in front of the deck.
  const [exiting, setExiting] = useState<Item | null>(null);
  const exitX = useSharedValue(0);
  // Swipe-hint nudge offsets, layered on top of the drag so a touch can interrupt mid-hint.
  const hintTop = useSharedValue(0);
  const hintPeek = useSharedValue(0);
  const dragging = useRef(false);
  // Set when the user swipes left, so the restored card slides in from the
  // right instead of playing the promote-from-peek entrance.
  const enterFromRight = useRef(false);

  const exitStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: exitX.value }, { rotate: `${exitX.value / 18}deg` }],
  }));

  const peekStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hintPeek.value }, { translateY: 14 }, { scale: 0.95 }],
  }));

  // "These swipe" hint: lean right, settle back. Peek trails the top card.
  const nudge = () => {
    if (dragging.current) return;
    const lean = (to: number) =>
      withSequence(
        withTiming(to, { duration: 260, easing: SETTLE }),
        withTiming(0, { duration: 420, easing: SETTLE }),
      );
    hintTop.value = lean(18);
    hintPeek.value = withDelay(90, lean(9));
  };

  // Nudge shortly after landing, then again whenever the deck sits idle.
  // Any interaction (swipe, chip tap, qty change) recreates the timers.
  useEffect(() => {
    if (splitEvenly || !item || sheet) return;
    const first = setTimeout(nudge, 700);
    const idle = setInterval(nudge, 6000);
    return () => {
      clearTimeout(first);
      clearInterval(idle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, splitEvenly, sheet, item?.assignedTo.length, item?.qty]);

  // Successful right-swipe: hand the card off to the exit overlay at its
  // release position and promote the next card in the same commit. The old
  // top card unmounts as the overlay mounts, so it can never reappear.
  const handleSwipeRight = (releaseX: number) => {
    if (!item) return;
    exitX.value = releaseX;
    setExiting(item);
    enterFromRight.current = false;
    setIndex(safeIndex + 1);
    exitX.value = withTiming(width * 1.2, { duration: 240, easing: SETTLE }, (finished) => {
      if (finished) runOnJS(setExiting)(null);
    });
  };

  // Swipe left: the previous card returns from off-screen right, on top.
  const handleSwipeLeft = () => {
    enterFromRight.current = true;
    setIndex(safeIndex - 1);
  };

  // Last card has nothing to promote: it flies itself off, then we leave.
  const finishDeck = () => {
    router.push('/review');
  };

  const setDragging = (v: boolean) => {
    dragging.current = v;
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <ScreenHeader
        title="Who had what?"
        subtitle="Tap the friends, swipe right when done"
        onBack={() => router.back()}
        below={
          <View className="mt-[14px] flex-row items-center gap-[10px]">
            <View className="flex-1">
              <ProgressBar progress={items.length ? (safeIndex + 1) / items.length : 0} />
            </View>
            <Text style={{ fontFamily: FONT, fontSize: T.small, color: '#AAAAAA', fontVariant: ['tabular-nums'] }}>
              {items.length ? safeIndex + 1 : 0} of {items.length}
            </Text>
          </View>
        }
      />

      {/* Deck */}
      <MotiView
        animate={{ opacity: splitEvenly ? 0.45 : 1 }}
        transition={{ type: 'timing', duration: 200, easing: SETTLE }}
        className="flex-1 justify-center px-[20px]">
        {item ? (
          <View>
            {peek && (
              <Animated.View
                pointerEvents="none"
                className="absolute left-0 right-0 top-0"
                style={[{ opacity: 0.6 }, peekStyle]}>
                {/* Re-keyed so a freshly revealed peek fades in instead of popping */}
                <MotiView
                  key={peek.id}
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 200, easing: SETTLE }}>
                  <CardFace item={peek} people={people} />
                </MotiView>
              </Animated.View>
            )}

            {/* Re-keyed per card: each top card owns its drag position from a
                clean 0, so promotion never reuses (or resets) the previous
                card's transform */}
            <TopCard
              key={item.id}
              item={item}
              people={people}
              width={width}
              enabled={!splitEvenly}
              canSwipeRight={item.assignedTo.length > 0}
              hasPrev={safeIndex > 0}
              isLast={safeIndex >= items.length - 1}
              enterFromRight={enterFromRight.current}
              hintTop={hintTop}
              hintPeek={hintPeek}
              onDragging={setDragging}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onFinish={finishDeck}
              onEdit={() => setSheet({ kind: 'editItem', item })}
            />

            {/* The card that was just swiped away, finishing its flight above the deck */}
            {exiting && (
              <Animated.View
                pointerEvents="none"
                className="absolute left-0 right-0 top-0"
                style={exitStyle}>
                <CardFace item={exiting} people={people} />
              </Animated.View>
            )}
          </View>
        ) : (
          <Text className="text-center" style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: C.textFaint }}>
            No items on this bill yet
          </Text>
        )}
      </MotiView>

      {/* Footer: split-evenly short-circuits the deck */}
      <View className="px-[20px] pb-[8px] pt-[12px]">
        <View className="flex-row items-center gap-[14px]">
          <View className="items-start gap-[5px]">
            <Text style={{ fontFamily: FONT, fontSize: T.tiny, color: C.textDim }}>Split evenly</Text>
            <Toggle value={splitEvenly} onChange={actions.setSplitEvenly} />
          </View>
          {splitEvenly ? (
            <View className="flex-1">
              <PrimaryCTA label="Review the split" onPress={() => router.push('/review')} />
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/review')}
              className="flex-1 items-end py-[14px] transition active:scale-[0.97] active:opacity-60">
              <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: '#AAAAAA' }}>
                Skip to review
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <EntrySheet state={sheet} onClose={() => setSheet(null)} />
    </SafeAreaView>
  );
}

// The interactive top card. Keyed by item id in the parent, so every card
// mounts with its own drag position at 0 — the swap from one card to the next
// is a mount/unmount in a single React commit, never a shared-value reset.
function TopCard({
  item,
  people,
  width,
  enabled,
  canSwipeRight,
  hasPrev,
  isLast,
  enterFromRight,
  hintTop,
  hintPeek,
  onDragging,
  onSwipeRight,
  onSwipeLeft,
  onFinish,
  onEdit,
}: {
  item: Item;
  people: Person[];
  width: number;
  enabled: boolean;
  canSwipeRight: boolean;
  hasPrev: boolean;
  isLast: boolean;
  enterFromRight: boolean;
  hintTop: SharedValue<number>;
  hintPeek: SharedValue<number>;
  onDragging: (v: boolean) => void;
  onSwipeRight: (releaseX: number) => void;
  onSwipeLeft: () => void;
  onFinish: () => void;
  onEdit: () => void;
}) {
  // A card restored by a left-swipe starts off-screen right and flies in.
  const x = useSharedValue(enterFromRight ? width : 0);

  useEffect(() => {
    if (enterFromRight) {
      x.value = withTiming(0, { duration: 260, easing: SETTLE });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const tx = x.value + hintTop.value;
    return {
      transform: [{ translateX: tx }, { rotate: `${tx / 18}deg` }],
    };
  });

  // Last card: after it flies off we navigate; snap home behind the
  // transition so the deck looks right if the user comes back.
  const finish = () => {
    x.value = 0;
    onFinish();
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-16, 16]) // let pill taps and the stepper win
    .failOffsetY([-12, 12])
    .onBegin(() => {
      // A touch interrupts any in-flight hint so the card answers the finger 1:1
      hintTop.value = withTiming(0, { duration: 120, easing: SETTLE });
      hintPeek.value = withTiming(0, { duration: 120, easing: SETTLE });
      runOnJS(onDragging)(true);
    })
    .onFinalize(() => {
      runOnJS(onDragging)(false);
    })
    .onUpdate((e) => {
      // Friction on drags that can't succeed: the card resists instead of following 1:1
      const doomed = (e.translationX > 0 && !canSwipeRight) || (e.translationX < 0 && !hasPrev);
      x.value = doomed ? e.translationX / 3 : e.translationX;
    })
    .onEnd((e) => {
      const goRight = e.translationX > width * 0.3 || e.velocityX > 800;
      const goLeft = e.translationX < -width * 0.3 || e.velocityX < -800;

      if (goRight && canSwipeRight) {
        runOnJS(tick)();
        if (isLast) {
          x.value = withTiming(width * 1.2, { duration: 240, easing: SETTLE }, (finished) => {
            if (finished) runOnJS(finish)();
          });
        } else {
          // Hand off to the parent's exit overlay right away; it inherits the
          // release position so the throw reads as one continuous motion.
          runOnJS(onSwipeRight)(e.translationX);
        }
      } else if (goRight) {
        // Unassigned: refuse with a wiggle
        runOnJS(warn)();
        x.value = withSequence(
          withTiming(-12, { duration: 110, easing: SETTLE }),
          withTiming(8, { duration: 90, easing: SETTLE }),
          withTiming(0, { duration: 90, easing: SETTLE }),
        );
      } else if (goLeft && hasPrev) {
        x.value = withTiming(0, { duration: 160, easing: SETTLE }, (finished) => {
          if (finished) runOnJS(onSwipeLeft)();
        });
      } else if (goLeft) {
        runOnJS(warn)();
        x.value = withSequence(
          withTiming(12, { duration: 110, easing: SETTLE }),
          withTiming(-8, { duration: 90, easing: SETTLE }),
          withTiming(0, { duration: 90, easing: SETTLE }),
        );
      } else {
        // Below threshold: spring home with the finger's velocity, no bounce
        x.value = withSpring(0, { ...SNAP, velocity: e.velocityX });
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>
        {/* Promoted cards animate up from the peek slot's exact resting state;
            restored cards arrive full-size from the right instead */}
        <MotiView
          from={
            enterFromRight
              ? { scale: 1, translateY: 0, opacity: 1 }
              : { scale: 0.95, translateY: 14, opacity: 0.6 }
          }
          animate={{ scale: 1, translateY: 0, opacity: 1 }}
          transition={{ type: 'timing', duration: 200, easing: SETTLE }}>
          <CardFace item={item} people={people} onEdit={onEdit} />
        </MotiView>
      </Animated.View>
    </GestureDetector>
  );
}

// One food card in the deck — same surface language as the entry sheet.
function CardFace({
  item,
  people,
  onEdit,
}: {
  item: Item;
  people: Person[];
  onEdit?: () => void;
}) {
  const assignees = item.assignedTo.length;
  return (
    <View className="p-[24px]" style={{ backgroundColor: '#222222', borderRadius: 36, minHeight: 400 }}>
      <View className="flex-row items-start justify-between gap-[12px]">
        <Text
          className="flex-1"
          style={{ fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text }}>
          {item.name}
          {item.qty > 1 && <Text style={{ color: '#AAAAAA' }}> ×{item.qty}</Text>}
        </Text>
        {onEdit && (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            className="px-[14px] py-[7px] transition active:scale-[0.95] active:opacity-70"
            style={{ backgroundColor: '#333333', borderRadius: R.pill }}>
            <Text style={{ fontFamily: FONT, fontSize: T.label, color: C.text }}>Edit</Text>
          </Pressable>
        )}
      </View>

      <View className="mt-[8px] flex-row items-baseline gap-[8px]">
        <Text style={{ fontFamily: FONT, fontSize: 24, letterSpacing: -0.72, color: C.text, fontVariant: ['tabular-nums'] }}>
          {money(lineTotal(item))}
        </Text>
        {assignees > 1 && (
          <Text style={{ fontFamily: FONT, fontSize: T.small, color: '#AAAAAA', fontVariant: ['tabular-nums'] }}>
            {money(lineTotal(item) / assignees)} each
          </Text>
        )}
      </View>

      {/* Equal spacers above and below keep the stepper at the card's vertical center */}
      <View className="flex-1" />

      {/* Quantity stepper */}
      <View className="flex-row items-center justify-center">
        <View className="flex-row items-center gap-[28px]">
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              actions.setQty(item.id, item.qty - 1);
            }}
            disabled={item.qty <= 1}
            hitSlop={6}
            className="h-[52px] w-[52px] items-center justify-center rounded-full transition active:scale-[0.95] active:opacity-70"
            style={{ backgroundColor: '#333333', opacity: item.qty <= 1 ? 0.4 : 1 }}>
            <Feather name="minus" size={22} color={C.text} />
          </Pressable>
          <Text
            style={{ fontFamily: FONT, fontSize: 36, letterSpacing: -1.08, color: C.text, minWidth: 44, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
            {item.qty}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              actions.setQty(item.id, item.qty + 1);
            }}
            hitSlop={6}
            className="h-[52px] w-[52px] items-center justify-center rounded-full transition active:scale-[0.95] active:opacity-70"
            style={{ backgroundColor: '#333333' }}>
            <Feather name="plus" size={22} color={C.text} />
          </Pressable>
        </View>
      </View>

      <View className="flex-1" />

      <AssignChips item={item} people={people} />
    </View>
  );
}
