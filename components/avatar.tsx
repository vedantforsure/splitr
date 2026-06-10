import { Text, View } from 'react-native';

import { colorForPerson, initialFor, Person } from '@/lib/store';
import { FONT } from '@/lib/theme';

// One avatar, used everywhere. Size drives the font so initials stay centered.
export function Avatar({
  person,
  people,
  size = 40,
}: {
  person: Person;
  people: Person[];
  size?: number;
}) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: colorForPerson(person, people) }}>
      <Text className="text-white" style={{ fontFamily: FONT, fontSize: Math.round(size * 0.42) }}>
        {initialFor(person.name)}
      </Text>
    </View>
  );
}

// A right-creeping overlap stack of avatars, with a border to punch them apart.
// Overflow is honest: past `max`, the last slot becomes a "+N" tail.
export function AvatarStack({
  people,
  all,
  size = 24,
  max = 4,
  borderColor = '#0A0A0A',
}: {
  people: Person[];
  all: Person[];
  size?: number;
  max?: number;
  borderColor?: string;
}) {
  const overflowing = people.length > max;
  const shown = overflowing ? people.slice(0, max - 1) : people;
  const hidden = people.length - shown.length;
  const overlap = (i: number) => (i === 0 ? 0 : -Math.round(size * 0.4));

  return (
    <View className="flex-row">
      {shown.map((p, i) => (
        <View
          key={p.id}
          style={{
            marginLeft: overlap(i),
            zIndex: 10 - i,
            borderRadius: size,
            borderWidth: 2,
            borderColor,
          }}>
          <Avatar person={p} people={all} size={size} />
        </View>
      ))}
      {overflowing && (
        <View
          className="items-center justify-center"
          style={{
            marginLeft: overlap(shown.length),
            zIndex: 10 - shown.length,
            width: size + 4,
            height: size + 4,
            borderRadius: size,
            borderWidth: 2,
            borderColor,
            backgroundColor: 'rgba(255,255,255,0.16)',
          }}>
          <Text className="text-white" style={{ fontFamily: FONT, fontSize: Math.round(size * 0.38) }}>
            +{hidden}
          </Text>
        </View>
      )}
    </View>
  );
}
