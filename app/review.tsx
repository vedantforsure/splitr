import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Easing } from 'react-native-reanimated';

import { AssignChips } from '@/components/assign-chips';
import { AvatarStack } from '@/components/avatar';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { EntrySheet, SheetState } from '@/components/entry-sheet';
import { PrimaryCTA } from '@/components/primary-cta';
import { ProgressBar } from '@/components/progress-bar';
import { ScreenHeader } from '@/components/screen-header';
import { Toggle } from '@/components/toggle';
import {
  actions,
  assignedCount,
  grandTotal,
  Item,
  lineTotal,
  money,
  Person,
  unassignedAmount,
  useStore,
} from '@/lib/store';
import { C, FONT, R, T } from '@/lib/theme';

export default function ReviewScreen() {
  const state = useStore((s) => s);
  const { people, items, splitEvenly, taxAmount, taxMode } = state;

  const [expanded, setExpanded] = useState<number | null>(null);
  const [taxOpen, setTaxOpen] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [confirmUnsplit, setConfirmUnsplit] = useState(false);

  const total = useMemo(() => grandTotal(state), [state]);
  const unassigned = useMemo(() => unassignedAmount(state), [state]);
  const assigned = assignedCount(state);

  const subLine = (item: Item) => {
    if (item.assignedTo.length === 0) return { text: '' };
    if (item.assignedTo.length === people.length) return { text: 'Shared by everyone' };
    const names = item.assignedTo
      .map((id) => people.find((p) => p.id === id)?.name)
      .filter(Boolean) as string[];
    // Same truncation rule as the summary: two names verbatim, then "+N".
    if (names.length <= 2) return { text: names.join(' & ') };
    return { text: `${names.slice(0, 2).join(', ')} +${names.length - 2}` };
  };

  const onToggleRow = (id: number) => {
    if (splitEvenly) return;
    Haptics.selectionAsync();
    setExpanded((cur) => (cur === id ? null : id));
  };

  const onLongPressRow = (item: Item) => {
    if (splitEvenly) return; // rows are inactive while split-evenly is on
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheet({ kind: 'editItem', item });
  };

  const onContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (unassigned > 0) {
      setConfirmUnsplit(true);
      return;
    }
    router.push('/settle');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.bg }}>
      <ScreenHeader
        title="Review the split"
        subtitle="Tap an item to fix who had it"
        onBack={() => router.back()}
        below={
          <View className="mt-[14px] flex-row items-center gap-[10px]">
            <View className="flex-1">
              <ProgressBar progress={items.length ? assigned / items.length : 0} />
            </View>
            <Text style={{ fontFamily: FONT, fontSize: T.small, color: '#AAAAAA', fontVariant: ['tabular-nums'] }}>
              {assigned} of {items.length} assigned
            </Text>
          </View>
        }
      />

      {/* Item list */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 12 }}
        showsVerticalScrollIndicator={false}>
        {items.map((item, i) => {
          const sub = subLine(item);
          const isOpen = expanded === item.id && !splitEvenly;
          const assignees = item.assignedTo
            .map((id) => people.find((p) => p.id === id))
            .filter(Boolean) as Person[];

          return (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: splitEvenly ? 0.45 : 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 200, delay: Math.min(i, 8) * 30, easing: Easing.bezier(0.23, 1, 0.32, 1) }}>
              <Pressable
                onPress={() => onToggleRow(item.id)}
                onLongPress={() => onLongPressRow(item)}
                className="flex-row items-start gap-[12px] py-[8px] transition active:scale-[0.98] active:opacity-70">
                <View className="flex-1 items-start gap-[6px]">
                  <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 20, letterSpacing: -0.48, color: C.text }}>
                    {item.name}
                    {item.qty > 1 && (
                      <Text style={{ color: '#AAAAAA' }}> ×{item.qty}</Text>
                    )}
                  </Text>
                  {/* Collapsed: avatar stack of assignees. Expanded: names only. Unassigned: nothing.
                      Split-evenly state is carried by the row dimming alone. */}
                  {splitEvenly || assignees.length === 0 ? null : !isOpen ? (
                    <AvatarStack people={assignees} all={people} size={24} borderColor={C.bg} />
                  ) : (
                    <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 22, letterSpacing: -0.48, color: '#AAAAAA' }}>
                      {sub.text}
                    </Text>
                  )}
                </View>

                <View className="items-end gap-[4px]">
                  {/* Unassigned items keep a dim price until someone owns them */}
                  <Text
                    style={{ fontFamily: FONT, fontSize: 16, lineHeight: 20, letterSpacing: -0.48, color: !splitEvenly && assignees.length === 0 ? C.textDim : C.text, minWidth: 56, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
                    {money(lineTotal(item))}
                  </Text>
                  {!splitEvenly && assignees.length > 1 && (
                    <Text
                      style={{ fontFamily: FONT, fontSize: T.small, color: '#AAAAAA', fontVariant: ['tabular-nums'] }}>
                      {money(lineTotal(item) / assignees.length)} each
                    </Text>
                  )}
                </View>
              </Pressable>

              {isOpen && (
                <MotiView
                  from={{ opacity: 0, translateY: -6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 140, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
                  className="gap-[12px] pt-[12px]">
                  {/* Quantity stepper */}
                  <View className="flex-row items-center justify-between">
                    <Text style={{ fontFamily: FONT, fontSize: T.label, color: '#AAAAAA' }}>Quantity</Text>
                    <View className="flex-row items-center gap-[16px]">
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          actions.setQty(item.id, item.qty - 1);
                        }}
                        disabled={item.qty <= 1}
                        hitSlop={6}
                        className="h-[28px] w-[28px] items-center justify-center rounded-full transition active:scale-[0.95] active:opacity-70"
                        style={{ backgroundColor: 'rgba(255,255,255,0.12)', opacity: item.qty <= 1 ? 0.4 : 1 }}>
                        <Feather name="minus" size={14} color={C.text} />
                      </Pressable>
                      <Text
                        style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: C.text, minWidth: 18, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                        {item.qty}
                      </Text>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          actions.setQty(item.id, item.qty + 1);
                        }}
                        hitSlop={6}
                        className="h-[28px] w-[28px] items-center justify-center rounded-full transition active:scale-[0.95] active:opacity-70"
                        style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                        <Feather name="plus" size={14} color={C.text} />
                      </Pressable>
                    </View>
                  </View>

                  <AssignChips item={item} people={people} onEdit={() => setSheet({ kind: 'editItem', item })} />
                </MotiView>
              )}
            </MotiView>
          );
        })}

        {/* Add missed item */}
        <Pressable
          onPress={() => setSheet({ kind: 'addItem' })}
          className="mt-[8px] flex-row items-center gap-[8px] self-center px-[20px] py-[10px] transition active:scale-[0.96] active:opacity-70"
          style={{ borderRadius: R.pill, backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <Feather name="plus" size={18} color={C.text} />
          <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: C.text }}>Add an item</Text>
        </Pressable>
      </ScrollView>

      {/* Footer: GST collapsible + CTA */}
      <View className="px-[20px] pb-[8px] pt-[12px]">
        <Pressable
          onPress={() => setTaxOpen((v) => !v)}
          className="flex-row items-center justify-between py-[6px] active:opacity-70">
          <View className="flex-row items-center gap-[8px]">
            <Feather name={taxOpen ? 'chevron-down' : 'chevron-right'} size={18} color={C.textDim} />
            <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: '#AAAAAA' }}>GST + service charge</Text>
          </View>
          <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: C.text, fontVariant: ['tabular-nums'] }}>{money(taxAmount)}</Text>
        </Pressable>

        {taxOpen && (
          <MotiView
            from={{ opacity: 0, translateY: -4 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 120, easing: Easing.bezier(0.23, 1, 0.32, 1) }}
            className="mb-[6px] mt-[4px]">
            <Text className="mb-[8px]" style={{ fontFamily: FONT, fontSize: T.tiny, color: C.textFaint }}>
              How should tax be shared?
            </Text>
            <View className="flex-row gap-[8px]">
              {(['proportional', 'equal'] as const).map((mode) => {
                const on = taxMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      Haptics.selectionAsync();
                      actions.setTaxMode(mode);
                    }}
                    className="flex-1 items-center py-[10px] transition active:scale-[0.97] active:opacity-80"
                    style={{ borderRadius: R.pill, backgroundColor: on ? C.accent : 'rgba(255,255,255,0.12)' }}>
                    <Text style={{ fontFamily: FONT, fontSize: T.label, color: on ? '#fff' : '#AAAAAA' }}>
                      {mode === 'proportional' ? 'By share' : 'Split equally'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </MotiView>
        )}

        {/* Avatar stack + add on the left, running total on the right */}
        <View className="mt-[12px] flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <AvatarStack people={people} all={people} size={32} borderColor={C.bg} />
            <Pressable
              onPress={() => setSheet({ kind: 'addPerson' })}
              className="h-[32px] w-[32px] items-center justify-center rounded-full transition active:scale-[0.95] active:opacity-70"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
              <Feather name="plus" size={16} color={C.text} />
            </Pressable>
          </View>
          <View className="items-end gap-[2px]">
            <Text style={{ fontFamily: FONT, fontSize: T.tiny, color: C.textDim }}>Total</Text>
            <Text
              style={{ fontFamily: FONT, fontSize: 24, letterSpacing: -0.72, color: C.text, fontVariant: ['tabular-nums'] }}>
              {money(total)}
            </Text>
          </View>
        </View>

        <View className="mt-[14px] flex-row items-center gap-[14px]">
          <View className="items-start gap-[5px]">
            <Text style={{ fontFamily: FONT, fontSize: T.tiny, color: C.textDim }}>Split evenly</Text>
            <Toggle value={splitEvenly} onChange={actions.setSplitEvenly} />
          </View>
          <View className="flex-1">
            <PrimaryCTA label="Review & collect" onPress={onContinue} />
          </View>
        </View>
      </View>

      <EntrySheet state={sheet} onClose={() => setSheet(null)} />
      <ConfirmSheet
        visible={confirmUnsplit}
        title={`Leave ${money(unassigned)} unsplit?`}
        message="Items left unassigned won’t be charged to anyone."
        cancelLabel="Keep assigning"
        confirmLabel="Continue"
        onClose={() => setConfirmUnsplit(false)}
        onConfirm={() => {
          setConfirmUnsplit(false);
          router.push('/settle');
        }}
      />
    </SafeAreaView>
  );
}
