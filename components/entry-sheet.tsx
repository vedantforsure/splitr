import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { actions, Item } from '@/lib/store';
import { C, FONT, R } from '@/lib/theme';

export type SheetState =
  | { kind: 'addPerson' }
  | { kind: 'addItem' }
  | { kind: 'editItem'; item: Item }
  | null;

// One bottom-sheet for every add/edit action — people and items alike — so the
// same verb always opens the same UI.
export function EntrySheet({ state, onClose }: { state: SheetState; onClose: () => void }) {
  if (!state) return null;
  return <EntrySheetInner state={state} onClose={onClose} />;
}

function EntrySheetInner({ state, onClose }: { state: NonNullable<SheetState>; onClose: () => void }) {
  const isItem = state.kind === 'addItem' || state.kind === 'editItem';
  const editing = state.kind === 'editItem' ? state.item : null;

  const [name, setName] = useState(editing?.name ?? '');
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [qty, setQty] = useState(editing?.qty ?? 1);

  const title =
    state.kind === 'addPerson' ? 'Add person' : state.kind === 'addItem' ? 'Add item' : 'Edit item';

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (state.kind === 'addPerson') {
      actions.addPerson(trimmed);
    } else {
      const p = Math.max(0, parseFloat(price) || 0);
      if (state.kind === 'addItem') actions.addItem(trimmed, p, qty);
      else actions.editItem(state.item.id, trimmed, p, qty);
    }
    onClose();
  };

  const remove = () => {
    if (state.kind !== 'editItem') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    actions.deleteItem(state.item.id);
    onClose();
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      {/* Lifts the sheet above the keyboard — Modal content doesn't avoid it on its own */}
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
          {/* Floating card — Figma 162:1340 */}
          <Pressable
            className="m-[20px] overflow-hidden p-[24px]"
            style={{ backgroundColor: '#222222', borderRadius: 36 }}
            onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between">
              <Text style={{ fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text }}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                className="h-[32px] w-[32px] items-center justify-center rounded-full transition active:scale-[0.92] active:opacity-70"
                style={{ backgroundColor: '#333333' }}>
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Path
                    d="M5 5L15 15M15 5L5 15"
                    stroke={C.textDim}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>
            </View>

            <View className="mt-[20px] h-[1px] w-full" style={{ backgroundColor: '#333333' }} />

            <View className="mt-[12px] gap-[8px]">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={C.textFaint}
                autoFocus
                onSubmitEditing={isItem ? undefined : save}
                returnKeyType={isItem ? 'next' : 'done'}
                className="w-full p-[16px]"
                style={{ backgroundColor: '#333333', borderRadius: R.md, fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text }}
              />

              {isItem && (
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Price"
                  placeholderTextColor={C.textFaint}
                  keyboardType="numeric"
                  className="w-full p-[16px]"
                  style={{ backgroundColor: '#333333', borderRadius: R.md, fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text }}
                />
              )}
            </View>

            {isItem && (
              <View className="mt-[16px] flex-row items-center justify-between">
                <Text style={{ fontFamily: FONT, fontSize: 16, letterSpacing: -0.48, color: '#AAAAAA' }}>
                  Quantity
                </Text>
                <View className="flex-row items-center gap-[16px]">
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setQty((q) => Math.max(1, q - 1));
                    }}
                    disabled={qty <= 1}
                    className="h-[32px] w-[32px] items-center justify-center rounded-full transition active:scale-[0.92] active:opacity-70"
                    style={{ backgroundColor: '#333333', opacity: qty <= 1 ? 0.4 : 1 }}>
                    <Feather name="minus" size={16} color={C.text} />
                  </Pressable>
                  <Text
                    style={{ fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text, minWidth: 20, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                    {qty}
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setQty((q) => q + 1);
                    }}
                    className="h-[32px] w-[32px] items-center justify-center rounded-full transition active:scale-[0.92] active:opacity-70"
                    style={{ backgroundColor: '#333333' }}>
                    <Feather name="plus" size={16} color={C.text} />
                  </Pressable>
                </View>
              </View>
            )}

            <View className="mt-[20px] flex-row gap-[8px]">
              {state.kind === 'editItem' && (
                <Pressable
                  onPress={remove}
                  className="items-center justify-center px-[20px] py-[16px] transition active:scale-[0.97] active:opacity-80"
                  style={{ backgroundColor: '#333333', borderRadius: R.pill }}>
                  <Feather name="trash-2" size={20} color={C.danger} />
                </Pressable>
              )}
              <Pressable
                onPress={save}
                className="flex-1 items-center justify-center px-[20px] py-[16px] transition active:scale-[0.97] active:opacity-90"
                style={{ backgroundColor: C.accent, borderRadius: R.pill }}>
                <Text style={{ fontFamily: FONT, fontSize: 20, letterSpacing: -0.6, color: '#fff' }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
