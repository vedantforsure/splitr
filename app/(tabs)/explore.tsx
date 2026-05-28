import { Link } from 'expo-router';
import { MotiView } from 'moti';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="w-full items-center gap-3 rounded-3xl bg-neutral-900 p-8">
          <Text className="text-2xl font-bold text-white">Explore</Text>
          <Text className="text-center text-base text-neutral-400">
            Second placeholder screen. Drop your converted Figma screens into{'\n'}
            <Text className="text-neutral-200">app/</Text> as new routes.
          </Text>
          <Link href="/" className="mt-2 text-sm font-medium text-indigo-400">
            ← Back to Home
          </Link>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
