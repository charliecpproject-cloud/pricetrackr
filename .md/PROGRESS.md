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