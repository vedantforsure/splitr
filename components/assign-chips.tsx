import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Pressable, Text, View } from 'react-native';
import { Easing } from 'react-native-reanimated';

import { actions, colorForPerson, HOST_ID, initialFor, Item, Person } from '@/lib/store';
import { C, FONT, R, T } from '@/lib/theme';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);
// On/off fills cross-fade instead of snapping — same beat as the people toggle.
const FILL = { type: 'timing', duration: 140, easing: EASE } as const;

// The "who had this" pill row: Everyone, one pill per person, optional Edit.
// Shared between the swipe deck card and the review screen's expanded rows.
export function AssignChips({
  item,
  people,
  onEdit,
}: {
  item: Item;
  people: Person[];
  onEdit?: () => void;
}) {
  const onToggleAssign = (personId: number) => {
    Haptics.selectionAsync();
    actions.toggleAssign(item.id, personId);
  };

  const onEveryone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    actions.assignEveryone(item.id);
  };

  const everyoneOn = item.assignedTo.length === people.length;

  return (
    <View className="flex-row flex-wrap gap-[8px]">
      <Pressable
        onPress={onEveryone}
        hitSlop={4}
        className="transition active:scale-[0.96] active:opacity-80">
        <MotiView
          animate={{ backgroundColor: everyoneOn ? C.accent : 'rgba(255,255,255,0.12)' }}
          transition={FILL}
          className="flex-row items-center gap-[6px] px-[14px] py-[8px]"
          style={{ borderRadius: R.pill }}>
          <Feather name="users" size={14} color="#fff" />
          <Text style={{ fontFamily: FONT, fontSize: T.label, color: '#fff' }}>Everyone</Text>
        </MotiView>
      </Pressable>

      {people.map((p) => {
        const on = item.assignedTo.includes(p.id);
        return (
          <Pressable
            key={p.id}
            onPress={() => onToggleAssign(p.id)}
            hitSlop={4}
            className="transition active:scale-[0.96] active:opacity-80">
            <MotiView
              animate={{ backgroundColor: on ? colorForPerson(p, people) : 'rgba(255,255,255,0.12)' }}
              transition={FILL}
              className="flex-row items-center gap-[7px] py-[7px] pl-[7px] pr-[12px]"
              style={{ borderRadius: R.pill }}>
              <View
                className="h-[22px] w-[22px] items-center justify-center rounded-full"
                style={{ backgroundColor: on ? 'rgba(0,0,0,0.22)' : colorForPerson(p, people) }}>
                {on ? (
                  <Feather name="check" size={14} color="#fff" />
                ) : (
                  <Text style={{ fontFamily: FONT, fontSize: 11, color: '#fff' }}>
                    {initialFor(p.name)}
                  </Text>
                )}
              </View>
              <Text style={{ fontFamily: FONT, fontSize: T.label, color: '#fff' }}>
                {p.id === HOST_ID ? 'You' : p.name}
              </Text>
            </MotiView>
          </Pressable>
        );
      })}

      {onEdit && (
        <Pressable
          onPress={onEdit}
          hitSlop={4}
          className="flex-row items-center gap-[6px] px-[14px] py-[8px] transition active:scale-[0.96] active:opacity-80"
          style={{ borderRadius: R.pill, backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <Feather name="edit-2" size={13} color={C.text} />
          <Text style={{ fontFamily: FONT, fontSize: T.label, color: '#fff' }}>Edit</Text>
        </Pressable>
      )}
    </View>
  );
}
