import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { C, FONT, R } from '@/lib/theme';

// The one pill CTA. Optional leading icon and optional trailing value (used by
// "Review & collect  ₹1,771"). Disabled state dims fill + text.
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
      style={{ borderRadius: R.pill, backgroundColor: disabled ? '#2A2A2A' : color }}>
      <View className="flex-row items-center gap-[10px]">
        {icon && <Feather name={icon} size={20} color={fg} />}
        <Text style={{ fontFamily: FONT, fontSize: 20, letterSpacing: -0.6, color: fg }}>
          {label}
        </Text>
      </View>
      {value && (
        <Text style={{ fontFamily: FONT, fontSize: 20, letterSpacing: -0.6, color: fg, fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      )}
    </Pressable>
  );
}
