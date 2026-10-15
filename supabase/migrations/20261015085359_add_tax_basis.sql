-- Whether the entered price excludes tax, includes tax, or is not known.
-- No tax rate is stored or calculated; the price is recorded as entered.
alter table public.price_observations
  add column tax_basis text not null default 'unknown'
    check (tax_basis in ('excl', 'incl', 'unknown'));