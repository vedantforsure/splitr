import { Feather } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C, FONT, R } from '@/lib/theme';

// Shared header in the screen-2 language: a floating pill back button on its
// own row (with an optional right slot opposite it), then a centered
// headline + subheadline pair. One typeface/weight — hierarchy is color only.
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  below,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  below?: ReactNode;
}) {
  return (
    <View className="gap-[4px] px-[20px] pb-[14px] pt-[8px]">
      {(onBack || right) && (
        <View className="flex-row items-center justify-between">
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={10}
              className="h-[44px] w-[44px] items-center justify-center transition active:scale-[0.95] active:opacity-70"
              style={{ borderRadius: R.pill, backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Feather name="chevron-left" size={24} color={C.text} />
            </Pressable>
          ) : (
            <View />
          )}
          {right}
        </View>
      )}
      <Text
        className="self-stretch text-center"
        style={{ fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text }}>
        {title}
      </Text>
      {subtitle && (
        <Text
          className="self-stretch text-center"
          style={{ fontFamily: FONT, fontSize: 20, lineHeight: 26, letterSpacing: -0.6, color: '#AAAAAA' }}>
          {subtitle}
        </Text>
      )}
      {below}
    </View>
  );
}
