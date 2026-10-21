# PART 2 — Next phases (single-user, still not community)

## Already done from this part
- Unit-price normalization (Steps 14o, 35, 35b): shown on the product detail page and on every price row of the price check cards (nothing for a single piece: 1個 / 1枚 / 1袋; a price with bulk tiers shows a 通常 line and a まとめ買い line). See PART1, "Prices, discounts and unit price".
- A first, simple version of "staleness": the price check page ignores prices older than 6 months when deciding the 最安 badge (`isWithinMonths` in `lib/prices/tax.ts`), and it shows only the last 3 months of prices by default (the 期間 filter, `lib/prices/filters.ts`). Freshness below should reuse and generalize these, not duplicate them.
- Dashboard, first version (Step 28b): the home page has a 最近の更新 feed (the latest 5 price entries and 5 new products merged, newest first, at most 6 rows) and shortcut tiles. Still open: biggest price drops, stale products, tracked-product count (see Dashboard below).
- Small wishes done: delete products, variations and 容量 (Steps 23b-23h; regular users only when no price entries exist, admins can override, archived and never really removed), and the app icon in the home header.

## Freshness score (not built)
Derived, not stored as a permanent field. Inputs: observation age, update frequency for that product/store combo. Simple decay formula is fine to start (e.g. linear decay from 100 over N days) — recalculated from observations, never hand-set. Possible first visible use: grey out prices older than 6 months with a 半年以上前 label.

## Trust score (not built)
Separate axis from freshness. A manual entry from the owner can be fresh AND fully trusted from day one. Keep the concept/column separate now so Part 3's verification logic has somewhere to plug in later.

## AI photo → price pipeline (not built)
Photo upload → temp storage → compress → AI vision provider (behind a swappable `VisionProvider` adapter, no vendor-specific code scattered through the app) → structured JSON validated against a strict Zod schema (never trust it raw) → candidate observation with `source=ai_image`, `status=pending` → review/edit UI → approve → becomes a normal `active` observation → temp image deleted (~24–72h retention unless deliberately kept).

The candidate includes `tax_basis`: shelf tags often show 税抜 or 税込 text, so the model may suggest it, but the default stays `unknown` and the reviewer confirms it. Never assume a tax rate.

Candidate provider: Google Gemini API (verify current free quota before building against it). App must stay fully functional with AI absent/failed — manual entry never depends on this pipeline.

## Internet auto-research, metadata only (not built)
Look up product images, official names, package sizes to backfill missing product metadata. Never auto-generates a price observation — that stays owner/AI-photo/manual until a `source=internet` policy is deliberately designed.

## Dashboard, single-user (partly built)
Built: the 最近の更新 list on the home page (see above). Still open: biggest price drops in own data, stale products, tracked-product count. No rankings — needs other users to matter. Any price drop or "lowest" comparison must follow the tax rules in PART1 (same known tax basis only).

## Shopping list (not built)
User types an item; app suggests matches. Generic request ("hand soap") → a few options/price ranges, not one answer. Specific request (named brand+size) → resolve concretely. Purpose: trip-cost estimation, not a hard recommendation.

## Favorites / restock (built, Step 40)
Pin a product the user likes or buys repeatedly, so it gets extra attention on the price check page (a heart next to the name and a slightly different card) and its current price is a tap away. Favorites belong to the account and are per exact 容量; the other sizes of the same variation get a softer "related" look. There is a お気に入りのみ filter. Not built yet: favorites first in lists, a favorites shortcut on the home page, restock hints. Details are in PART1, "Favorites".

## Alerts, lowest priority here (not built)
Price-below-target, new low, product gone stale. Low value while you're the only data source; worth more once Part 3's multi-source data exists.

## Small wishes (any time)
Still open: edit a package's size or unit; an option to rank by normal price instead of discounted price; a unit-price ranking across the sizes of one product (the unit price is shown on every card, but nothing ranks or badges it yet).
Done: delete products or variations; show the logo inside the app (the home header).