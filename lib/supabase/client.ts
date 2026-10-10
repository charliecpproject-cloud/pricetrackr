import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Stores the session in cookies so the
// route guard (middleware) can see it. Keys come from environment variables.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);