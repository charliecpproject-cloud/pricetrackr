import { createClient } from '@supabase/supabase-js';

// Browser‑side Supabase client.
// Keys are read from environment variables; no hard‑coded values.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
