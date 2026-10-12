-- Prices belong to a chain (required); the branch is optional.

-- Needed so a (branch, chain) pair can be checked by a foreign key.
alter table public.shops
  add constraint shops_id_chain_key unique (id, store_chain_id);

alter table public.price_observations
  add column store_chain_id uuid references public.store_chains (id);

-- Copy the chain of each existing price from its branch.
update public.price_observations o
set store_chain_id = s.store_chain_id
from public.shops s
where s.id = o.shop_id;

alter table public.price_observations alter column store_chain_id set not null;
alter table public.price_observations alter column shop_id drop not null;

-- A branch, when given, must belong to the chosen chain.
alter table public.price_observations
  drop constraint if exists price_observations_shop_id_fkey;
alter table public.price_observations
  add constraint price_observations_shop_chain_fkey
  foreign key (shop_id, store_chain_id) references public.shops (id, store_chain_id);

create index price_observations_chain_observed_idx
  on public.price_observations (store_chain_id, observed_at desc);