# PART 1 — Foundation

## What this is
Private, single-user price tracker for Japan (JPY), bilingual JA/EN product data, installed as a web app on Android. Manual entry + price lookup with history. No AI, no other users yet. Phase 1 is complete and live on Vercel.

## Built (Phase 1 and early extras)
- Next.js on Vercel + Supabase (Auth/DB), owner-only account (sign-ups disabled), RLS on every table.
- Tables: products, product_variations, product_packages, store_chains, shops, price_observations.
- Pages: home, price entry (with inline new product/package/branch), price check (latest price per chain), product detail (latest price, history, unit price), stores (chains, branches, coupons, membership and points settings), products (add/edit products, variations, packages, memo), delete own price entries.
- Also built: chain coupons, membership price and bonus points, product variations, product memo, tax basis, unit price on the detail page, app icon and web app manifest.

## Not built yet (OUT)
AI/photo extraction, freshness/trust scoring, translation-approval workflow, internet auto-research, multi-user, shopping list, favorites, alerts, gamification, community/regional features. See PART2/PART3 when relevant — don't build ahead of scope.

## Schema principles (don't flatten these)
- Product ≠ package: `products(id, name_ja, name_en, brand, category, memo (optional free text, max 1000 chars))` vs `product_packages(id, product_id, variation_id (optional), package_size, package_unit)`. A multi-pack is entered as one total size (6 × 350 ml = 2100 ml).
- Variations: `product_variations(id, product_id, attributes jsonb [{name, value}], attributes_key)`, user-defined and optional. `attributes_key` is canonical (NFKC, trimmed, lower-case, order-independent) and unique per product. A package may belong to a variation of its own product (composite FK `(variation_id, product_id)`). Prices always reference the exact package, so each package has its own history. To make different sizes share one history, use one package and put the detail in the price note. Helpers live in `lib/products/variation.ts`. Units: ml, L, g, kg, count (個), sheet (枚), bag (袋). Nested selects must follow real foreign keys: `price_observations` to `store_chains` (direct) and `shops`; `product_packages` to `products` and `product_variations`; `products` to `product_variations` and `product_packages`.
- Store chain ≠ shop: `store_chains(id, name, coupon_percents int[] default '{}', allowed values 5/10/15, member_discount_percent smallint null = no membership price, has_bonus_points bool default false)` vs `shops(id, store_chain_id, name, address, region)`. Chains also have `category` (a key from `lib/stores/category.ts`: supermarket, drugstore, convenience, discount, hundred_yen, apparel, other; null = 未分類). `store_chain_usage(store_chain_id, entries_last_month, updated_at)` is a lookup table of price entries per chain over the last 30 days (by observed_at), recounted by `refresh_store_chain_usage()` when the price entry page finds it empty or older than 7 days; it drives the price entry chain dropdown (grouped by category, most used first, top 10 unless すべて is ticked). Chains and branches with price entries cannot be deleted.
- Price = observation, not attribute: `price_observations(id, product_package_id, store_chain_id (required), shop_id (optional branch), price, currency, observed_at, is_sale, is_member_price (default false), bonus_points (optional int), tax_basis ('excl'|'incl'|'unknown', default 'unknown'), source, status, created_at)`; a composite foreign key `(shop_id, store_chain_id)` guarantees the branch belongs to the chain. Insert-only, never overwrite. Include `source` (='manual') and `status` (='active') now even with one value each — this is what lets AI/community sources slot in later without a migration touching every row.
- Current price = latest observation by date, always derived, never stored on the product. Lookups are chain-first: show the latest price per chain, most recent first; the branch is optional extra detail, not required anywhere.
- Times: `observed_at` stays `timestamptz`. The user enters Japan time with minutes (`YYYY-MM-DDTHH:mm`, saved as `...:00+09:00`). Always display with `timeZone: 'Asia/Tokyo'`. Order history by `observed_at` then `created_at`.

## Tax (the price is recorded as entered)
- `tax_basis` is required on every entry: `excl` = 税抜き, `incl` = 税込み, `unknown` = 不明 (preselected). The price is stored exactly as entered. No tax rate is assumed or calculated anywhere (reduced rates and exceptions exist).
- Every price shows a small badge, via the `taxBasis` prop of `components/PriceDisplay.tsx`: 税抜 / 税込 / 税不明. Helpers live in `lib/prices/tax.ts` (`parseTaxBasis`, `canCompare`, `isCheapest`, `isWithinMonths`).
- Never declare a winner without full information: the 最安 badge appears on the price check page only when at least two chains have prices from the last 6 months and all of those share the same known basis (all 税抜 or all 税込). Otherwise there is no badge and no explanatory note. Older prices stay in the list but never get the badge.

## Prices, discounts and unit price
- Coupons: set per chain (`coupon_percents`), never stored on observations. Show the best enabled percent: coupon price = `floor(price × (100 − pct) / 100)`, large and rose-coloured with a `N%クーポン` badge, and the normal price in grey brackets `（通常価格 ¥…）`. It is an estimate (one item, tax not modelled). Always render prices with `components/PriceDisplay.tsx`.
- Membership (per chain, `member_discount_percent`): if the entered price is a normal price, show the membership price (same rounding) with the normal price in brackets; if `is_member_price` is true, the entered price is already the membership price, shown with a 会員価格 badge and no bracket. Discounts never stack: show the larger of the best coupon and the membership percent.
- Bonus points (per chain, `has_bonus_points`) never change the price: show a small `+Nポイント` text on the card and detail row only.
- Unit price (helpers in `lib/prices/unit.ts`, never stored): ml and L per 100 ml, g and kg per 100 g, 個 / 枚 / 袋 per piece. Computed from the discounted price (same estimate as the big price), shown with the tax label, and only on the product detail page (latest price card and each history row). Different kinds (ml vs g) are never compared.

## Security
Per CONVENTIONS.md: RLS everywhere, secrets in env vars only, parameterized queries only, validate the entry form's input. No exceptions for single-user.

## Free-tier ceilings (verify current numbers before relying on them)
- Supabase Free: ~500MB DB, 1GB storage, 50k MAU, ~5GB egress; pauses after 1 week inactive.
- Vercel Hobby: personal/non-commercial use only.
- GitHub Free: unlimited repos, 2,000 Actions min/month.

## Tech stack (locked)
Next.js 16 (App Router), React 19, Tailwind 4, TypeScript strict, npm (not pnpm), Vercel Hobby. Use current-version syntax, not older Next/Tailwind patterns. Supabase via `@supabase/ssr` only: `createBrowserClient` in the browser (stores session in cookies), `createServerClient` on the server/middleware. Never `createClient` from `@supabase/supabase-js` for app code. Server auth checks use `getUser()`, not `getSession()`. Before importing from a helper file, read its actual exports; don't guess names. CLI migrations committed to Git, no dashboard schema edits. Tailwind + shadcn/ui, lucide-react. react-hook-form + Zod v4 (use `error.issues[0].message`; `error.errors` no longer exists). Server Actions: `"use server"` only on line 1 of the actions file, only async functions exported, form actions take `(prevState, formData)` and return `{ error: string | null }`. Vitest for unit tests. ESLint + Prettier. Bilingual data = plain `name_ja`/`name_en` columns (not a localization table yet). UI-chrome localization deferred. No `next/font`: the Japanese system font stack is set in `app/globals.css`.

## UI style
- Layout: mobile-first, one centered column. The column width and side padding come ONLY from `<main>` in `app/layout.tsx` (`mx-auto w-full max-w-xl px-4`). Pages must not add their own `max-w-*`, `mx-auto`, `px-*`, `min-h-screen` or background wrapper.
- Look: warm off-white background, one teal accent (`teal-600`, set as shadcn `--primary`), white cards (`rounded-2xl border border-stone-200 shadow-sm`), generous spacing, bold large prices with `tabular-nums`, lucide-react icons. One grey palette: `stone-*` only (never `gray` or `slate`); errors `text-red-600`, success `text-teal-700`.
- Navigation: bottom tab bar (ホーム, 価格入力, 価格確認, 店舗, 商品); the active tab has a teal pill behind its icon and a bold label.
- Controls: inputs and buttons at least 48px tall (`h-12`), input text 16px or larger. Exceptions on purpose: small label-style rows (collapsible 支店) and the tax radio tiles (`h-10`). Use shadcn `Button`, `Card`, `Input`, `Label`, `Badge` from `@/components/ui/*`; keep native `<select>` for dropdowns. Installed shadcn components are only: button, card, input, label, badge, textarea. Never import any other `@/components/ui/*` file; use a native element instead.
- Forms: every field is marked 必須 or 任意 with a badge. `Badge`, `Field`, `NewToggle`, `controlCls` and `labelCls` live in `components/FormParts.tsx`. No "必須 は必ず入力してください" explanation line. Rarely used fields are collapsed by default with `components/Collapsible.tsx` (the content stays mounted, so its inputs are still submitted).
- Every page has a heading, an empty state, and a visible error message. Import project files with the `@/` alias, never long `../` paths. No new dependencies.

### Page specifics
- Home: compact teal gradient bar with the app icon and "PriceTrackr" (no headline text), two large action cards (価格入力, 価格確認), small logout link.
- Price entry (order): product search, product and package (the 新規 toggle creates a product and package inline, fields `np_*`; an exact duplicate product is refused, never merged), chain, 支店 (collapsed, optional, with its own 新規 toggle), 価格 in a short box with a 特売 chip beside it, the member-price checkbox directly under the price (only for chains with a membership price, checked by default; it means the entered price is already the membership price), tax radio (Tag icon 税抜き, Receipt icon 税込み, HelpCircle icon 不明; 不明 preselected), bonus points (only for chains with points), 日時, メモ, 保存. A round floating Save button (floppy-disk icon) appears at the bottom right while the main Save button is off screen, with a short message at the top after saving.
- Price check: search, then one card per package with the latest price per chain (most recent first, tax badge on each price, 最安 only under the tax rules above). No unit price on these cards.
- Product detail: 最新価格 card and the price history, each with tax badge and unit price line, and delete for own entries.
- Stores: a dropdown chooses one chain (`?chain=<id>`); only that chain's branches are loaded; the add-chain and add-branch forms are collapsed `<details>`.
- Products: search first (`?q=`), 20 products at a time; the add forms (商品, バリエーション, 容量) are collapsed `<details>` below the list.

## UI language
Japanese only, hardcoded strings, no i18n library, polite です/ます tone. Show `name_ja` first, falling back to `name_en`. A product has ONE main name field (商品名, any language, no language detection), stored in the `name_ja` column, plus an optional 英語名・別名 alias stored in `name_en` and used in searches. The column names are historical. Products are always referenced by id, so renaming never breaks prices. Never translate code identifiers, form field names, database columns, or stored values (source, status, currency, tax_basis). Terms: ホーム, 価格入力, 価格確認, 店舗, チェーン, 支店, 商品, 容量, 価格, 特売, 日時, メモ, 保存, 削除, 検索, ログイン, ログアウト, メールアドレス, パスワード, クーポン, 通常価格, 会員価格, 最安, 税抜き, 税込み, 不明 (radio), 税抜 / 税込 / 税不明 (badges), 商品バリエーション, パッケージ. Unit `count` displays as 個.