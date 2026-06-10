import { MotiView } from 'moti';
import { View } from 'react-native';
import { Easing } from 'react-native-reanimated';

import { C } from '@/lib/theme';

// Shared track + animated fill. Used by both the assign and settle screens so
// the same "progress" idea reads the same way in both places. The fill is a
// full-width layer scaled on the X axis from its left edge — animating
// transform (GPU) instead of width (layout) keeps it smooth.
export function ProgressBar({
  progress,
  color = C.accent,
  height = 8,
}: {
  progress: number;
  color?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={{ height, borderRadius: height, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <MotiView
        animate={{ scaleX: clamped }}
        transition={{ type: 'timing', duration: 240, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: height,
          backgroundColor: color,
          transformOrigin: 'left',
        }}
      />
    </View>
  );
}
