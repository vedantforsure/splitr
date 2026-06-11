import { MotiView } from 'moti';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Easing } from 'react-native-reanimated';

const EASE = Easing.bezier(0.23, 1, 0.32, 1); // fast start, soft landing
// Larger than any sheet, so the card starts fully below the screen edge.
const OFFSCREEN = 560;

// Shared chrome for every floating bottom card (entry sheet, confirms). The
// dim backdrop fades while the card rises from below the screen edge — the
// sheet emerges and retreats instead of blinking in and out. `children` gets
// a `close` function that plays the exit before unmounting; pass it a
// callback to run something (navigate, confirm) once the sheet is away.
export function SheetShell({
  onClose,
  avoidKeyboard = false,
  children,
}: {
  onClose: () => void;
  avoidKeyboard?: boolean;
  children: (close: (after?: () => void) => void) => ReactNode;
}) {
  const [closing, setClosing] = useState(false);
  const afterClose = useRef<(() => void) | undefined>(undefined);

  const close = (after?: () => void) => {
    if (closing) return;
    afterClose.current = after;
    setClosing(true);
  };

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => {
      onClose();
      afterClose.current?.();
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  const body = (
    <View className="flex-1">
      <MotiView
        pointerEvents="none"
        from={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ type: 'timing', duration: 200, easing: EASE }}
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
      />
      <Pressable className="flex-1 justify-end" onPress={() => close()}>
        <MotiView
          from={{ translateY: OFFSCREEN }}
          animate={{ translateY: closing ? OFFSCREEN : 0 }}
          transition={{ type: 'timing', duration: closing ? 220 : 300, easing: EASE }}>
          {/* Floating card — Figma 162:1340 */}
          <Pressable
            className="m-[20px] overflow-hidden p-[24px]"
            style={{ backgroundColor: '#222222', borderRadius: 36 }}
            onPress={(e) => e.stopPropagation()}>
            {children(close)}
          </Pressable>
        </MotiView>
      </Pressable>
    </View>
  );

  return (
    <Modal transparent animationType="none" onRequestClose={() => close()}>
      {avoidKeyboard ? (
        // Lifts the sheet above the keyboard — Modal content doesn't avoid it on its own
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </Modal>
  );
}
