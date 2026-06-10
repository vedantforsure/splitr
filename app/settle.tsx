import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { PrimaryCTA } from '@/components/primary-cta';
import { ProgressBar } from '@/components/progress-bar';
import { RollingNumber } from '@/components/rolling-number';
import { ScreenHeader } from '@/components/screen-header';
import {
  actions,
  grandTotal,
  HOST_ID,
  money,
  Person,
  roundedTotals,
  SettleStatus,
  useStore,
} from '@/lib/store';
import { C, FONT, R, T } from '@/lib/theme';

const UPI_KEY = 'split.hostUpiId';
const ORDER: Record<SettleStatus, number> = { none: 0, requested: 1, paid: 2 };

export default function SettleScreen() {
  const state = useStore((s) => s);
  const { people, settle } = state;
  const [upi, setUpi] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(UPI_KEY).then((v) => v && setUpi(v));
  }, []);

  const host = people.find((p) => p.id === HOST_ID);
  const others = useMemo(() => people.filter((p) => p.id !== HOST_ID), [people]);
  const total = useMemo(() => grandTotal(state), [state]);
  const rounded = useMemo(() => roundedTotals(state), [state]);
  const statusOf = (id: number): SettleStatus => settle[id] ?? 'none';
  const shareOf = (id: number) => rounded[id] ?? 0;

  const owed = useMemo(() => others.reduce((s, p) => s + shareOf(p.id), 0), [others, rounded]);
  const collected = useMemo(
    () => others.reduce((s, p) => s + (statusOf(p.id) === 'paid' ? shareOf(p.id) : 0), 0),
    [others, rounded, settle],
  );
  const left = Math.max(0, owed - collected);
  const progress = owed > 0 ? collected / owed : 0;

  const sorted = useMemo(
    () => [...others].sort((a, b) => ORDER[statusOf(a.id)] - ORDER[statusOf(b.id)]),
    [others, settle],
  );

  const linkFor = (amount: number) =>
    `upi://pay?pa=${encodeURIComponent(upi || 'you@upi')}&pn=${encodeURIComponent(
      host?.name ?? 'Me',
    )}&am=${Math.round(amount)}&cu=INR&tn=${encodeURIComponent('Bill split')}`;

  const request = async (p: Person) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const amount = shareOf(p.id);
    // Mark requested only once the share actually went out — cancelling keeps the status honest.
    const res = await Share.share({ message: `Hey ${p.name}, your share is ${money(amount)}. Pay here: ${linkFor(amount)}` });
    if (res.action !== Share.dismissedAction) actions.setSettleStatus(p.id, 'requested');
  };

  const remind = async (p: Person) => {
    Haptics.selectionAsync();
    const amount = shareOf(p.id);
    await Share.share({ message: `Reminder ${p.name} — ${money(amount)} for the bill: ${linkFor(amount)}` });
  };

  const markPaid = (p: Person) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    actions.setSettleStatus(p.id, 'paid');
  };

  // Money state always has a reverse gear: tapping the Paid pill un-marks it.
  const unmarkPaid = (p: Person) => {
    Haptics.selectionAsync();
    actions.setSettleStatus(p.id, 'none');
  };

  const requestAll = async () => {
    const pending = others.filter((p) => statusOf(p.id) !== 'paid');
    if (pending.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const lines = pending.map((p) => `${p.name}: ${money(shareOf(p.id))} → ${linkFor(shareOf(p.id))}`);
    const res = await Share.share({ message: `Splitting ${money(total)}. Your shares:\n\n${lines.join('\n\n')}` });
    if (res.action !== Share.dismissedAction)
      pending.forEach((p) => actions.setSettleStatus(p.id, 'requested'));
  };

  const pendingCount = others.filter((p) => statusOf(p.id) !== 'paid').length;
  const allDone = pendingCount === 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <ScreenHeader
        title="Collect from your crew"
        subtitle={`You paid ${money(total)} for everyone`}
        onBack={() => router.back()}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Owed summary — open on the canvas, centered like the header.
            Once everyone has paid this becomes the win, not a ₹0 ledger. */}
        {allDone ? (
          <Animated.View entering={FadeInDown.duration(220)} className="mt-[26px] items-center">
            <View className="h-[56px] w-[56px] items-center justify-center rounded-full" style={{ backgroundColor: C.green }}>
              <Feather name="check" size={30} color="#fff" />
            </View>
            <Text className="mt-[14px]" style={{ fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text }}>
              All settled
            </Text>
            <Text className="mt-[4px]" style={{ fontFamily: FONT, fontSize: T.small, color: C.green, fontVariant: ['tabular-nums'] }}>
              {money(collected)} collected
            </Text>
          </Animated.View>
        ) : (
          <View className="mt-[26px] items-center">
            <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: '#AAAAAA' }}>
              You&apos;re owed
            </Text>
            <View className="mt-[4px] flex-row items-baseline gap-[8px]">
              <RollingNumber value={left} fontSize={34} color={C.text} />
              <Text style={{ fontFamily: FONT, fontSize: 15, color: C.textFaint, fontVariant: ['tabular-nums'] }}>of {money(owed)}</Text>
            </View>

            <View className="mt-[14px] self-stretch">
              <ProgressBar progress={progress} color={C.green} />
            </View>
            <Text className="mt-[8px]" style={{ fontFamily: FONT, fontSize: T.small, color: C.green, fontVariant: ['tabular-nums'] }}>
              {money(collected)} collected
            </Text>
          </View>
        )}

        {/* Person rows */}
        <View className="mt-[32px] gap-[12px]">
          {sorted.map((p, i) => (
            <PersonRow
              key={p.id}
              index={i}
              person={p}
              people={people}
              amount={shareOf(p.id)}
              status={statusOf(p.id)}
              onRequest={() => request(p)}
              onRemind={() => remind(p)}
              onMarkPaid={() => markPaid(p)}
              onUnmarkPaid={() => unmarkPaid(p)}
            />
          ))}

          {host && (
            <View className="flex-row items-center gap-[12px] opacity-50">
              <Avatar person={host} people={people} size={40} />
              <View className="flex-1 gap-[4px]">
                <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 20, letterSpacing: -0.48, color: C.text }}>You</Text>
                <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 22, letterSpacing: -0.48, color: '#AAAAAA', fontVariant: ['tabular-nums'] }}>
                  Your share · {money(shareOf(host.id))}
                </Text>
              </View>
              <Text style={{ fontFamily: FONT, fontSize: T.label, color: '#AAAAAA' }}>Settled</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-[20px] pb-[8px] pt-[12px]">
        <PrimaryCTA
          label={allDone ? 'Finish' : `Request from everyone${pendingCount ? ` (${pendingCount})` : ''}`}
          icon={allDone ? 'arrow-right' : 'send'}
          color={allDone ? C.green : C.accent}
          onPress={allDone ? () => router.push('/done') : requestAll}
        />
      </View>
    </SafeAreaView>
  );
}

function PersonRow({
  person,
  people,
  amount,
  status,
  index,
  onRequest,
  onRemind,
  onMarkPaid,
  onUnmarkPaid,
}: {
  person: Person;
  people: Person[];
  amount: number;
  status: SettleStatus;
  index: number;
  onRequest: () => void;
  onRemind: () => void;
  onMarkPaid: () => void;
  onUnmarkPaid: () => void;
}) {
  return (
    <Animated.View
      // Status changes re-sort the list (pending → requested → paid); the same
      // decisive 240ms travel as the people screen's gather, no float.
      layout={LinearTransition.duration(240).easing(Easing.bezier(0.77, 0, 0.175, 1))}
      entering={FadeInDown.duration(200).delay(Math.min(index, 8) * 30)}>
      <View className="flex-row items-center gap-[12px]">
        <Avatar person={person} people={people} size={40} />
        <View className="flex-1 gap-[4px]">
          <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 20, letterSpacing: -0.48, color: C.text }}>{person.name}</Text>
          <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 22, letterSpacing: -0.48, color: '#AAAAAA', fontVariant: ['tabular-nums'] }}>
            owes {money(amount)}
          </Text>
        </View>

        {status === 'paid' ? (
          // Tappable on purpose: a mis-tapped "paid" needs a way back
          <Pressable
            onPress={onUnmarkPaid}
            className="flex-row items-center gap-[6px] px-[14px] py-[10px] transition active:scale-[0.96] active:opacity-70"
            style={{ borderRadius: R.pill, backgroundColor: 'rgba(47,184,114,0.16)' }}>
            <Feather name="check-circle" size={16} color={C.green} />
            <Text style={{ fontFamily: FONT, fontSize: T.label, color: C.green }}>Paid</Text>
          </Pressable>
        ) : status === 'requested' ? (
          <View className="flex-row items-center gap-[8px]">
            <Pressable onPress={onRemind} className="px-[16px] py-[10px] transition active:scale-[0.96] active:opacity-80" style={{ borderRadius: R.pill, backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Text style={{ fontFamily: FONT, fontSize: T.label, color: C.text }}>Remind</Text>
            </Pressable>
            <Pressable
              onPress={onMarkPaid}
              hitSlop={8}
              className="h-[40px] w-[40px] items-center justify-center rounded-full transition active:scale-[0.95] active:opacity-70"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Feather name="check" size={18} color={C.green} />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center gap-[8px]">
            <Pressable onPress={onRequest} className="px-[18px] py-[10px] transition active:scale-[0.96] active:opacity-90" style={{ borderRadius: R.pill, backgroundColor: C.accent }}>
              <Text style={{ fontFamily: FONT, fontSize: T.label, color: '#fff' }}>Request</Text>
            </Pressable>
            {/* Mark cash paid — same check button as the requested state */}
            <Pressable
              onPress={onMarkPaid}
              hitSlop={8}
              className="h-[40px] w-[40px] items-center justify-center rounded-full transition active:scale-[0.95] active:opacity-70"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Feather name="check" size={18} color={C.green} />
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
