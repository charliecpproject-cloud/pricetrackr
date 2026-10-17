import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Viewer = { loggedIn: boolean; email: string | null };

// One login check per request, shared by the layout and the pages.
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { loggedIn: !!user, email: user?.email ?? null };
});