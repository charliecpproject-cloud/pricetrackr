# PART 1 — Foundation

## Building now
Private, single-user price tracker for Japan (JPY), bilingual JA/EN product data. Manual entry + price lookup with history. No AI, no other users yet.

## Phase 1 — IN
- Next.js on Vercel + Supabase (Auth/DB/Storage), owner-only account.
- Tables: products, product_packages, store_chains, shops, price_observations.
- Manual entry form: product name (JA+EN), brand, category, package size/unit, price, store chain + shop, date (default now), sale flag.
- Product page: latest price + plain list of recent observations. No chart, no freshness score yet.
- RLS on every table.

## Phase 1 — OUT
AI/photo extraction, freshness/trust scoring, unit-price math, translation-approval workflow, internet auto-research, multi-user, shopping list, favorites, alerts, gamification, community/regional features. See PART2/PART3 when relevant — don't build ahead of scope.

## Schema principles (don't flatten these)
- Product ≠ package: `products(id, name_ja, name_en, brand, category)` vs `product_packages(id, product_id, package_size, package_unit)`.
- Store chain ≠ shop: `store_chains(id, name)` vs `shops(id, store_chain_id, name, address, region)`.
- Price = observation, not attribute: `price_observations(id, product_package_id, shop_id, price, currency, observed_at, is_sale, source, status, created_at)`. Insert-only, never overwrite. Include `source` (='manual') and `status` (='active') now even with one value each — this is what lets AI/community sources slot in later without a migration touching every row.
- Current price = latest observation by date, always derived, never stored on the product.

## Security
Per CONVENTIONS.md: RLS everywhere, secrets in env vars only, parameterized queries only, validate the entry form's input. No exceptions for single-user.

## Free-tier ceilings (verify current numbers before relying on them)
- Supabase Free: ~500MB DB, 1GB storage, 50k MAU, ~5GB egress; pauses after 1 week inactive.
- Vercel Hobby: personal/non-commercial use only.
- GitHub Free: unlimited repos, 2,000 Actions min/month.

## Tech stack (locked)
Next.js 16 (App Router), React 19, Tailwind 4, TypeScript strict, npm (not pnpm), Vercel Hobby. Use current-version syntax, not older Next/Tailwind patterns. Supabase via `@supabase/ssr` only: `createBrowserClient` in the browser (stores session in cookies), `createServerClient` on the server/middleware. Never `createClient` from `@supabase/supabase-js` for app code. Server auth checks use `getUser()`, not `getSession()`. Before importing from a helper file, read its actual exports; don't guess names. CLI migrations committed to Git, no dashboard schema edits. Tailwind + shadcn/ui, lucide-react. react-hook-form + Zod. Vitest for unit tests. ESLint + Prettier. Bilingual data = plain `name_ja`/`name_en` columns (not a localization table yet). UI-chrome localization deferred.
