import { Feather } from '@expo/vector-icons';
import { MotiText, MotiView } from 'moti';
import { Pressable, View } from 'react-native';
import { Easing } from 'react-native-reanimated';

import { C, FONT, R } from '@/lib/theme';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);

// The one pill CTA. Optional leading icon and optional trailing value (used by
// "Review & collect  ₹1,771"). State changes (disabled ⇄ enabled, accent ⇄
// green) animate fill and label color so the pill transforms instead of
// snapping between looks.
export function PrimaryCTA({
  label,
  onPress,
  icon,
  value,
  disabled = false,
  color = C.accent,
  className = '',
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  value?: string;
  disabled?: boolean;
  color?: string;
  className?: string;
}) {
  const fg = disabled ? C.textFaint : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-full flex-row items-center px-[24px] py-[16px] transition active:scale-[0.97] active:opacity-90 ${
        value ? 'justify-between' : 'justify-center gap-[10px]'
      } ${className}`}
      style={{ borderRadius: R.pill }}>
      <MotiView
        pointerEvents="none"
        className="absolute inset-0"
        animate={{ backgroundColor: disabled ? '#2A2A2A' : color }}
        transition={{ type: 'timing', duration: 200, easing: EASE }}
        style={{ borderRadius: R.pill }}
      />
      <View className="flex-row items-center gap-[10px]">
        {icon && <Feather name={icon} size={20} color={fg} />}
        <MotiText
          // moti's types only cover ViewStyle here, but color animates fine
          animate={{ color: fg } as Record<string, unknown>}
          transition={{ type: 'timing', duration: 200, easing: EASE }}
          style={{ fontFamily: FONT, fontSize: 20, letterSpacing: -0.6 }}>
          {label}
        </MotiText>
      </View>
      {value && (
        <MotiText
          animate={{ color: fg } as Record<string, unknown>}
          transition={{ type: 'timing', duration: 200, easing: EASE }}
          style={{ fontFamily: FONT, fontSize: 20, letterSpacing: -0.6, fontVariant: ['tabular-nums'] }}>
          {value}
        </MotiText>
      )}
    </Pressable>
  );
}
