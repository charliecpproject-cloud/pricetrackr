# Handoff for Claude: price tracker project

Read this first. It is a briefing for Claude in a new chat, not for Aider (keep it out of `.aider.conf.yml`). The source of truth for progress is `PROGRESS.md`; the rules for code are in `PART1_FOUNDATION.md` and `CONVENTIONS.md`.

## The person and the setup
- Solo developer, not a security/backend/infra expert: explain tradeoffs, ask before guessing about data-model changes.
- Windows + PowerShell. Replies must give exact commands, exact options, and what to expect.
- App: private price-intelligence app for Japan (JPY), Japanese-only UI, installed as a web app on Android. Single owner account, sign-ups disabled.
- Stack: Next.js 16 (App Router), React 19, Tailwind 4, TypeScript strict, npm, shadcn (installed: button, card, input, label, badge, textarea), Supabase (Postgres, Auth, RLS), Vercel Hobby, Vitest, zod v4 (errors are `error.issues`, never `error.errors`).
- Code is written with Aider using Groq free tier (`groq/openai/gpt-oss-120b`, about 8k tokens per minute). `.aider.conf.yml` loads CONVENTIONS.md and PART1_FOUNDATION.md read-only and PROGRESS.md editable; `map-tokens: 0`, `reasoning-effort: low`. Docs live in the `.md` folder.

## How we work
- Small jobs for Aider: one file per job (two at most), message sent inside Aider after `/code`, wait about a minute between jobs, answer `N` to "Add file" and "fix lint" prompts, `/exit`, then `npx tsc --noEmit`.
- Every step ends with the full commit commands (with the commit message), then the exact message asking Aider to update `PROGRESS.md`, then `git push`.
- ASK to see an existing file (give a `Get-Content` command) before editing it. Never predict or regenerate a file that has not been shown.
- Known Aider habits: guesses import/export names, writes long `../` imports (use the `@/` alias), uses `error.errors`, imports shadcn components that are not installed, writes wrong nested-select relationships, rewrites whole files and drops earlier fixes, leaves placeholder text. Prefer small hand edits (Notepad Ctrl+H, or the PowerShell `Rep` helper below), or a complete replacement file only for files Claude has seen.
- Paths with brackets need quotes or `-LiteralPath`: `"app\check\[packageId]\page.tsx"`. New files are created with `notepad path` (click Yes).
- The user tests in the browser and cleans test rows with SQL in the Supabase SQL Editor.

PowerShell helper used for exact one-line edits (prints OK or FAIL):

```
function Rep($file, $old, $new) {
  $p = (Resolve-Path -LiteralPath $file).Path
  $t = [System.IO.File]::ReadAllText($p)
  $n = ([regex]::Matches($t, [regex]::Escape($old))).Count
  if ($n -ne 1) { Write-Host "FAIL ($n matches) in ${file}: $old" -ForegroundColor Red; return }
  [System.IO.File]::WriteAllText($p, $t.Replace($old, $new), (New-Object System.Text.UTF8Encoding $false))
  Write-Host "OK  $file" -ForegroundColor Green
}
```

To print Japanese files correctly use `Get-Content path -Encoding UTF8`.

## Data model (check `supabase/migrations` for the truth)
- `store_chains(id, name, coupon_percents int[] default '{}' (allowed 5/10/15), member_discount_percent smallint null, has_bonus_points bool default false, point_use_enabled bool default false, point_use_multiplier numeric(4,2) default 1.5, bulk_enabled bool default false)`
- `shops(id, store_chain_id, name, address, region)`, unique `(id, store_chain_id)`
- `products(id, name_ja = main name in any language, name_en = optional 英語名・別名 alias, brand, category, memo)`
- `product_variations(id, product_id, attributes jsonb [{name,value}], attributes_key)`, key unique per product
- `product_packages(id, product_id, variation_id null, package_size, package_unit)` units: ml, L, g, kg, count (個), sheet (枚), bag (袋); composite FK `(variation_id, product_id)`
- `price_observations(id, product_package_id, store_chain_id required, shop_id optional, price, currency, observed_at timestamptz, is_sale, is_member_price, bonus_points, source 'manual', status 'active', submitted_by default auth.uid(), notes)`, composite FK `(shop_id, store_chain_id)`
- RLS: reference tables full access for the authenticated owner; `price_observations` select all, insert and delete own rows, no update. History is never overwritten.
- Times are entered as Japan time (+09:00) with minutes and shown with `timeZone: "Asia/Tokyo"`.

## Demo mode and roles (built, Steps 19a-19i)
- Accounts have a role in `public.profiles` (admin or user); roles are changed only in the Supabase SQL Editor. Admins get a デモモード toggle on `/settings`.
- `app_settings.demo_mode` (one row, default off) lets visitors without an account browse every page read-only. RLS: anon select policies only while the flag is on; all write policies stay authenticated-only. `proxy.ts` treats an unreadable flag as off.
- Write controls are shown but disabled for visitors: `components/ReadOnlyFieldset.tsx`, the `disabled` prop of `DeleteObservationButton`, price entry Save buttons. `getViewer()` in `lib/auth/viewer.ts` tells pages whether anyone is logged in.
- Profile button and side menu: `components/ProfileMenu.tsx`, rendered in `app/layout.tsx`. The logout button moved there from the home page.
- New tables that visitors should see need a "demo read" policy for the anon role using `demo_mode_on()`.

## Themes (built, Steps 20a-20f)
- `profiles.theme` holds the account's theme; list and parsing in `lib/themes/themes.ts`; `getViewer()` returns it; `app/layout.tsx` sets `data-theme` on html. Picker on `/settings` (`app/settings/ThemePicker.tsx`, `themeActions.ts`).
- Panels use the tokens `bg-panel`, `border-line`, `bg-panel-soft`, `bg-chip` (never `bg-white` or `stone` panel colours). Each theme is an `html[data-theme="..."]` block at the end of `app/globals.css`. Themes are cosmetic only.
- Users can update only their own `theme` column (column-level grant); the role column stays protected.
- Search: search_products() (database) and matchesSearch() (lib/search/normalize.ts) are the only search rules. Price entry offers an automatic 1個 for products and variations without a 容量 (value default:<productId>:<variationId or ->, created on the first save).
- Toasts: every form must use useToastedActionState (lib/toast/useToastedActionState.ts) instead of useActionState; the toast area is ToastProvider in app/layout.tsx. Forms that do not use useActionState (for example the 削除 button on a price entry) show no toast.
- まとめ買い: store_chains.bulk_enabled; price_observations.bulk_percent and bulk_quantity (set together, entered price is the already-discounted 1-item price); defaults from the last bulk price at the chain (bulkDefaults.ts); shown by PriceDisplay with the original price calculated back (lib/prices/bulk.ts); cannot be combined with 会員価格.
- Display name: profiles.display_name (optional, max 30, not unique; users can update theme and display_name only), set on /settings, used for the home greeting and the side menu. The home page has a 最近の更新 feed (recent price entries and new products); no notices/announcements table yet.
- Admin tools: /admin (admin only, redirects others), tool list in app/admin/page.tsx; /admin/merge is a placeholder.
- Barcodes: product_barcodes (code is the primary key, product_id required, package_id optional with a composite FK; max 10 per product); /scan reads codes with the browser BarcodeDetector (no library, no image upload; needs Android Chrome, otherwise manual entry); scan found goes to /prices/new?product=<id>, not found goes to /products?barcode=<code>. Barcode field is in components/ProductFields.tsx.
- Deleting: packages and variations: any user when there are no price entries; with price entries only an admin (delete_package()/delete_variation() archive into deleted_records (kind package/variation), hidden by RLS, not removed); products admin-only via delete_product() into the deleted_records archive (rows are hidden by RLS, not removed; revive by deleting the tombstone). Shared product fields live in components/ProductFields.tsx; category suggestions in components/CategoryField.tsx and lib/products/category.ts.
- Themes: default, glass, sky, midnight, calm. Colour themes remap Tailwind colour variables (teal accent, stone greys, amber/rose/red tints) under html[data-theme="..."] in app/globals.css; dark themes share one block and set per-theme --tx-*, --ac-* and panel tokens. When a new colour class is introduced, add it to every theme block.

## Display rules
- Coupons are per chain; the best of coupon and membership percent is shown (never stacked) as the discounted price with the normal price in brackets (`components/PriceDisplay.tsx`, helpers in `lib/prices/coupon.ts`). Membership checkbox on entry means "the entered price is already the membership price". Bonus points never change prices; small "+Nポイント" text only.
- Price check shows the latest price per chain, cheapest first (uses the discounted price). Branch is optional detail.
- Products are always referenced by id; an exact duplicate (same normalized main name and brand) is refused, never merged.

## Main files (verify with `git ls-files`)
- `proxy.ts` (login guard; skips images and `manifest.webmanifest`), `app/layout.tsx`, `components/AppNav.tsx`, `app/manifest.ts`, `public/icons/*`
- `app/prices/new/*` (PriceForm, NewPackageFields, ChainExtras, page) and `app/prices/actions.ts`
- `app/check/page.tsx`, `app/check/[packageId]/{page.tsx,actions.ts}`
- `app/stores/*` (chains, shops, ChainOptionsForm, CouponForm loader, couponActions)
- `app/products/*` (ProductForm, VariationForm, PackageForm, ProductCardTools, ProductMemoEditor, productActions, variationActions, memoActions; `actions.ts` still holds `addPackage` and an unused old `addProduct`)
- `components/{PriceDisplay,DeleteObservationButton,FormParts}.tsx`, `lib/supabase/*`, `lib/prices/*`, `lib/products/variation.ts` (with tests)

## Status and wishlist (confirm against PROGRESS.md)
- Phase 1 features are built: login, stores and branches, chain coupons, membership and bonus points, products with variations, memo, edit products and variations, price entry with inline new product and branch, price check and detail pages, delete own price, Japanese UI, app icon and manifest.
- Still to do: housekeeping (Prettier, `.env.example`, delete the dead `addProduct`), live deploy and phone smoke test, Phase 1 close-out (PROGRESS.md and `git tag phase-1-complete`).
- Next: Phase 2 (freshness score, trust score, unit price per 100 ml / per sheet).
- Wishes: edit a package's size or unit, delete products or variations, show the logo inside the app, an option to rank by normal price instead of discounted price.
