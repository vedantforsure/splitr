import { AnimatePresence, MotiText } from 'moti';
import { View } from 'react-native';
import { Easing } from 'react-native-reanimated';

import { money } from '@/lib/store';

// A number that "rolls" when its value changes: the new figure slides up from
// below while the old one slides out the top. Used for live per-person totals.
export function RollingNumber({
  value,
  fontSize = 15,
  color = '#fff',
  fontFamily = 'OpenRunde-Semibold',
}: {
  value: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
}) {
  const text = money(value);
  const height = Math.round(fontSize * 1.3);

  return (
    <View style={{ height, overflow: 'hidden', justifyContent: 'center' }}>
      {/* initial={false}: show the first value statically, only roll on change */}
      <AnimatePresence initial={false}>
        <MotiText
          key={text}
          from={{ translateY: height, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: -height, opacity: 0 }}
          transition={{ type: 'timing', duration: 180, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
          style={{
            position: 'absolute',
            fontSize,
            color,
            fontFamily,
            letterSpacing: -0.4,
            // tabular figures keep the roll from jittering as digit widths change
            fontVariant: ['tabular-nums'],
          }}>
          {text}
        </MotiText>
      </AnimatePresence>
    </View>
  );
}
