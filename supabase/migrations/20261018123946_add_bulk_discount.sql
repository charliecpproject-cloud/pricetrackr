-- まとめ買い (bulk discount): a chain option, and per price the discount percent and
-- the quantity needed. Both are set together or both empty.
alter table public.store_chains
  add column bulk_enabled boolean not null default false;

alter table public.price_observations
  add column bulk_percent smallint check (bulk_percent between 1 and 99),
  add column bulk_quantity integer check (bulk_quantity between 2 and 999),
  add constraint price_observations_bulk_pair
    check ((bulk_percent is null) = (bulk_quantity is null));

-- For "last used bulk values at this chain".
create index price_observations_bulk_idx
  on public.price_observations (store_chain_id, observed_at desc)
  where bulk_percent is not null;