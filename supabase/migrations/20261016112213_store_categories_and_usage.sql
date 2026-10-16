-- Chain category: a key from lib/stores/category.ts (null = uncategorized).
alter table public.store_chains add column category text;

-- Lookup table: price entries per chain over the last 30 days.
-- Recounted by refresh_store_chain_usage(); never edited by hand.
create table public.store_chain_usage (
  store_chain_id uuid primary key references public.store_chains (id) on delete cascade,
  entries_last_month integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.store_chain_usage enable row level security;

create policy "authenticated full access" on public.store_chain_usage
  for all to authenticated using (true) with check (true);

create or replace function public.refresh_store_chain_usage()
returns void
language sql
security invoker
set search_path = ''
as $$
  with counts as (
    select c.id as store_chain_id, count(o.id)::integer as n
    from public.store_chains c
    left join public.price_observations o
      on o.store_chain_id = c.id
     and o.observed_at >= now() - interval '30 days'
    group by c.id
  )
  insert into public.store_chain_usage (store_chain_id, entries_last_month, updated_at)
  select store_chain_id, n, now() from counts
  on conflict (store_chain_id) do update
    set entries_last_month = excluded.entries_last_month,
        updated_at = excluded.updated_at;
$$;

revoke execute on function public.refresh_store_chain_usage() from public, anon;
grant execute on function public.refresh_store_chain_usage() to authenticated;