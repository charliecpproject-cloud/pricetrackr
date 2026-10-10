import { createClient } from '@supabase/supabase-js';

// Server‑side Supabase client for the Next.js App Router.
// Uses the same public anon key; authentication state is derived from the incoming request cookies.
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
