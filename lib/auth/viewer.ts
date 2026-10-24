import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTheme, type ThemeId } from "@/lib/themes/themes";

export type Viewer = {
  loggedIn: boolean;
  email: string | null;
  theme: ThemeId;
  isAdmin: boolean;
  displayName: string | null;
};

// One login check (and profile lookup) per request, shared by the layout and pages.
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const user = claims
    ? { id: claims.sub as string, email: (claims.email as string | undefined) ?? null }
    : null;

  if (!user) {
    return {
      loggedIn: false,
      email: null,
      theme: parseTheme(null),
      isAdmin: false,
      displayName: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("theme, role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    loggedIn: true,
    email: user.email ?? null,
    theme: parseTheme(profile?.theme),
    isAdmin: profile?.role === "admin",
    displayName: (profile?.display_name as string | null) ?? null,
  };
});