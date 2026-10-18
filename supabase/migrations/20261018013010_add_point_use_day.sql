-- 感謝デー / ウェル活: on the point-use day 1 point is worth `multiplier` yen.
-- Per chain; off by default. The app shows the points needed, it does not check dates.
alter table public.store_chains
  add column point_use_enabled boolean not null default false,
  add column point_use_multiplier numeric(4, 2) not null default 1.5
    check (point_use_multiplier between 1 and 10);