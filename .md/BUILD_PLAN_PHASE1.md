# Build Plan — Phase 1

Ordered steps. Do them in order — each one assumes the previous is done and committed. One step = roughly one Aider session = one commit, per `CONVENTIONS.md`. Update `PROGRESS.md` after each step (move it to Done, note the commit).

Each session: feed `CONVENTIONS.md` + `PROGRESS.md` + `PART1_FOUNDATION.md`, tell Aider which step number to do, and paste that step's block below. Don't feed the whole plan every time — just the current step.

---

**Step 1 — Repo & environment bootstrap**
Next.js (App Router, TypeScript strict) via `pnpm create next-app`. Add Tailwind, shadcn/ui init, ESLint + Prettier. Create `.env.example` (no real values) and confirm `.env*` is in `.gitignore`. Push to GitHub, link Vercel project.
Done when: app builds and deploys to Vercel showing the default page.

**Step 2 — Supabase client setup**
Create Supabase project. Install `@supabase/ssr`. Add server-client and browser-client helper files. Store `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` as env vars — service-role key server-side only, never shipped to the browser.
Done when: a test server component can successfully query Supabase (even against an empty DB).

**Step 3 — Auth (owner-only)**
Supabase Auth, single account (email/password is simplest). Add middleware to protect all app routes except the login page.
Done when: unauthenticated visits redirect to login; authenticated session persists across reloads.

**Step 4 — Schema migration**
Turn `DB_SCHEMA_PHASE1.md` into a Supabase CLI migration: `store_chains`, `shops`, `products`, `product_packages`, `price_observations`. Commit the migration file to Git — no dashboard-only schema edits.
Done when: `supabase db push` (or equivalent) applies cleanly to a fresh project.

**Step 5 — RLS policies**
Enable RLS on all five tables. Add policies per the "RLS policy shape" section of `DB_SCHEMA_PHASE1.md`. Explicitly test: an unauthenticated request is rejected.
Done when: RLS is on for every table and you've manually verified at least one denied unauthenticated query.

**Step 6 — Seed data**
Small seed script or one-off inserts: 1–2 store chains, 2–3 shops, a handful of products/packages, a few price observations. Real or placeholder data — just enough to build UI against.
Done when: seed data is visible via a Supabase dashboard query.

**Step 7 — Store & shop management**
Minimal admin pages: list + add store chains, list + add shops (with chain picker). No edit/delete needed yet.
Done when: you can add a new shop through the UI and see it persist.

**Step 8 — Product & package management**
Minimal admin pages: list + add products (name_ja, name_en, brand, category), list + add packages under a product (size + unit).
Done when: you can add a new product and a package for it through the UI.

**Step 9 — Manual price-entry form**
The core "Input price" screen: pick product+package (autocomplete/search against existing ones), pick store+shop, enter price, date (default now), sale flag. Writes to `price_observations` with `source='manual'`, `status='active'`.
Done when: submitting the form creates a new row visible in the DB.

**Step 10 — Form validation & tests**
Zod schema for the entry form, react-hook-form wiring, input sanitization. Unit tests for price parsing (per `CONVENTIONS.md`).
Done when: invalid input (negative price, missing required field) is rejected client- and server-side, and tests pass.

**Step 11 — "Check price" lookup page**
Search/select a product+package, show its latest price.
Done when: searching a seeded product returns its most recent price.

**Step 12 — Recent observations list**
On the product page, show a plain list of recent observations (date, price, store) — no chart yet, no freshness/trust scoring yet.
Done when: a product with multiple observations shows them in reverse-chronological order.

**Step 13 — Home page**
Two sections per the original app idea: "Input price" and "Check price", linking to Steps 9 and 11's pages.
Done when: home page renders both sections and links work.

**Step 14 — Mobile & styling pass**
Apply shadcn/ui components consistently, mobile-first layout, loading/empty/error states on all pages built so far.
Done when: every page built so far has a sane loading state, empty state, and error state, and is usable on a phone-width viewport.

**Step 15 — Deploy & smoke test**
Set env vars in Vercel, verify production build against the real Supabase project, confirm RLS behaves the same in production as local.
Done when: you can use the whole Phase 1 flow (add product → add price → look it up) on the live Vercel URL.

**Step 16 — Phase close-out**
Re-read `PART1_FOUNDATION.md`'s IN/OUT list. Confirm nothing from OUT crept in during the build. Update `PROGRESS.md`'s Current Phase to "Phase 1 complete" and add a dated Decisions Log entry for anything that changed from this plan during actual building.
Done when: `PROGRESS.md` accurately reflects reality and nothing in OUT scope exists in the codebase.

---

If a step turns out to need splitting further once you're actually in it (e.g. Step 9 feels too big for one session), that's fine — split it and renumber locally, just keep `PROGRESS.md` honest about where you actually are.
