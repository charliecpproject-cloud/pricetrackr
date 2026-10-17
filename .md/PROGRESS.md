# Progress Log


## Current Phase

Phase 1 complete (manual entry and price lookup, live on Vercel)


## Done

- Step 1 done
- Step 2 done
- Step 3 done
- Step 4 done
- Step 5 done
- Step 8 done
- Step 9 (manual price-entry form) done
- Step 10 (unit tests and notes cleanup) done
- Step 13 (home page) done
- Step 14 (mobile‑first layout & styling pass) done
- Step 14b (Japanese interface and visual refresh) done
- Step 14c (chain coupons) done
- Step 14d (chain-first prices) done
- Step 14e (chain membership and bonus-points settings) done
- Step 14f (membership price and bonus points on price entry and price display) done
- Step 14g (product variations: custom attributes, packages per variation, shown in price entry, price check and the detail page) done (jobs G1‑G6: units 枚 and 袋, adding variations, adding packages into variations, the products page showing them)
- Step 14h (product memo) done
- Step 14i (app icon and web app manifest) done
- Step 15 (delete own price entries) done
- Step 16 (housekeeping) done
- Step 17 (deploy and phone smoke test) done
- Step 18 (Phase 1 close-out) done
- Step 14j (price entry inline creation, duplicate handling, field markings) done
- Step 14k done
- Step 14l (tax basis on prices: 税抜き/税込み/不明 radio on price entry, tax badge on every price, price check lists by most recent date, 最安 only among prices from the last 6 months that share the same known basis) done
- Step 14m (UI polish: price form with tax radio icons, collapsible 支店 and 会員価格・ポイント, floating save button; same column width on every page; simpler home page) done
- Step 14n (member-price box checked by default on chains with a membership price; 店舗 page shows one chain at a time from a dropdown, with the add forms collapsed) done
- Step 14o (unit price on the product detail page: per 100 ml / 100 g, or per 個 / 枚 / 袋, with tax label) done
- Step 14p (appearance: 商品 page is search-first with 20 products at a time and collapsed add forms, add forms restyled, clearer active tab in the bottom bar, one grey palette, unused Geist fonts removed) done
- Step 14q (PART1_FOUNDATION.md and PART2_GROWTH_FEATURES.md rewritten to match the app: tax rules, unit price, UI rules, page specifics) done
- Step 14r (chain categories, edit and delete of chains and branches, grouped chain dropdown on price entry with a top-10 short list from weekly usage counts) done
- Step 19a (demo mode, part 1: profiles table with role admin/user, auto-created per account, is_admin() helper; roles changed only in the SQL Editor)
- Step 19b (demo mode, part 2: app_settings table with demo_mode flag, only admins can change it; demo_mode_on() helper; read-only select policies for visitors on chains, shops, products, variations, packages and price observations while demo mode is on)
- Step 19c (demo mode, part 3: proxy.ts lets visitors without an account in while app_settings.demo_mode is on, otherwise redirects to /login; visitors can also read store_chain_usage)
- Step 19d (demo mode, part 4: profile button and side menu on every page except /login; logged-in users see email, 設定 and ログアウト, visitors see デモモード（閲覧のみ） and a ログイン button; lib/auth/viewer.ts getViewer() gives one cached login check per request; logout button removed from the home page)
- Step 19e (demo mode, part 5: /settings page showing account email and role; admins get a デモモード card with an on/off button, server action in app/settings/actions.ts, change enforced by RLS)
- Step 19f (demo mode, part 6: price entry page is visible to visitors; both Save buttons are disabled with a note when not logged in)
- Step 19g (demo mode: chain usage is not recounted when nobody is logged in) done
- Step 19h (demo mode: add, edit and delete controls on stores, products and the detail page are disabled for visitors via components/ReadOnlyFieldset.tsx and a disabled prop on the delete button) done
- Step 19i (demo mode wrap-up: PART1_FOUNDATION.md and the handoff updated, tag demo-mode-complete) done
- Step 20a (themes: profiles.theme column; users can update only their own theme column, role stays protected) done
- Step 20b (themes: lib/themes/themes.ts theme list with parseTheme, getViewer() returns the theme, layout sets data-theme on html) done
- Step 20c (themes: panel colours are now named tokens bg-panel, border-line, bg-panel-soft, bg-chip defined in globals.css; all pages renamed from bg-white, border-stone-200, bg-stone-50, bg-stone-100; default look unchanged) done
- Step 20d (themes: glass theme in globals.css; translucent panel colours, blur, gradient background) done
- Step 20e (themes: theme picker on /settings with previews, server action saves profiles.theme) done
- Step 20f (themes wrap-up: PART1_FOUNDATION.md and handoff updated, tag themes-complete) done


- Step 21 (themes: sky, midnight and calm added; colour variables remapped per theme in globals.css; registered in lib/themes/themes.ts) done


- Step 22a (price entry: the 特売 chip is a yes/no sale flag, icon changed from percent to megaphone) done


- Step 22b (price entry: 連続入力 continuous entry mode toggle at the bottom left keeps chain, branch, tax, sale and member price between saves; tax, member price, bonus points and memo are now controlled by state; form submitted by hand; indigo remapped in the sky, midnight and calm themes) done


- Step 23a (products: category suggestions up to 10 via lib/products/category.ts, categoryActions.ts and components/CategoryField.tsx; shared components/ProductFields.tsx used by 商品を追加 and 新しい商品として登録 (which now saves alias, category and memo too); 容量/単位 layout fixed on price entry) done


## In Progress

- (none)



## Next Up

- Plan Phase 2 (freshness score, trust score, unit price)



## Known Issues

- (none yet)



## Decisions Log

- Using Supabase for DB/auth/storage, Vercel for hosting (2026-09-05)
- 2026-10-11: observed_at is stored as timestamptz, entered as Japan time with minutes
- 2026-10-11: price_observations is insert-only, with no update policy and owner-only delete
- 2026-10-11: npm is used, not pnpm
- 2026-10-11: zod v4, so errors are read with error.issues
- 2026-10-11: Aider jobs are kept small because of the Groq free-tier limit of about 8k tokens per minute
- 2026-10-12: UI is Japanese only with hardcoded strings, no i18n library, product names show name_ja first with name_en as fallback; teal theme with a bottom tab bar; package units are chosen from a native dropdown, with count stored and shown as 個.
- 2026-10-12: coupons are set per chain in `store_chains.coupon_percents` (allowed 5, 10, 15, default none) and the coupon price is calculated at display time, never stored; `price_observations.store_chain_id` is required and `shop_id` is optional, with a composite foreign key ensuring a branch belongs to its chain; the price form takes the chain first, with an optional branch dropdown and a **新規** checkbox that creates a branch; price check shows the latest price per chain, cheapest first.
- 2026-10-13: store_chains.member_discount_percent (null means no membership price) and store_chains.has_bonus_points (default false) are chain options; price_observations.is_member_price and bonus_points are per-price details; discounts do not stack; the larger one is shown; bonuses never change the price.
- 2026-10-13: When a chain has a membership price, the price entry form shows a checkbox indicating the entered price is already the membership price; otherwise the membership price is calculated and displayed alongside the normal price in brackets; discounts never stack and the larger discount (coupon or membership) is shown; cheapest‑first ranking uses the discounted price. Bonus points are stored per price observation and displayed as small text only, never affecting the price.
- 2026-10-13: variations are user-defined attribute rows stored as JSON with a canonical key (full-width converted, trimmed, case and order ignored) that is unique per product; a package may belong to a variation of its own product; each exact package has its own price history; products with variations require choosing a variation when adding a package; to share a history across sizes, use one package and note the detail in the price memo.
- 2026-10-14: products.memo is an optional free-text note (maximum 1000 characters), set when adding a product, editable from the products page, and shown on the product detail page.
- 2026-10-14: the app has a web app manifest (app/manifest.ts) with icons in public/icons (192, 512 and a maskable 512) generated from priceTrackr-logo.png, plus app/icon.png and app/apple-icon.png; the login guard skips manifest.webmanifest so Android can read it without logging in.
- 2026-10-14: price entry form can create a new product and package inline with a 新規 toggle (new product, or a new size of an existing product, with a required variation when the product has variations); an exact duplicate product (same normalized name and brand) is refused instead of merged, and an identical existing package is reused; every field on the form is marked 必須, 任意, or どちらか必須.
- 2026-10-15: product names are typed in one field and saved in `name_ja` when the text contains Japanese characters, otherwise in `name_en`, with an optional second name stored in the other column (handled by `lib/products/name.ts`); products and variations can be edited from the products page (name, optional second name, brand, category; variation attribute rows); editing into an exact duplicate (same normalized name and brand, or same variation attributes on the same product) is refused; form parts moved to `components/FormParts.tsx`.

- 2026-10-15: price_observations.tax_basis ('excl', 'incl', 'unknown', default 'unknown') records whether the entered price excludes or includes tax; no tax rate is assumed or calculated; the price entry form requires choosing it with 不明 preselected; every price shows a tax badge; the price check page lists chains by most recent observation and shows the 最安 badge only among prices from the last 6 months that share the same known basis.
- 2026-10-16: unit price is computed at display time (never stored) from the discounted price and the package size and unit; ml and L are shown per 100 ml, g and kg per 100 g, count, sheet and bag per piece; it is shown only on the product detail page, with the tax label of the price it comes from; multi-packs are entered as a total size.
- 2026-10-16: store_chains.category holds a key from lib/stores/category.ts (null = uncategorized); store_chain_usage(store_chain_id, entries_last_month, updated_at) is a lookup table of price entries per chain over the last 30 days (by observed_at), recounted by the database function refresh_store_chain_usage() when the price entry page finds the table empty or older than 7 days; the price entry chain dropdown is grouped by category (busiest category first, 未分類 last), chains ordered by usage, and shows only the top 10 (filled with the newest chains) unless すべて is ticked; chains and branches that have price entries cannot be deleted, a chain without prices is deleted together with its branches.
- 2026-10-17: demo mode design: roles live in profiles.role (admin or user), changed only in the SQL Editor; the flag is app_settings.demo_mode, changeable only by admins (RLS); while it is on, visitors can only read (anon select policies), every write policy stays authenticated-only; write controls are shown but disabled for visitors (ReadOnlyFieldset); if the flag cannot be read, the login guard treats demo mode as off.
- 2026-10-17: account types are stored in public.profiles.role ('admin' or 'user'); users can read only their own profile and cannot change roles from the app; demo mode will use a flag in a separate app_settings table, added in the next step.
- 2026-10-17: demo mode is a flag in app_settings (one row). While on, the anon role can only read store_chains, shops, products, product_variations, product_packages and price_observations; all write policies stay authenticated-only. The flag is off by default.
- 2026-10-17: in demo mode all pages are visible to visitors; write controls will be shown but disabled. If the demo flag cannot be read, the login guard treats demo mode as off.