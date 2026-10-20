// Package units: measures (ml, L, g, kg) and counter words (個, 枚, 袋, 本, 玉, パック, ...).
// A counter is stored under an old English key (count, sheet, bag) or as the word itself.
// The list of words offered in the dropdowns lives in the table counter_units (admin tool);
// display and unit price work for any counter word without a lookup.

export const MEASURE_UNITS = ["ml", "L", "g", "kg"] as const;
export const MAX_UNIT_LENGTH = 8;

const LEGACY_COUNTER_LABELS: Record<string, string> = {
  count: "個",
  sheet: "枚",
  bag: "袋",
};

/** A counter word as offered in a dropdown: unit = what is stored, label = what is shown. */
export type CounterUnitOption = { unit: string; label: string };

/** Offered when the table cannot be read: the three original counter words. */
export const DEFAULT_COUNTER_OPTIONS: CounterUnitOption[] = [
  { unit: "count", label: "個" },
  { unit: "sheet", label: "枚" },
  { unit: "bag", label: "袋" },
];

export function isMeasureUnit(unit: string): boolean {
  return (MEASURE_UNITS as readonly string[]).includes(unit);
}

/** A counter word: anything that is not a measure (and is a sensible length). */
export function isCounterUnit(unit: string): boolean {
  return unit.trim() !== "" && unit.length <= MAX_UNIT_LENGTH && !isMeasureUnit(unit);
}

/** The word shown for a counter unit: 個 for count, 枚 for sheet, 袋 for bag, else the word itself. */
export function counterLabel(unit: string): string {
  return Object.prototype.hasOwnProperty.call(LEGACY_COUNTER_LABELS, unit)
    ? LEGACY_COUNTER_LABELS[unit]
    : unit;
}

/** The unit dropdown: the measures first, then the counter words. */
export function unitDropdownOptions(
  counters: readonly CounterUnitOption[]
): { value: string; label: string }[] {
  return [
    ...MEASURE_UNITS.map((unit) => ({ value: unit as string, label: unit as string })),
    ...counters.map((c) => ({ value: c.unit, label: c.label })),
  ];
}