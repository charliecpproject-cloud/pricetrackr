-- Counter words for package units (個, 枚, 袋, 本, ...). The measures ml, L, g and kg stay in code.
-- unit = what is stored in product_packages.package_unit (the old keys count, sheet and bag,
-- or the word itself); label = the word shown.
-- RLS: everyone logged in can read, visitors can read in demo mode, only admins can add words
-- and change enabled / sort_order (column-level grant). There is no delete policy: a word is
-- removed through delete_counter_unit(), which refuses the word 個 and words that are in use.
create table public.counter_units (
  unit text primary key check (char_length(unit) between 1 and 8 and unit !~ '\s'),
  label text not null check (char_length(label) between 1 and 8 and label !~ '\s'),
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint counter_units_not_a_measure check (unit not in ('ml', 'L', 'g', 'kg')),
  constraint counter_units_count_stays_enabled check (unit <> 'count' or enabled)
);

create unique index counter_units_label_idx on public.counter_units (lower(label));

alter table public.counter_units enable row level security;

create policy "read counter units" on public.counter_units
  for select to authenticated using (true);
create policy "demo read counter units" on public.counter_units
  for select to anon using ((select public.demo_mode_on()));
create policy "admin insert counter units" on public.counter_units
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin update counter units" on public.counter_units
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Admins may change only enabled and sort_order, never the stored word itself.
revoke update on public.counter_units from authenticated;
grant update (enabled, sort_order) on public.counter_units to authenticated;

insert into public.counter_units (unit, label, sort_order) values
  ('count', '個', 1),
  ('sheet', '枚', 2),
  ('bag', '袋', 3),
  ('本', '本', 4),
  ('玉', '玉', 5),
  ('束', '束', 6),
  ('缶', '缶', 7),
  ('パック', 'パック', 8),
  ('箱', '箱', 9),
  ('切れ', '切れ', 10),
  ('丁', '丁', 11),
  ('尾', '尾', 12);

-- How many packages use each unit (admins only; counts hidden packages too).
create or replace function public.counter_unit_usage()
returns table (unit text, package_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select k.package_unit, count(*)
  from public.product_packages k
  where (select public.is_admin())
  group by k.package_unit;
$$;

revoke all on function public.counter_unit_usage() from public, anon;
grant execute on function public.counter_unit_usage() to authenticated;

-- Removes a word. Returns ok, not_admin, protected (個), in_use or not_found.
create or replace function public.delete_counter_unit(p_unit text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return 'not_admin';
  end if;
  if p_unit = 'count' then
    return 'protected';
  end if;
  if exists (select 1 from public.product_packages where package_unit = p_unit) then
    return 'in_use';
  end if;
  delete from public.counter_units where unit = p_unit;
  if not found then
    return 'not_found';
  end if;
  return 'ok';
end;
$$;

revoke all on function public.delete_counter_unit(text) from public, anon;
grant execute on function public.delete_counter_unit(text) to authenticated;