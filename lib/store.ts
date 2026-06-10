import { useSyncExternalStore } from 'react';

import { AVATAR_COLORS, C } from './theme';

export const ACCENT = C.accent;
export { AVATAR_COLORS };

// Name-stable palette pick so a person keeps their color across screens — and
// before they're even added to the crew (e.g. the contact list on screen 2).
export const colorForName = (name: string) => {
  let hash = 0;
  for (const ch of name.toLowerCase().trim()) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const colorForPerson = (person: Person, _people: Person[]) => {
  if (person.id === HOST_ID) return ACCENT;
  return colorForName(person.name);
};

export const initialFor = (name: string) => (name.trim()[0] || '?').toUpperCase();

export const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export const HOST_ID = 0;

export type Person = { id: number; name: string };
// `price` is per unit; a row's line total is price × qty.
export type Item = { id: number; name: string; price: number; qty: number; assignedTo: number[] };
export type SettleStatus = 'none' | 'requested' | 'paid';
export type TaxMode = 'proportional' | 'equal';

export type State = {
  people: Person[];
  items: Item[];
  splitEvenly: boolean;
  taxAmount: number;
  taxMode: TaxMode;
  settle: Record<number, SettleStatus>;
};

// Seeded demo so any screen is demoable standalone (stands in for an OCR'd receipt).
const makeInitialState = (): State => ({
  people: [
    { id: HOST_ID, name: 'You' },
    { id: 1, name: 'Aarav' },
    { id: 2, name: 'Priya' },
    { id: 3, name: 'Rohan' },
  ],
  items: [
    { id: 1, name: 'Paneer Tikka', price: 320, qty: 1, assignedTo: [] },
    { id: 2, name: 'Butter Naan', price: 60, qty: 4, assignedTo: [] },
    { id: 3, name: 'Dal Makhani', price: 280, qty: 1, assignedTo: [] },
    { id: 4, name: 'Veg Biryani', price: 360, qty: 1, assignedTo: [] },
    { id: 5, name: 'Gulab Jamun', price: 160, qty: 1, assignedTo: [] },
    { id: 6, name: 'Masala Soda', price: 60, qty: 3, assignedTo: [] },
  ],
  splitEvenly: false,
  taxAmount: 231,
  taxMode: 'proportional',
  settle: {},
});

let state: State = makeInitialState();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

let nextPersonId = 100;
let nextItemId = 100;

export const actions = {
  setPeople(names: { id: number; name: string }[]) {
    set({ people: names.map((n) => ({ id: n.id, name: n.name })) });
  },
  addPerson(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    set({ people: [...state.people, { id: nextPersonId++, name: trimmed }] });
  },
  renamePerson(personId: number, name: string) {
    set({ people: state.people.map((p) => (p.id === personId ? { ...p, name } : p)) });
  },
  // The host can opt out of the split (e.g. someone treats the table). Toggling
  // back in re-inserts "You" at the top of the crew.
  toggleHost() {
    const inCrew = state.people.some((p) => p.id === HOST_ID);
    if (inCrew) {
      set({
        people: state.people.filter((p) => p.id !== HOST_ID),
        items: state.items.map((it) => ({
          ...it,
          assignedTo: it.assignedTo.filter((id) => id !== HOST_ID),
        })),
      });
    } else {
      set({ people: [{ id: HOST_ID, name: 'You' }, ...state.people] });
    }
  },
  removePerson(personId: number) {
    if (personId === HOST_ID) return;
    set({
      people: state.people.filter((p) => p.id !== personId),
      items: state.items.map((it) => ({
        ...it,
        assignedTo: it.assignedTo.filter((id) => id !== personId),
      })),
    });
  },
  toggleAssign(itemId: number, personId: number) {
    set({
      items: state.items.map((it) => {
        if (it.id !== itemId) return it;
        const on = it.assignedTo.includes(personId);
        return {
          ...it,
          assignedTo: on
            ? it.assignedTo.filter((p) => p !== personId)
            : [...it.assignedTo, personId],
        };
      }),
    });
  },
  assignEveryone(itemId: number) {
    const all = state.people.map((p) => p.id);
    set({
      items: state.items.map((it) => {
        if (it.id !== itemId) return it;
        const isAll = it.assignedTo.length === all.length;
        return { ...it, assignedTo: isAll ? [] : all };
      }),
    });
  },
  editItem(itemId: number, name: string, price: number, qty?: number) {
    set({
      items: state.items.map((it) =>
        it.id === itemId ? { ...it, name, price, qty: Math.max(1, Math.round(qty ?? it.qty)) } : it,
      ),
    });
  },
  addItem(name: string, price: number, qty = 1) {
    set({
      items: [
        ...state.items,
        { id: nextItemId++, name, price, qty: Math.max(1, Math.round(qty)), assignedTo: [] },
      ],
    });
  },
  setQty(itemId: number, qty: number) {
    set({
      items: state.items.map((it) =>
        it.id === itemId ? { ...it, qty: Math.max(1, Math.round(qty)) } : it,
      ),
    });
  },
  deleteItem(itemId: number) {
    set({ items: state.items.filter((it) => it.id !== itemId) });
  },
  setSplitEvenly(value: boolean) {
    set({ splitEvenly: value });
  },
  setTaxMode(mode: TaxMode) {
    set({ taxMode: mode });
  },
  setSettleStatus(personId: number, status: SettleStatus) {
    set({ settle: { ...state.settle, [personId]: status } });
  },
  reset() {
    set(makeInitialState());
  },
  // Entering the flow from a fresh scan: keep the (seeded) receipt items but
  // start the crew at host-only and clear any prior assignments / settle state.
  beginCrew() {
    set({
      people: [{ id: HOST_ID, name: 'You' }],
      items: state.items.map((it) => ({ ...it, assignedTo: [] })),
      settle: {},
      splitEvenly: false,
    });
  },
};

// ---- Derived computations (pure; call inside useMemo on selected state) ----

export const lineTotal = (it: Item) => it.price * it.qty;

export const itemsSubtotal = (s: State) => s.items.reduce((sum, it) => sum + lineTotal(it), 0);

export const assignedSubtotal = (s: State) =>
  s.items.reduce((sum, it) => sum + (it.assignedTo.length > 0 ? lineTotal(it) : 0), 0);

export const unassignedAmount = (s: State) =>
  s.items.reduce((sum, it) => sum + (it.assignedTo.length === 0 ? lineTotal(it) : 0), 0);

export const grandTotal = (s: State) => itemsSubtotal(s) + s.taxAmount;

export const assignedCount = (s: State) =>
  s.items.filter((it) => it.assignedTo.length > 0).length;

// Sum of a person's item portions (price split equally among assignees).
export const personSubtotal = (s: State, personId: number) =>
  s.items.reduce((sum, it) => {
    if (!it.assignedTo.includes(personId)) return sum;
    return sum + lineTotal(it) / it.assignedTo.length;
  }, 0);

export const personTax = (s: State, personId: number) => {
  if (s.taxMode === 'equal') return s.taxAmount / Math.max(1, s.people.length);
  const base = assignedSubtotal(s);
  if (base <= 0) return 0;
  return (personSubtotal(s, personId) / base) * s.taxAmount;
};

export const personTotal = (s: State, personId: number) => {
  if (s.splitEvenly) return grandTotal(s) / Math.max(1, s.people.length);
  return personSubtotal(s, personId) + personTax(s, personId);
};

// Whole-rupee shares that always sum back to the rounded total-of-shares, using
// the largest-remainder method (the leftover rupee goes to the largest
// fractional parts). Display uses these so the math reconciles to the paisa.
export const roundedTotals = (s: State): Record<number, number> => {
  const ids = s.people.map((p) => p.id);
  const exact = ids.map((id) => personTotal(s, id));
  const target = Math.round(exact.reduce((a, b) => a + b, 0));
  const floors = exact.map(Math.floor);
  let diff = target - floors.reduce((a, b) => a + b, 0);

  const byFrac = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const result = floors.slice();
  for (let k = 0; diff > 0 && k < byFrac.length; k++, diff--) result[byFrac[k].i] += 1;
  for (let k = byFrac.length - 1; diff < 0 && k >= 0; k--, diff++)
    result[byFrac[k].i] = Math.max(0, result[byFrac[k].i] - 1);

  const out: Record<number, number> = {};
  ids.forEach((id, i) => (out[id] = result[i]));
  return out;
};
