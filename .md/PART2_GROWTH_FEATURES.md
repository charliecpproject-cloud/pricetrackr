# PART 2 — Next phases (single-user, still not community)

## Already done from this part
- Unit-price normalization: built early, shown on the product detail page only (see PART1, "Prices, discounts and unit price").
- A first, simple version of "staleness": the price check page ignores prices older than 6 months when deciding the 最安 badge (`isWithinMonths` in `lib/prices/tax.ts`). Freshness below should reuse and generalize this, not duplicate it.

## Freshness score
Derived, not stored as a permanent field. Inputs: observation age, update frequency for that product/store combo. Simple decay formula is fine to start (e.g. linear decay from 100 over N days) — recalculated from observations, never hand-set. Possible first visible use: grey out prices older than 6 months with a 半年以上前 label.

## Trust score
Separate axis from freshness. A manual entry from the owner can be fresh AND fully trusted from day one. Keep the concept/column separate now so Part 3's verification logic has somewhere to plug in later.

## AI photo → price pipeline
Photo upload → temp storage → compress → AI vision provider (behind a swappable `VisionProvider` adapter, no vendor-specific code scattered through the app) → structured JSON validated against a strict Zod schema (never trust it raw) → candidate observation with `source=ai_image`, `status=pending` → review/edit UI → approve → becomes a normal `active` observation → temp image deleted (~24–72h retention unless deliberately kept).

The candidate includes `tax_basis`: shelf tags often show 税抜 or 税込 text, so the model may suggest it, but the default stays `unknown` and the reviewer confirms it. Never assume a tax rate.

Candidate provider: Google Gemini API (verify current free quota before building against it). App must stay fully functional with AI absent/failed — manual entry never depends on this pipeline.

## Internet auto-research (metadata only)
Look up product images, official names, package sizes to backfill missing product metadata. Never auto-generates a price observation — that stays owner/AI-photo/manual until a `source=internet` policy is deliberately designed.

## Dashboard (single-user)
Recently updated prices (a short "最近の記録" list on the home page), biggest price drops in own data, stale products, tracked-product count. No rankings — needs other users to matter. Any price drop or "lowest" comparison must follow the tax rules in PART1 (same known tax basis only).

## Shopping list
User types an item; app suggests matches. Generic request ("hand soap") → a few options/price ranges, not one answer. Specific request (named brand+size) → resolve concretely. Purpose: trip-cost estimation, not a hard recommendation.

## Favorites / restock
Pin a product+package the user buys repeatedly, so current price is a tap away.

## Alerts (lowest priority here)
Price-below-target, new low, product gone stale. Low value while you're the only data source; worth more once Part 3's multi-source data exists.

## Small wishes (any time)
Edit a package's size or unit; delete products or variations; show the logo inside the app; an option to rank by normal price instead of discounted price; a unit-price ranking across the sizes of one product.