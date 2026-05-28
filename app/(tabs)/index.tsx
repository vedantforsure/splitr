import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const tapSound = require('@/assets/sounds/tap.wav');

export default function HomeScreen() {
  const player = useAudioPlayer(tapSound);
  const [count, setCount] = useState(0);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.seekTo(0);
    player.play();
    setCount((c) => c + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <View className="flex-1 items-center justify-center px-6">
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="w-full items-center gap-3 rounded-3xl bg-neutral-900 p-8">
          <Text className="text-3xl font-bold text-white">Prototype Ready</Text>
          <Text className="text-center text-base text-neutral-400">
            Expo Router · NativeWind · Reanimated · Moti · Gesture Handler · Haptics · Audio
          </Text>

          <MotiView
            key={count}
            from={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="mt-2">
            <Pressable
              onPress={handlePress}
              className="rounded-full bg-indigo-500 px-8 py-4 active:bg-indigo-600">
              <Text className="text-base font-semibold text-white">
                Tap me {count > 0 ? `(${count})` : ''}
              </Text>
            </Pressable>
          </MotiView>

          <Link href="/explore" className="mt-4 text-sm font-medium text-indigo-400">
            Go to Explore →
          </Link>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
