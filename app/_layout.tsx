import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import '@/global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'OpenRunde-Regular': require('@/assets/fonts/OpenRunde-Regular.otf'),
    'OpenRunde-Medium': require('@/assets/fonts/OpenRunde-Medium.otf'),
    'OpenRunde-Semibold': require('@/assets/fonts/OpenRunde-Semibold.otf'),
    'OpenRunde-Bold': require('@/assets/fonts/OpenRunde-Bold.otf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="people" />
          <Stack.Screen name="assign" />
          <Stack.Screen name="review" />
          <Stack.Screen name="settle" />
          <Stack.Screen name="done" />
          <Stack.Screen name="summary" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
