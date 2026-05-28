# Mobile Interactive Prototype Starter

A frontend-only Expo starter for building **interactive mobile prototypes** — the kind you convert from Figma designs and share with people. No backend, no data layer; just screens, navigation, animation, haptics, and sound.

Pinned to **Expo SDK 54** so it runs in the public **Expo Go** app (scan a QR, no build needed).

## Stack

- **Expo + Expo Router** — file-based navigation (`app/` directory)
- **NativeWind** — Tailwind CSS classes in React Native
- **Reanimated + Gesture Handler** — native-thread animations and gestures
- **Moti** — quick declarative enter/exit animations
- **expo-haptics** — tactile feedback on tap
- **expo-audio** — sound playback (a bundled offline beep in `assets/sounds/`)

## Get started

```bash
npm install
npx expo start
```

Then open it on your phone:

1. Install **Expo Go** (App Store / Play Store)
2. Make sure your phone and computer are on the **same Wi-Fi**
3. Scan the QR code from the terminal:
   - **iPhone** — use the built-in Camera app, then tap the banner
   - **Android** — use the "Scan QR code" button inside Expo Go

Or press `w` to preview in a browser.

## Where to build

- `app/(tabs)/index.tsx` and `app/(tabs)/explore.tsx` — the two starter screens
- Add new screens as files in `app/` — each file becomes a route
- `app/(tabs)/_layout.tsx` — the bottom tab bar
- `global.css` + `tailwind.config.js` — NativeWind/Tailwind config

## Reuse as a template

Start a new prototype from this repo:

```bash
npx create-expo-app@latest my-new-app --template <this-repo-git-url>
```

## Share as an installable app (later)

Android APK via EAS (free, no Mac needed):

```bash
npx eas build -p android --profile preview
```

iPhone sharing requires a TestFlight build (`eas build -p ios`) and a paid Apple Developer account.

## Note on Expo SDK

This starter is intentionally kept on the SDK that public Expo Go supports (currently **54**). If you bump the SDK past what your installed Expo Go supports, Expo Go will refuse to load it and you'll need a custom development build instead.
