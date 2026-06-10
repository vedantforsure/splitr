import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MotiView } from 'moti';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { PrimaryCTA } from '@/components/primary-cta';
import { ScreenHeader } from '@/components/screen-header';
import { actions, colorForName, HOST_ID, initialFor, useStore } from '@/lib/store';
import { C, FONT, FONT_REG, R, S, T } from '@/lib/theme';

const UPI_KEY = 'split.hostUpiId';

// Fixed "recently split with" names for the prototype.
const RECENTS = ['Diya', 'Priya', 'Aryan', 'Raj', 'Jai'];

// Stub phonebook for the prototype — first entry matches the Figma design.
const CONTACTS = [
  { name: 'Arjun', phone: '983456712' },
  { name: 'Meera', phone: '991204385' },
  { name: 'Kabir', phone: '976531248' },
  { name: 'Sana', phone: '988812706' },
  { name: 'Rohan', phone: '970245913' },
];

// Window-coordinate rect for the chip→row hero flight.
type Rect = { x: number; y: number; width: number; height: number };
type Flight = { name: string; detail: string; from: Rect; to: Rect | null };

export default function PeopleScreen() {
  const people = useStore((s) => s.people);

  const [upiId, setUpiId] = useState('');
  const [upiNeeded, setUpiNeeded] = useState(false);
  const [upiLoaded, setUpiLoaded] = useState(false);

  // Contacts pulled in from the recents chips become real rows at the top of
  // the list (they stay even when toggled back off, so they can be re-added).
  const [extraContacts, setExtraContacts] = useState<{ name: string; detail: string }[]>([]);
  // Display order of the contact list, by name. Added members get stacked to
  // the top after a beat (delayed re-sort, animated via layout transitions).
  const [order, setOrder] = useState<string[]>(() => CONTACTS.map((c) => c.name));

  const entries = useMemo(
    () => [...extraContacts, ...CONTACTS.map((c) => ({ name: c.name, detail: c.phone }))],
    [extraContacts],
  );

  const inCrewByName = (name: string) =>
    people.find((p) => p.id !== HOST_ID && p.name.toLowerCase() === name.toLowerCase());

  // After a burst of toggles goes quiet, stable-partition the list: crew
  // gathers at the top (in the order they were added to), everyone else
  // settles below in their existing order. Each toggle resets the timer, so
  // nothing moves mid-burst; 800ms ≈ 2× a slow inter-tap gap, so the gather
  // starts almost as soon as the user hesitates without firing between taps.
  const crewKey = people.map((p) => p.name).join('|');
  useEffect(() => {
    const t = setTimeout(() => {
      setOrder((prev) => [...prev.filter((n) => inCrewByName(n)), ...prev.filter((n) => !inCrewByName(n))]);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewKey]);

  useEffect(() => {
    (async () => {
      const savedUpi = await AsyncStorage.getItem(UPI_KEY);
      setUpiNeeded(!savedUpi);
      setUpiLoaded(true);
    })();
  }, []);

  const canContinue = people.length >= 2 && (!upiNeeded || upiId.trim().length > 0);

  const availableRecents = useMemo(
    () =>
      RECENTS.filter(
        (r) =>
          !people.some((p) => p.name.toLowerCase() === r.toLowerCase()) &&
          !extraContacts.some((c) => c.name.toLowerCase() === r.toLowerCase()),
      ),
    [people, extraContacts],
  );

  // Hero flight: the tapped chip's rect is captured, the real row mounts
  // hidden, and once the row reports its rect a ghost flies between the two,
  // morphing pill→row mid-flight. The row is revealed when the ghost lands.
  const [flight, setFlight] = useState<Flight | null>(null);
  const chipRefs = useRef<Record<string, View | null>>({});
  const flightRowRef = useRef<View | null>(null);

  const handleAddRecent = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const commit = (from: Rect | null) => {
      setExtraContacts((prev) => [{ name, detail: 'Recent' }, ...prev]);
      setOrder((prev) => [name, ...prev]);
      actions.addPerson(name);
      if (from) setFlight({ name, detail: 'Recent', from, to: null });
    };
    const chip = chipRefs.current[name];
    if (chip) chip.measureInWindow((x, y, width, height) => commit({ x, y, width, height }));
    else commit(null);
  };

  const onFlightRowLayout = () => {
    // measure on the next frame so the native layout pass has fully settled
    requestAnimationFrame(() => {
      flightRowRef.current?.measureInWindow((x, y, width, height) => {
        setFlight((f) => (f && !f.to ? { ...f, to: { x, y, width, height } } : f));
      });
    });
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (upiNeeded && upiId.trim()) await AsyncStorage.setItem(UPI_KEY, upiId.trim());
    router.push('/assign');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header — 1:1 from Figma node 147:1058 (now the shared pattern). */}
        <ScreenHeader
          title="Assemble the crew"
          subtitle="Select the friends you are splitting with"
          onBack={() => router.back()}
        />

        <ScrollView
          className="flex-1 px-[20px]"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Contact list — rows 1:1 from Figma node 147:1070 (avatar swapped
              for a plain blue circle per request). Header has pb-[14px], so
              mt-[26px] lands the requested 40px gap below it. "You" leads the
              list so the host can opt out of the split; every row toggles. */}
          <View className="mt-[26px] gap-[12px]">
            <ContactRow
              name="You"
              detail="Host"
              inCrew={people.some((p) => p.id === HOST_ID)}
              onToggle={() => actions.toggleHost()}
            />
            {order.map((name, i) => {
              const entry = entries.find((e) => e.name === name);
              if (!entry) return null;
              const member = inCrewByName(name);
              const isFlying = flight?.name === name;
              return (
                <Animated.View
                  key={name}
                  // Duration-based travel, no spring: a strong in-out curve at
                  // 240ms moves rows decisively and stops them dead — no float.
                  layout={LinearTransition.duration(240)
                    .easing(Easing.bezier(0.77, 0, 0.175, 1))
                    .delay(Math.min(i * 15, 75))}
                  style={{ opacity: isFlying ? 0 : 1 }}>
                  <View
                    ref={isFlying ? flightRowRef : undefined}
                    onLayout={isFlying && !flight.to ? onFlightRowLayout : undefined}>
                    <ContactRow
                      name={entry.name}
                      detail={entry.detail}
                      inCrew={!!member}
                      onToggle={() =>
                        member ? actions.removePerson(member.id) : actions.addPerson(entry.name)
                      }
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>

          {/* One-time host UPI ID */}
          {upiLoaded && upiNeeded && (
            <View className="mt-[24px]">
              <Text className="mb-[8px]" style={{ fontFamily: FONT_REG, fontSize: T.small, color: C.textFaint }}>
                Your UPI ID (so friends can pay you back)
              </Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="yourname@upi"
                placeholderTextColor={C.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                className="px-[14px] py-[14px]"
                style={{ borderRadius: R.md, backgroundColor: S.card, fontFamily: FONT, fontSize: T.body, letterSpacing: -0.4, color: C.text }}
              />
            </View>
          )}

          <View className="h-[20px]" />
        </ScrollView>

        <View className="px-[20px] pb-[8px] pt-[12px]">
          {/* Recently used friends — pinned just above the CTA */}
          {availableRecents.length > 0 && (
            <View className="mb-[14px]">
              <Text className="mb-[10px]" style={{ fontFamily: FONT_REG, fontSize: T.small, color: C.textFaint }}>
                Recently split with
              </Text>
              <View className="flex-row flex-wrap gap-[8px]">
                {availableRecents.map((name) => (
                  <Pressable
                    key={name}
                    ref={(node) => {
                      chipRefs.current[name] = node;
                    }}
                    onPress={() => handleAddRecent(name)}
                    className="flex-row items-center gap-[6px] px-[12px] py-[8px] transition active:scale-[0.96] active:opacity-70"
                    style={{ borderRadius: R.pill, backgroundColor: S.chip }}>
                    <Feather name="plus" size={14} color={C.textDim} />
                    <Text style={{ fontFamily: FONT, fontSize: T.label, color: C.text }}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {/* Why the CTA is dim — one quiet line, only while it's disabled */}
          {upiLoaded && !canContinue && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 160, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
              className="mb-[10px] items-center">
              <Text style={{ fontFamily: FONT, fontSize: T.small, color: C.textFaint }}>
                {people.length < 2
                  ? 'Add at least one friend to continue'
                  : 'Enter your UPI ID to continue'}
              </Text>
            </MotiView>
          )}
          <PrimaryCTA label="Continue" onPress={handleContinue} disabled={!canContinue} />
        </View>
      </KeyboardAvoidingView>

      {flight?.to && (
        <FlightGhost flight={{ ...flight, to: flight.to }} onDone={() => setFlight(null)} />
      )}
    </SafeAreaView>
  );
}

// The hero ghost: an absolutely-positioned pill that tweens from the tapped
// chip's rect to the landed row's rect, cross-fading its chip face into the
// row face mid-flight. Purely visual — the real row sits hidden underneath
// and takes over the moment the ghost lands.
function FlightGhost({ flight, onDone }: { flight: Flight & { to: Rect }; onDone: () => void }) {
  const { name, detail, from, to } = flight;

  useEffect(() => {
    const t = setTimeout(onDone, 340);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MotiView
      pointerEvents="none"
      from={{
        left: from.x,
        top: from.y,
        width: from.width,
        height: from.height,
        backgroundColor: S.chip,
      }}
      animate={{
        left: to.x,
        top: to.y,
        width: to.width,
        height: to.height,
        backgroundColor: 'rgba(255,255,255,0)',
      }}
      transition={{ type: 'timing', duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1) }}
      className="absolute justify-center overflow-hidden"
      style={{ borderRadius: R.pill }}>
      {/* chip face — fades out as the flight begins */}
      <MotiView
        from={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ type: 'timing', duration: 100, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
        className="absolute inset-0 flex-row items-center gap-[6px] px-[12px]">
        <Feather name="plus" size={14} color={C.textDim} />
        <Text style={{ fontFamily: FONT, fontSize: T.label, color: C.text }}>{name}</Text>
      </MotiView>
      {/* row face — fades in mid-flight, lands as the real row */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 200, delay: 80, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
        className="absolute inset-0 justify-center">
        <ContactRow name={name} detail={detail} inCrew onToggle={() => {}} />
      </MotiView>
    </MotiView>
  );
}

// Check-in-circle glyph for the pill's added state (provided SVG, 24px, white).
function AddedIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.70711 11.7929C8.31658 11.4024 7.68342 11.4024 7.29289 11.7929C6.90237 12.1834 6.90237 12.8166 7.29289 13.2071L8 12.5L8.70711 11.7929ZM10.5 15L9.79289 15.7071C9.98576 15.9 10.249 16.0057 10.5217 15.9998C10.7944 15.9938 11.0528 15.8768 11.2372 15.6757L10.5 15ZM16.7372 9.67572C17.1103 9.26861 17.0828 8.63604 16.6757 8.26285C16.2686 7.88965 15.636 7.91716 15.2628 8.32428L16 9L16.7372 9.67572ZM22 12H23C23 5.92486 18.0751 1 12 1V2V3C16.9705 3 21 7.02944 21 12H22ZM12 2V1C5.92487 1 1 5.92487 1 12H2H3C3 7.02943 7.02943 3 12 3V2ZM2 12H1C1 18.0751 5.92486 23 12 23V22V21C7.02944 21 3 16.9705 3 12H2ZM12 22V23C18.0751 23 23 18.0751 23 12H22H21C21 16.9705 16.9705 21 12 21V22ZM8 12.5L7.29289 13.2071L9.79289 15.7071L10.5 15L11.2071 14.2929L8.70711 11.7929L8 12.5ZM10.5 15L11.2372 15.6757L16.7372 9.67572L16 9L15.2628 8.32428L9.76285 14.3243L10.5 15Z"
        fill="white"
      />
    </Svg>
  );
}

// One Figma-spec contact row: blue circle, name over detail line, toggle pill.
// The pill is fixed at 71×42 (the Figma "Add" size) so the text→icon morph
// never shifts the row; the two states cross-fade with a slight scale.
function ContactRow({
  name,
  detail,
  inCrew,
  onToggle,
}: {
  name: string;
  detail: string;
  inCrew: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      className="flex-row items-center gap-[20px] transition active:scale-[0.98] active:opacity-70">
      <View className="flex-1 flex-row items-center gap-[8px]">
        <View
          className="h-[40px] w-[40px] items-center justify-center"
          style={{ borderRadius: R.pill, backgroundColor: name === 'You' ? C.accent : colorForName(name) }}>
          <Text style={{ fontFamily: FONT, fontSize: 17, color: '#fff' }}>{initialFor(name)}</Text>
        </View>
        <View className="flex-1 gap-[4px]">
          <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 20, letterSpacing: -0.48, color: C.text }}>
            {name}
          </Text>
          <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 22, letterSpacing: -0.48, color: '#AAAAAA' }}>
            {detail}
          </Text>
        </View>
      </View>
      <MotiView
        animate={{ backgroundColor: inCrew ? C.accent : 'rgba(255,255,255,0.12)' }}
        transition={{ type: 'timing', duration: 140, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }}
        className="h-[42px] w-[71px] items-center justify-center"
        style={{ borderRadius: R.pill }}>
        {/* Icon-swap: pure 120ms ease-out timing, no spring — this toggle is
            hit constantly, so the morph must land instantly with zero bounce. */}
        <MotiView
          animate={{ opacity: inCrew ? 0 : 1, scale: inCrew ? 0.6 : 1 }}
          transition={{ type: 'timing', duration: inCrew ? 90 : 120, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
          className="absolute inset-0 items-center justify-center">
          <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 22, letterSpacing: -0.48, color: C.text }}>
            Add
          </Text>
        </MotiView>
        <MotiView
          animate={{ opacity: inCrew ? 1 : 0, scale: inCrew ? 1 : 0.6 }}
          transition={{ type: 'timing', duration: inCrew ? 120 : 90, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
          className="absolute inset-0 items-center justify-center">
          <AddedIcon />
        </MotiView>
      </MotiView>
    </Pressable>
  );
}
