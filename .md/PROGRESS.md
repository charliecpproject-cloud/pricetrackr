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
- Step 15 (delete own price entries) done
- Step 16 (housekeeping) done
- Step 17 (deploy and phone smoke test) done
- Step 18 (Phase 1 close-out) done



## In Progress

- (none)



## Next Up

- Step 14f (price entry fields and price display for membership and bonus points)
- Step 14g part B (variation forms and display, jobs G7 to G9)
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
- 2026-10-12: coupons are set per chain (`store_chains.coupon_percents` (allowed 5, 10, 15, default none); the coupon price is calculated at display time and never stored; the best enabled percent is shown as the coupon price with the normal price in brackets; coupon price = floor(price × (100 − percent) / 100), an estimate that ignores tax and the one-item limit.
- 2026-10-12: coupons are set per chain in `store_chains.coupon_percents` (allowed 5, 10, 15, default none) and the coupon price is calculated at display time, never stored; `price_observations.store_chain_id` is required and `shop_id` is optional, with a composite foreign key ensuring a branch belongs to its chain; the price form takes the chain first, with an optional branch dropdown and a **新規** checkbox that creates a branch; price check shows the latest price per chain, cheapest first.
- 2026-10-13: store_chains.member_discount_percent (null means no membership price) and store_chains.has_bonus_points (default false) are chain options; price_observations.is_member_price and bonus_points are per-price details; discounts do not stack; the larger one is shown; bonuses never change the price.
- 2026-10-13: When a chain has a membership price, the price entry form shows a checkbox indicating the entered price is already the membership price; otherwise the membership price is calculated and displayed alongside the normal price in brackets. Discounts never stack and the larger discount (coupon or membership) is shown; cheapest‑first ranking uses the discounted price. Bonus points are stored per price observation and displayed as small text only, never affecting the price.
- 2026-10-13: variations are user-defined attribute rows stored as JSON with a canonical key (full-width converted, trimmed, case and order ignored) that is unique per product; a package may belong to a variation of its own product; each exact package has its own price history; products with variations require choosing a variation when adding a package; to share a history across sizes, use one package and note the detail in the price memo.
- 2026-10-14: products.memo is an optional free-text note (maximum 1000 characters), set when adding a product, editable from the products page, and shown on the product detail page.
