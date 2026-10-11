"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function deletePriceObservation(
  formData: FormData,
): Promise<void> {
  const idRaw = formData.get("id");
  const packageIdRaw = formData.get("packageId");

  // Ensure both values are strings
  if (typeof idRaw !== "string" || typeof packageIdRaw !== "string") {
    return;
  }

  const uuidSchema = z.string().uuid();

  const idResult = uuidSchema.safeParse(idRaw);
  const packageIdResult = uuidSchema.safeParse(packageIdRaw);

  // If validation fails, exit silently
  if (!idResult.success || !packageIdResult.success) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("price_observations")
    .delete()
    .eq("id", idResult.data);

  if (error) {
    // Log error but do not throw
    console.error(error.message, (error as any).code);
  }

  // Revalidate the relevant pages
  revalidatePath("/check");
  revalidatePath(`/check/${packageIdResult.data}`);
}
