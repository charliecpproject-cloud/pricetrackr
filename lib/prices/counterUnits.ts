import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_COUNTER_OPTIONS,
  MEASURE_UNITS,
  type CounterUnitOption,
} from "./unitWords";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** The counter words offered for new packages: the enabled words, in the admin's order. */
export async function loadCounterUnits(
  supabase: Supabase,
): Promise<CounterUnitOption[]> {
  const { data, error } = await supabase
    .from("counter_units")
    .select("unit, label")
    .eq("enabled", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) {
    console.error("Counter units fetch error:", error?.message, error?.code);
    return DEFAULT_COUNTER_OPTIONS;
  }
  const options = (data as { unit: string; label: string }[]).map((row) => ({
    unit: row.unit,
    label: row.label,
  }));
  return options.length > 0 ? options : DEFAULT_COUNTER_OPTIONS;
}

/** Every unit accepted for a new package: the measures plus the enabled counter words. */
export async function loadAllowedUnits(supabase: Supabase): Promise<string[]> {
  const counters = await loadCounterUnits(supabase);
  return [...MEASURE_UNITS, ...counters.map((c) => c.unit)];
}
