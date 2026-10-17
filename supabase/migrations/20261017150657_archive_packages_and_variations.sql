-- Archives for 容量 and バリエーション that have price entries (admin override).
-- Rows stay where they are; RLS hides them while a tombstone exists.
-- Revive: delete the tombstone row in the SQL Editor.

create table public.deleted_packages (
  package_id uuid primary key references public.product_packages (id),
  snapshot jsonb not null,
  price_entry_count integer not null default 0,
  deleted_at timestamptz not null default now(),
  deleted_by uuid references auth.users (id) default auth.uid()
);

create table public.deleted_variations (
  variation_id uuid primary key references public.product_variations (id),
  snapshot jsonb not null,
  price_entry_count integer not null default 0,
  deleted_at timestamptz not null default now(),
  deleted_by uuid references auth.users (id) default auth.uid()
);

alter table public.deleted_packages enable row level security;
alter table public.deleted_variations enable row level security;

create policy "admin can read deleted packages" on public.deleted_packages
  for select to authenticated using ((select public.is_admin()));
create policy "admin can read deleted variations" on public.deleted_variations
  for select to authenticated using ((select public.is_admin()));

-- A package is hidden when it, its variation, or its product is archived.
create or replace function public.package_is_visible(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.product_packages k
    where k.id = p_id
      and (
        exists (select 1 from public.deleted_products d where d.product_id = k.product_id)
        or exists (select 1 from public.deleted_packages d where d.package_id = k.id)
        or (k.variation_id is not null
            and exists (select 1 from public.deleted_variations d where d.variation_id = k.variation_id))
      )
  );
$$;

-- A variation is hidden when it or its product is archived.
create function public.variation_is_visible(v_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.product_variations v
    where v.id = v_id
      and (
        exists (select 1 from public.deleted_products d where d.product_id = v.product_id)
        or exists (select 1 from public.deleted_variations d where d.variation_id = v.id)
      )
  );
$$;

revoke execute on function public.variation_is_visible(uuid) from public;
grant execute on function public.variation_is_visible(uuid) to anon, authenticated;

-- Variation policies now use the variation check.
drop policy "read visible variations" on public.product_variations;
drop policy "update visible variations" on public.product_variations;
drop policy "demo read" on public.product_variations;
create policy "read visible variations" on public.product_variations
  for select to authenticated using (public.variation_is_visible(id));
create policy "update visible variations" on public.product_variations
  for update to authenticated using (public.variation_is_visible(id)) with check (true);
create policy "demo read" on public.product_variations
  for select to anon
  using ((select public.demo_mode_on()) and public.variation_is_visible(id));

-- Package policies now use the package check.
drop policy "read visible packages" on public.product_packages;
drop policy "update visible packages" on public.product_packages;
drop policy "demo read" on public.product_packages;
create policy "read visible packages" on public.product_packages
  for select to authenticated using (public.package_is_visible(id));
create policy "update visible packages" on public.product_packages
  for update to authenticated using (public.package_is_visible(id)) with check (true);
create policy "demo read" on public.product_packages
  for select to anon
  using ((select public.demo_mode_on()) and public.package_is_visible(id));

-- Delete a package: any user when it has no price entries;
-- with price entries only an admin (archived, not removed).
create function public.delete_package(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.product_packages;
  n integer;
begin
  select * into v_row from public.product_packages where id = p_id;
  if not found then
    return 'not_found';
  end if;
  if not public.package_is_visible(p_id) then
    return 'not_found';
  end if;

  select count(*) into n
  from public.price_observations where product_package_id = p_id;

  if n = 0 then
    delete from public.product_packages where id = p_id;
    return 'ok';
  end if;

  if not public.is_admin() then
    return 'has_prices';
  end if;

  insert into public.deleted_packages (package_id, snapshot, price_entry_count, deleted_by)
  values (p_id, to_jsonb(v_row), n, auth.uid());
  return 'archived';
end;
$$;

-- Delete a variation (and its packages): same rule.
create or replace function public.delete_variation(p_variation_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.product_variations;
  n integer;
  pkgs jsonb;
begin
  select * into v_row from public.product_variations where id = p_variation_id;
  if not found then
    return 'not_found';
  end if;
  if not public.variation_is_visible(p_variation_id) then
    return 'not_found';
  end if;

  select count(*) into n
  from public.price_observations o
  join public.product_packages k on k.id = o.product_package_id
  where k.variation_id = p_variation_id;

  if n = 0 then
    delete from public.deleted_packages
      where package_id in (
        select id from public.product_packages where variation_id = p_variation_id);
    delete from public.product_packages where variation_id = p_variation_id;
    delete from public.product_variations where id = p_variation_id;
    return 'ok';
  end if;

  if not public.is_admin() then
    return 'has_prices';
  end if;

  select coalesce(jsonb_agg(to_jsonb(k)), '[]'::jsonb) into pkgs
  from public.product_packages k where k.variation_id = p_variation_id;

  insert into public.deleted_variations (variation_id, snapshot, price_entry_count, deleted_by)
  values (
    p_variation_id,
    jsonb_build_object('variation', to_jsonb(v_row), 'packages', pkgs),
    n,
    auth.uid()
  );
  return 'archived';
end;
$$;

revoke execute on function public.delete_package(uuid) from public, anon;
grant execute on function public.delete_package(uuid) to authenticated;
grant execute on function public.delete_variation(uuid) to authenticated;