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


- Step 23b (database: deleted_products archive table; product, variation, package and price rows of an archived product are hidden by RLS via product_is_visible() and package_is_visible(), including demo read; delete_variation() and admin-only delete_product() functions) done


- Step 23c (products: delete a 容量 or バリエーション from 商品を編集 only when no price entries exist; admin-only 商品を削除 with two confirmations archives the product; getViewer() returns isAdmin; actions in app/products/deleteActions.ts) done


- Step 23d (docs for deletes, archive and category suggestions) done


- Step 23e (database: deleted_packages and deleted_variations archives; package and variation visibility via package_is_visible() and variation_is_visible(); delete_package() and updated delete_variation(): any user without price entries, only admins with price entries, archived not removed) done


- Step 23f (products page: default shows the 3 newest products with a heading and an all-products button; one shared popup (ProductDialogs.tsx) for バリエーションを追加 and 容量を追加 from each card; admin product delete needs one confirmation; delete actions use delete_package/delete_variation/delete_product; old bottom add forms removed) done


- Step 23g (database: one archive table deleted_records with a kind column (product, package, variation) replaces deleted_products, deleted_packages and deleted_variations; package_price_counts() helper) done


- Step 23h (products: delete buttons and dialogs show the price record count and mark admin overrides; the all/recent toggle and 商品を追加 moved above the cards; page colours use theme tokens again) done


- Step 24a (database: store_chains.point_use_enabled and point_use_multiplier for the 感謝デー ウェル活 option) done


- Step 24b (ウェル活: lib/prices/points.ts with tests; 感謝デー section with ウェル活 checkbox and 倍率 (default 1.5) in the chain options form and its save action) done


- Step 24c (ウェル活 line on prices: components/PriceDisplay.tsx shows points needed for chains with it enabled; passed from the price check and product detail pages; docs updated) done


- Step 25a (database: product_barcodes table, one code belongs to one product, hidden for archived products, demo read) done


- Step 25b (barcodes server side: lib/products/barcode.ts normalising and parsing with tests, barcodeDb.ts, addBarcode and deleteBarcode actions, createProduct saves barcodes and returns the product id, inline new product on price entry saves np_barcode) done


- Step 25c (barcode screens: components/BarcodeScanner.tsx (BarcodeDetector, no upload), BarcodeScanModal, BarcodeInput; ProductFields has a multi-row バーコード field used by 商品を追加 and 新しい商品として登録; ProductForm continues to price entry after a scan; ProductBarcodes in 商品を編集; 商品 page opens the add form with ?barcode=) done


- Step 25d (barcode scan page /scan with camera and manual entry, lookupBarcode action, home card, price entry preselects the scanned product and opens the new-容量 panel when it has none; docs updated) done


- Step 26a (database: product_barcodes now has code as primary key (id column removed) and an optional package_id with a composite foreign key to product_packages; barcodes survive deletion of their package) done


- Step 26b (barcodes: code is the key, optional 容量 per barcode shown and chosen in 商品を編集, scan opens the exact 容量, a barcode entered with a new product links to its new 容量) done


- Step 26c (home cards: title and description on separate lines; admin-only 管理者ツール card on the home page; /admin tool list and a placeholder /admin/merge product merge page) done


- Step 27a (price check: with no search and no filter only the 3 most recently added products are loaded, under the heading 最近追加した商品) done


- Step 28a (profile display name: profiles.display_name, set on 設定 (ProfileNameForm, profileActions.ts), shown as 「○○さん」 in the side menu; getViewer() returns displayName) done


- Step 28b (home dashboard: Japanese greeting with the display name, compact shortcut tiles, 最近の更新 feed of recent price entries and new products, admin tools row; lib/home with tests) done


- Step 29a (database: store_chains.bulk_enabled; price_observations.bulk_percent (1-99) and bulk_quantity (2-999), set together or both null; partial index for the last-used lookup) done


- Step 29b (bulk discount: lib/prices/bulk.ts with tests (validation 1-99 % and 2-999 items, original price calculated back and rounded up); chain option まとめ買い割引あり in the chain settings; dark themes remap rose-50) done


- Step 29c (bulk discount on price entry: checkbox plus 割引率 and 個数 for chains with the option; last used values at the chain (same product first) prefill them via app/prices/bulkDefaults.ts; excludes 会員価格; validated and saved with the price) done


- Step 29d (bulk discount display: PriceDisplay shows まとめ買い badge, entered price, normal price calculated back and the quantity condition; used on the price check, product detail and home feed; bulk prices count as the entered price for 最安, the price range filter and the unit price; docs updated) done


- Step 30 (toast notifications: components/ToastProvider.tsx, lib/toast/useToastedActionState.ts; all useActionState forms switched to the toasted hook by script; green success 3 s, red error 5 s; the price form old local toast removed) done


- Step 31a (database: search_normalize() and search_products() across name, alias, brand, category, memo, variation values, barcodes and sizes; width, case and kana insensitive; all words must match; ranked) done


- Step 31b (search: lib/search/normalize.ts (width, case and kana insensitive, all words must match) with tests; lib/search/products.ts calls search_products(); used by 商品 and 価格確認 (best match first on 商品); the 価格入力 product list filter uses matchesSearch) done


- Step 31c (price entry: a product or variation without a 容量 can get a price; the list offers 1個 and the 容量 is created on the first save; the page queries run together; the list search text includes category and barcodes; bulk defaults understand the 1個 entry) done


- Step 32a (price entry: 日時 defaults to today 12:00 Japan time, also after a save in 連続入力; a 今 button sets the current date and time) done


- Step 32b (tax rate per product: products.tax_rate, 税率 field in the add forms and 商品を編集, calculator icon with a tooltip on 税抜き and 税不明 prices (price check, product detail, home feed); lib/prices/taxHint.ts with tests) done


- Step 33a (価格確認: search scope buttons above the search box (すべて, 商品名, ブランド, カテゴリ, バーコード); search_products() takes a scope; lib/search/scope.ts with tests) done


- Step 33a-2 (search scope buttons reduced to すべて, 商品名 and カテゴリ) done


- Step 33b (価格確認 filters: store categories as multi-select icon buttons with a その他 list; 期間 order 1週間, 1か月, 3か月, 全期間 with 3か月 as the default and the date range only for 全期間; lib/prices/filters.ts and its tests updated) done


- Step 34a-34b (bulk discount tiers, part 1: price_observations.bulk_tiers jsonb with 1-3 tiers, existing bulk rows converted to one-tier lists; lib/prices/bulk.ts parseBulkTiers, parseStoredTiers, bulkTierPrice with tests) done


- Step 34c (bulk discount tiers, part 2: price entry has up to 3 quantity/percent rows for chains with the option, saved as bulk_tiers on the observation (entered price is the regular price); tiers prefilled from the last bulk price at the chain; bulk no longer excludes member price) done


- Step 34d (bulk discount tiers, part 3: PriceDisplay shows the regular price with a まとめ買い block listing each tier (quantity, percent, price per item); price check, product detail and the home feed read bulk_tiers; 最安, price range filter and unit price use the regular or coupon price) done


- Step 35 (price check: every price row on the cards shows the unit price line, same calculation as the product detail page, so sizes can be compared without opening a product; docs updated) done


- Step 35b (unit price lines: lib/prices/unitLines.ts with tests; price check cards hide the unit price for a single piece (1個 / 1枚 / 1袋); prices with bulk tiers show two unit price lines, 通常 and まとめ買い at the biggest discount, on the cards and the detail page) done


- Step 34e (bulk discount tiers, wrap-up: old originalPrice code removed, old bulk_percent and bulk_quantity columns dropped, PART1_FOUNDATION.md and the handoff updated) done


- Step 36 (themes: each theme is a plain CSS file in public/themes/ (glass, sky, midnight, calm, shared dark-base), listed in lib/themes/themes.ts and linked from app/layout.tsx only for the theme in use, so the default theme loads none; midnight is lighter and gives cards a subtle glass look; bottom bar tabs sit in a narrower centred row for iPhone) done


- Step 36b (login guard proxy.ts skips /themes/ so theme CSS files are served without a login check) done


- Step 37 (products page: the 3 recent products are gone; the default view shows the open 商品を追加 section with no list and no list queries; すべての商品を表示 shows the full list with a 商品一覧を閉じる button back; the add section is collapsed while a list or search is shown; docs updated) done


- Step 38a-38b (counter words, part 1: table counter_units (unit, label, enabled, sort_order) seeded with 個 枚 袋 本 玉 束 缶 パック 箱 切れ 丁 尾, readable by everyone, changed only by admins, 個 cannot be hidden or removed, delete_counter_unit() refuses words in use, counter_unit_usage(); lib/prices/unitWords.ts: every unit that is not ml/L/g/kg is a counter word shown as itself, used by packageLabel, unitPrice and the single-piece rule) done


- Step 38c (counter words, part 2: the 単位 dropdowns on 価格入力 and the 容量 dialog on 商品 list the measures plus the enabled words of counter_units (fallback: 個, 枚, 袋); addPrice and addPackage refuse a unit that is neither a measure nor an enabled word; lib/prices/counterUnits.ts) done


- Step 38d-38e (counter words, part 3: /admin/units lists the words with usage counts, show/hide checkbox, remove for unused words, add form with validation (lib/prices/counterWord.ts), registered in the admin tool list; docs updated; Step 38 complete) done


- Step 39 (memo boxes: the shadcn Textarea now uses bg-panel, border-line and shadow-sm instead of a transparent background, so memo fields are visible in every theme) done


- Step 39b (the shadcn Input, used only by the login page, now uses bg-panel, border-line and shadow-sm instead of a transparent background) done


- Step 39c (docs: PART2_GROWTH_FEATURES.md marks what is built, partly built and open; PART1_FOUNDATION.md built list brought up to date) done


- Step 40 (favorites: table favorite_packages per account and exact 容量 with no access for demo visitors; heart button on 価格確認 cards and the detail header; other sizes of the same product and variation get a softer related look (computed, lib/prices/favorites.ts); favorite cards get a soft rose border and tint; お気に入りのみ filter; dark themes remap rose-200; docs updated) done


- Step 41 (unit price lines now show up to three lines from the entered regular price: 通常 without coupon, the best coupon or membership percent, and the best まとめ買い tier (lowest price per item); まとめ買い tiers can be a percent off or a bundle price such as 5個で550円, chosen per row, stored in bulk_tiers as {quantity, percent} or {quantity, total} (no migration); BulkTierLine shows the bundle price with the price per item and the equivalent percent; docs updated) done


- Step 42 (cleaner price block: PriceDisplay is one strip with the regular price once and every coupon of the chain side by side (allDiscounts), the best one big and used for ranking; the tax badge once; ウェル活 is a small line without the repeated regular price and badge; the unit price lines became one compact UnitPriceSummary line (unitPriceSummary) without the tax label; old UnitPriceLine components removed; docs updated) done


## In Progress

- (none)



## Next Up

- Plan Phase 2 (freshness score, trust score, unit price)
- Speed, later (option 2): faster login check with getClaims() in proxy.ts and lib/auth/viewer.ts, and keep the theme in a cookie so the layout needs no profile lookup. First check that the Supabase project uses an asymmetric JWT signing key (Project Settings, JWT Keys), otherwise it gives no gain. Trade-off: a revoked session is not noticed until the token expires. Saves about 2 to 3 round trips per page.
- Speed, later (options 3 and 4, only if the new numbers still look slow): run independent queries together (Promise.all) on 価格入力, 価格確認 and 店舗; limit or lazy-load what 価格入力 loads (all products, packages and shops).
- Speed, later: check that Fluid compute is on (Vercel, Settings, Functions); consider Vercel Speed Insights.



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
- 2026-10-18: speed: the Vercel function region was changed from Washington D.C. (iad1, the default) to Tokyo (hnd1) to sit next to the Supabase project (Tokyo). The login page took about 0.7 s with no database work while the code ran in iad1. Verify with the x-vercel-id header (second part should be hnd1).
- 2026-10-17: demo mode design: roles live in profiles.role (admin or user), changed only in the SQL Editor; the flag is app_settings.demo_mode, changeable only by admins (RLS); while it is on, visitors can only read (anon select policies), every write policy stays authenticated-only; write controls are shown but disabled for visitors (ReadOnlyFieldset); if the flag cannot be read, the login guard treats demo mode as off.
- 2026-10-17: account types are stored in public.profiles.role ('admin' or 'user'); users can read only their own profile and cannot change roles from the app; demo mode will use a flag in a separate app_settings table, added in the next step.
- 2026-10-17: demo mode is a flag in app_settings (one row). While on, the anon role can only read store_chains, shops, products, product_variations, product_packages and price_observations; all write policies stay authenticated-only. The flag is off by default.
- 2026-10-17: in demo mode all pages are visible to visitors; write controls will be shown but disabled. If the demo flag cannot be read, the login guard treats demo mode as off.
- 2026-10-20: package unit words: the measures ml, L, g, kg stay in code; every other unit is a counter word that is stored as the word itself (the old keys count, sheet and bag keep their words 個, 枚, 袋) and shown per piece; the words offered in the dropdowns live in the table counter_units, managed by admins (show/hide, add, remove only when unused, no renaming, 個 can never be hidden or removed).
- 2026-10-20: bulk discount (まとめ買い) tiers are stored in price_observations.bulk_tiers (jsonb list of 1-3 {quantity, percent}); the entered price is always the regular 1-item price and each tier is applied on top at display time with the coupon rounding, never stored; bulk is display-only, so ranking, 最安, the price range filter and the unit price use the regular or coupon price; unit price lines show 通常 plus the biggest tier; the old bulk_percent and bulk_quantity columns were dropped.