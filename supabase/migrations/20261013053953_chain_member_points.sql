-- Chain options: membership discount (null = none) and bonus points (off by default).
alter table public.store_chains
  add column member_discount_percent smallint
    check (member_discount_percent between 1 and 30),
  add column has_bonus_points boolean not null default false;

-- Per-price details: is the entered price already the membership price, and bonus points.
alter table public.price_observations
  add column is_member_price boolean not null default false,
  add column bonus_points integer
    check (bonus_points between 0 and 100000);