"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import {
  MAX_COUNTER_WORDS,
  parseNewCounterWord,
} from "@/lib/prices/counterWord";
import { MAX_UNIT_LENGTH } from "@/lib/prices/unitWords";

type State = { error: string | null; message?: string | null };

const NOT_ADMIN = "この操作は管理者のみ行えます";
const FAILED = "保存できませんでした。もう一度お試しください。";

function refresh() {
  revalidatePath("/admin/units");
  revalidatePath("/prices/new");
  revalidatePath("/products");
}

// The stored unit of a word (the word itself, or count / sheet / bag).
function unitFrom(formData: FormData): string | null {
  const value = formData.get("unit");
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_UNIT_LENGTH
    ? value
    : null;
}

export async function addCounterUnit(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };

  const parsed = parseNewCounterWord(String(formData.get("word") ?? ""));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("counter_units")
    .select("unit, label, sort_order");
  if (fetchError || !existing) {
    console.error(
      "Counter units fetch error:",
      fetchError?.message,
      fetchError?.code,
    );
    return { error: FAILED };
  }

  const rows = existing as {
    unit: string;
    label: string;
    sort_order: number;
  }[];
  if (rows.length >= MAX_COUNTER_WORDS) {
    return { error: `言葉は${MAX_COUNTER_WORDS}個までです` };
  }
  const lower = parsed.word.toLowerCase();
  if (
    rows.some(
      (r) => r.unit.toLowerCase() === lower || r.label.toLowerCase() === lower,
    )
  ) {
    return { error: "この言葉はすでに登録されています" };
  }

  const nextOrder = rows.reduce((max, r) => Math.max(max, r.sort_order), 0) + 1;
  const { error } = await supabase
    .from("counter_units")
    .insert({ unit: parsed.word, label: parsed.word, sort_order: nextOrder });
  if (error) {
    console.error("Counter unit insert error:", error.message, error.code);
    if (error.code === "42501") return { error: NOT_ADMIN };
    if (error.code === "23505")
      return { error: "この言葉はすでに登録されています" };
    return { error: FAILED };
  }

  refresh();
  return { error: null, message: `「${parsed.word}」を追加しました` };
}

export async function setCounterUnitEnabled(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };
  const unit = unitFrom(formData);
  if (!unit) return { error: "言葉が正しくありません" };
  if (unit === "count") return { error: "「個」は非表示にできません" };
  const enabled = formData.get("enabled") === "on";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("counter_units")
    .update({ enabled })
    .eq("unit", unit)
    .select("unit");
  if (error || !data || data.length === 0) {
    console.error("Counter unit update error:", error?.message, error?.code);
    return { error: FAILED };
  }

  refresh();
  return {
    error: null,
    message: enabled
      ? "単位の選択肢に表示します"
      : "単位の選択肢から外しました",
  };
}

export async function deleteCounterUnit(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };
  const unit = unitFrom(formData);
  if (!unit) return { error: "言葉が正しくありません" };

  // The database function refuses 個 and words that are used by a 容量.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("delete_counter_unit", {
    p_unit: unit,
  });
  if (error) {
    console.error("Counter unit delete error:", error.message, error.code);
    return { error: "削除できませんでした。もう一度お試しください。" };
  }

  switch (String(data)) {
    case "ok":
      refresh();
      return { error: null, message: "削除しました" };
    case "not_admin":
      return { error: NOT_ADMIN };
    case "protected":
      return { error: "「個」は削除できません" };
    case "in_use":
      return {
        error:
          "容量で使われているため削除できません。非表示にすると、新しい容量では選べなくなります",
      };
    case "not_found":
      return { error: "言葉が見つかりません" };
    default:
      return { error: "削除できませんでした。もう一度お試しください。" };
  }
}
