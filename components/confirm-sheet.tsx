import { Modal, Pressable, Text, View } from 'react-native';

import { C, FONT } from '@/lib/theme';

// In-language replacement for Alert.alert: same floating #222 card as the
// entry sheet, dim backdrop, two pill actions. Tapping outside cancels.
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable
          className="m-[20px] p-[24px]"
          style={{ backgroundColor: '#222222', borderRadius: 36 }}
          onPress={(e) => e.stopPropagation()}>
          <Text style={{ fontFamily: FONT, fontSize: 20, lineHeight: 24, letterSpacing: -0.6, color: C.text }}>
            {title}
          </Text>
          <Text
            className="mt-[8px]"
            style={{ fontFamily: FONT, fontSize: 16, lineHeight: 22, letterSpacing: -0.48, color: '#AAAAAA' }}>
            {message}
          </Text>

          <View className="mt-[20px] flex-row gap-[8px]">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center py-[16px] transition active:scale-[0.97] active:opacity-80"
              style={{ borderRadius: 999, backgroundColor: '#333333' }}>
              <Text style={{ fontFamily: FONT, fontSize: 17, letterSpacing: -0.51, color: C.text }}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="flex-1 items-center justify-center py-[16px] transition active:scale-[0.97] active:opacity-90"
              style={{ borderRadius: 999, backgroundColor: destructive ? C.danger : C.accent }}>
              <Text style={{ fontFamily: FONT, fontSize: 17, letterSpacing: -0.51, color: '#fff' }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
