# PART 2 — Next phases (single-user, still not community)

## Freshness score
Derived, not stored as a permanent field. Inputs: observation age, update frequency for that product/store combo. Simple decay formula is fine to start (e.g. linear decay from 100 over N days) — recalculated from observations, never hand-set.

## Trust score
Separate axis from freshness. A manual entry from the owner can be fresh AND fully trusted from day one. Keep the concept/column separate now so Part 3's verification logic has somewhere to plug in later.

## Unit-price normalization
Normalize kg→g, L→ml; compute price-per-100g / price-per-100ml / price-per-item as a derived value, not stored redundantly.

## AI photo → price pipeline
Photo upload → temp storage → compress → AI vision provider (behind a swappable `VisionProvider` adapter, no vendor-specific code scattered through the app) → structured JSON validated against a strict Zod schema (never trust it raw) → candidate observation with `source=ai_image`, `status=pending` → review/edit UI → approve → becomes a normal `active` observation → temp image deleted (~24–72h retention unless deliberately kept).

Candidate provider: Google Gemini API (verify current free quota before building against it). App must stay fully functional with AI absent/failed — manual entry never depends on this pipeline.

## Internet auto-research (metadata only)
Look up product images, official names, package sizes to backfill missing product metadata. Never auto-generates a price observation — that stays owner/AI-photo/manual until a `source=internet` policy is deliberately designed.

## Dashboard (single-user)
Recently updated prices, biggest price drops in own data, stale products, tracked-product count. No rankings — needs other users to matter.

## Shopping list
User types an item; app suggests matches. Generic request ("hand soap") → a few options/price ranges, not one answer. Specific request (named brand+size) → resolve concretely. Purpose: trip-cost estimation, not a hard recommendation.

## Favorites / restock
Pin a product+package the user buys repeatedly, so current price is a tap away.

## Alerts (lowest priority here)
Price-below-target, new low, product gone stale. Low value while you're the only data source; worth more once Part 3's multi-source data exists.
