-- Bulk discount tiers: a list of {quantity, percent} objects (1 to 3 tiers),
-- applied on top of the regular price entered on the observation.
alter table public.price_observations
  add column bulk_tiers jsonb,
  add constraint price_observations_bulk_tiers_check
    check (
      bulk_tiers is null
      or (jsonb_typeof(bulk_tiers) = 'array' and jsonb_array_length(bulk_tiers) between 1 and 3)
    );

-- Existing bulk rows become one-tier lists. The price is not changed.
update public.price_observations
set bulk_tiers = jsonb_build_array(
  jsonb_build_object('quantity', bulk_quantity, 'percent', bulk_percent)
)
where bulk_percent is not null and bulk_quantity is not null;

-- For "last used bulk tiers at this chain".
create index price_observations_bulk_tiers_idx
  on public.price_observations (store_chain_id, observed_at desc)
  where bulk_tiers is not null;