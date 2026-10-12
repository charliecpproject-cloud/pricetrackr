-- Coupons are set per chain: which of 5%, 10%, 15% are available. Default: none.
alter table public.store_chains
  add column coupon_percents integer[] not null default '{}'
  check (coupon_percents <@ array[5, 10, 15]);