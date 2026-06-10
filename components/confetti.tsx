import { MotiView } from 'moti';
import { useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import { Easing } from 'react-native-reanimated';

const COLORS = ['#E4007A', '#00B37A', '#E48A00', '#7A00E4', '#00A6C4', '#007AE4', '#2FB872', '#fff'];

// A single, non-looping confetti burst. Mount it once on screen arrival; each
// piece falls + drifts + spins exactly once, then settles invisible.
export function Confetti({ count = 44 }: { count?: number }) {
  const { width, height } = Dimensions.get('window');

  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        key: i,
        startX: width / 2 + (Math.random() - 0.5) * width * 0.5,
        endX: width / 2 + (Math.random() - 0.5) * width * 1.1,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 220,
        duration: 1400 + Math.random() * 900,
        rotate: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        radius: Math.random() > 0.5 ? 2 : 8,
      })),
    [count, width],
  );

  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <MotiView
          key={p.key}
          from={{ translateX: p.startX, translateY: -40, opacity: 1, rotate: '0deg' }}
          animate={{
            translateX: p.endX,
            translateY: height + 60,
            opacity: 0,
            rotate: `${p.rotate}deg`,
          }}
          transition={{
            type: 'timing',
            duration: p.duration,
            delay: p.delay,
            easing: Easing.in(Easing.quad),
            opacity: { type: 'timing', duration: p.duration, delay: p.delay + p.duration * 0.55 },
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.radius,
            backgroundColor: p.color,
          }}
        />
      ))}
    </View>
  );
}
