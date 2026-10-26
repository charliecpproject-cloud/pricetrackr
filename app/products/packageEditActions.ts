"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadAllowedUnits } from "@/lib/prices/counterUnits";

type State = { error: string | null; message?: string | null };

const FAILED = "保存できませんでした。もう一度お試しください。";

// Admin only. The database function checks the role again.
export async function updatePackage(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const schema = z.object({
    package_id: z.string().uuid({ message: "容量が正しくありません" }),
    package_size: z.preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z
        .number({ message: "サイズは数値で入力してください。" })
        .gt(0, { message: "サイズは0より大きい数値で入力してください。" }),
    ),
    package_unit: z
      .string()
      .trim()
      .min(1, { message: "単位を選んでください" })
      .max(20, { message: "単位は20文字以内で入力してください。" }),
  });

  const parsed = schema.safeParse({
    package_id: formData.get("package_id"),
    package_size: formData.get("package_size"),
    package_unit: formData.get("package_unit"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createSupabaseServerClient();

  if (!(await loadAllowedUnits(supabase)).includes(parsed.data.package_unit)) {
    return { error: "単位を選んでください" };
  }

  const { data, error } = await supabase.rpc("update_package", {
    p_id: parsed.data.package_id,
    p_size: parsed.data.package_size,
    p_unit: parsed.data.package_unit,
  });
  if (error) {
    console.error("Package update error:", error.message, error.code);
    return { error: FAILED };
  }
  if (data === "not_admin") return { error: "この操作は管理者のみ行えます" };
  if (data === "not_found") return { error: "容量が見つかりませんでした" };
  if (data === "invalid") return { error: "サイズと単位を確認してください" };
  if (data === "duplicate") {
    return {
      error: "この商品に対して同じ容量がすでに登録されています。",
    };
  }
  if (data !== "ok") return { error: FAILED };

  revalidatePath("/products");
  revalidatePath("/prices/new");
  revalidatePath("/check", "layout");
  return { error: null, message: "保存しました" };
}
