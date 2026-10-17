import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTheme, type ThemeId } from "@/lib/themes/themes";

export type Viewer = { loggedIn: boolean; email: string | null; theme: ThemeId };

// One login check (and theme lookup) per request, shared by the layout and pages.
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { loggedIn: false, email: null, theme: parseTheme(null) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("theme")
    .eq("id", user.id)
    .maybeSingle();

  return {
    loggedIn: true,
    email: user.email ?? null,
    theme: parseTheme(profile?.theme),
  };
});