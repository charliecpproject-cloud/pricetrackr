-- Demo mode: a single on/off flag. While it is on, visitors without an account
-- can READ the main data (read-only). Nothing can be written without logging in.

create table public.app_settings (
  id boolean primary key default true check (id),  -- always one row
  demo_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, demo_mode) values (true, false);

alter table public.app_settings enable row level security;

-- Everyone (including the login guard, before anyone is logged in) may read the flag.
create policy "anyone can read settings" on public.app_settings
  for select to anon, authenticated using (true);

-- Only an admin may change it. No insert or delete policy.
create policy "admin can update settings" on public.app_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Is demo mode on right now?
create function public.demo_mode_on()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select demo_mode from public.app_settings where id), false);
$$;

revoke execute on function public.demo_mode_on() from public;
grant execute on function public.demo_mode_on() to anon, authenticated;

-- Read-only access for visitors while demo mode is on.
create policy "demo read" on public.store_chains
  for select to anon using ((select public.demo_mode_on()));
create policy "demo read" on public.shops
  for select to anon using ((select public.demo_mode_on()));
create policy "demo read" on public.products
  for select to anon using ((select public.demo_mode_on()));
create policy "demo read" on public.product_variations
  for select to anon using ((select public.demo_mode_on()));
create policy "demo read" on public.product_packages
  for select to anon using ((select public.demo_mode_on()));
create policy "demo read" on public.price_observations
  for select to anon using ((select public.demo_mode_on()));