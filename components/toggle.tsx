import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Pressable } from 'react-native';
import { Easing } from 'react-native-reanimated';

import { C } from '@/lib/theme';

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!value);
      }}
      className="h-[30px] w-[52px] justify-center rounded-full px-[3px]"
      style={{ backgroundColor: value ? C.accent : 'rgba(255,255,255,0.12)' }}>
      <MotiView
        animate={{ translateX: value ? 22 : 0 }}
        transition={{ type: 'timing', duration: 140, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
        className="h-[24px] w-[24px] rounded-full bg-white"
      />
    </Pressable>
  );
}
