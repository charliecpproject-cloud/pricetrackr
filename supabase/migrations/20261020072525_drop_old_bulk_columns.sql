-- The old single-tier bulk columns are replaced by price_observations.bulk_tiers.
drop index if exists public.price_observations_bulk_idx;

alter table public.price_observations
  drop constraint if exists price_observations_bulk_pair,
  drop column bulk_percent,
  drop column bulk_quantity;