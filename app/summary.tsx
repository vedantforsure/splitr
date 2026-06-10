import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ScreenHeader } from '@/components/screen-header';
import {
  grandTotal,
  HOST_ID,
  itemsSubtotal,
  lineTotal,
  money,
  roundedTotals,
  SettleStatus,
  useStore,
} from '@/lib/store';
import { C, FONT, R, T } from '@/lib/theme';

const STATUS_LABEL: Record<SettleStatus, string> = {
  none: 'Unpaid',
  requested: 'Requested',
  paid: 'Paid',
};

export default function SummaryScreen() {
  const state = useStore((s) => s);
  const { people, items, taxAmount, settle } = state;

  const subtotal = useMemo(() => itemsSubtotal(state), [state]);
  const total = useMemo(() => grandTotal(state), [state]);
  const rounded = useMemo(() => roundedTotals(state), [state]);

  const nameFor = (id: number) => people.find((p) => p.id === id)?.name ?? '?';
  const whoHad = (ids: number[]) => {
    if (ids.length === 0) return 'Unassigned';
    if (ids.length === people.length) return 'Everyone';
    const names = ids.map((id) => (id === HOST_ID ? 'You' : nameFor(id)));
    // Same truncation rule as the assign screen: two names verbatim, then "+N".
    if (names.length <= 2) return names.join(' & ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const sectionLabel = { fontFamily: FONT, fontSize: T.small, color: C.textFaint } as const;

  // The receipt people actually drop in the group chat.
  const shareSummary = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const itemLines = items.map(
      (it) => `${it.name}${it.qty > 1 ? ` ×${it.qty}` : ''} — ${money(lineTotal(it))}`,
    );
    const personLines = people.map((p) => {
      const isHost = p.id === HOST_ID;
      const status: SettleStatus = isHost ? 'paid' : settle[p.id] ?? 'none';
      return `${isHost ? 'You' : p.name}: ${money(rounded[p.id] ?? 0)} (${isHost ? 'paid the bill' : STATUS_LABEL[status]})`;
    });
    await Share.share({
      message: `Bill split — total ${money(total)}\n\n${itemLines.join('\n')}\n\nGST + service charge: ${money(taxAmount)}\n\nWho owes what:\n${personLines.join('\n')}`,
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <ScreenHeader
        title="Summary"
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={shareSummary}
            hitSlop={10}
            className="h-[44px] w-[44px] items-center justify-center transition active:scale-[0.95] active:opacity-70"
            style={{ borderRadius: R.pill, backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <Feather name="share" size={20} color={C.text} />
          </Pressable>
        }
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Who paid */}
        <View className="mt-[26px] flex-row items-center justify-center gap-[10px]">
          <Feather name="credit-card" size={18} color={C.green} />
          <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: '#AAAAAA' }}>
            You paid the bill of {money(total)}
          </Text>
        </View>

        {/* Items */}
        <Text className="mb-[12px] mt-[32px]" style={sectionLabel}>What was ordered</Text>
        <View className="gap-[12px]">
          {items.map((it) => (
            <View key={it.id} className="flex-row items-center justify-between">
              <View className="flex-1 gap-[4px] pr-[12px]">
                <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 20, letterSpacing: -0.48, color: C.text }}>
                  {it.name}
                  {it.qty > 1 && <Text style={{ color: '#AAAAAA' }}> ×{it.qty}</Text>}
                </Text>
                <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 22, letterSpacing: -0.48, color: it.assignedTo.length === 0 ? C.amber : '#AAAAAA' }}>
                  {whoHad(it.assignedTo)}
                </Text>
              </View>
              <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: C.text, fontVariant: ['tabular-nums'] }}>{money(lineTotal(it))}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View className="mt-[24px] gap-[8px]">
          <Row label="Subtotal" value={money(subtotal)} />
          <Row label="GST + service charge" value={money(taxAmount)} />
          <Row label="Total" value={money(total)} bold />
        </View>

        {/* Per person */}
        <Text className="mb-[12px] mt-[32px]" style={sectionLabel}>Who owes what</Text>
        <View className="gap-[12px]">
          {people.map((p) => {
            const isHost = p.id === HOST_ID;
            const status: SettleStatus = isHost ? 'paid' : settle[p.id] ?? 'none';
            return (
              <View key={p.id} className="flex-row items-center gap-[12px]">
                <Avatar person={p} people={people} size={40} />
                <View className="flex-1 gap-[4px]">
                  <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 20, letterSpacing: -0.48, color: C.text }}>{isHost ? 'You' : p.name}</Text>
                  <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 22, letterSpacing: -0.48, color: isHost ? '#AAAAAA' : status === 'paid' ? C.green : '#AAAAAA' }}>
                    {isHost ? 'Host · paid the bill' : STATUS_LABEL[status]}
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: C.text, fontVariant: ['tabular-nums'] }}>{money(rounded[p.id] ?? 0)}</Text>
              </View>
            );
          })}
        </View>

        <View className="h-[20px]" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: bold ? C.text : '#AAAAAA' }}>{label}</Text>
      <Text style={{ fontFamily: FONT, fontSize: bold ? 20 : 16, letterSpacing: bold ? -0.6 : -0.48, color: bold ? C.text : '#AAAAAA', fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}
