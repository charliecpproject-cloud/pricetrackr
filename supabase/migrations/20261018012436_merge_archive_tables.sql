-- One archive table (tombstones) for archived products, packages and variations.
-- Replaces deleted_products, deleted_packages and deleted_variations.
-- Rows stay in their own tables; RLS hides them while a tombstone exists.
-- Revive: delete the tombstone row in the SQL Editor.

-- 1. deleted_products becomes deleted_records
alter table public.deleted_products rename to deleted_records;
alter table public.deleted_records rename column product_id to record_id;

-- Drop the old primary key and the foreign key to products (kept: deleted_by -> auth.users).
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.deleted_records'::regclass
      and (contype = 'p' or confrelid = 'public.products'::regclass)
  loop
    execute format('alter table public.deleted_records drop constraint %I', c.conname);
  end loop;
end
$$;

alter table public.deleted_records
  add column kind text not null default 'product'
    check (kind in ('product', 'package', 'variation')),
  add column price_entry_count integer not null default 0;
alter table public.deleted_records alter column kind drop default;
alter table public.deleted_records add primary key (kind, record_id);

update public.deleted_records
set price_entry_count = coalesce((snapshot ->> 'price_entry_count')::integer, 0)
where kind = 'product';

-- 2. Move the rows of the two other archive tables
insert into public.deleted_records
  (kind, record_id, snapshot, price_entry_count, deleted_at, deleted_by)
select 'package', package_id, snapshot, price_entry_count, deleted_at, deleted_by
from public.deleted_packages;

insert into public.deleted_records
  (kind, record_id, snapshot, price_entry_count, deleted_at, deleted_by)
select 'variation', variation_id, snapshot, price_entry_count, deleted_at, deleted_by
from public.deleted_variations;

drop table public.deleted_packages;
drop table public.deleted_variations;

drop policy "admin can read deleted products" on public.deleted_records;
create policy "admin can read deleted records" on public.deleted_records
  for select to authenticated using ((select public.is_admin()));

-- 3. Visibility helpers now read the one table
create or replace function public.product_is_visible(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.deleted_records where kind = 'product' and record_id = p_id
  );
$$;

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
        exists (select 1 from public.deleted_records d
                where d.kind = 'product' and d.record_id = k.product_id)
        or exists (select 1 from public.deleted_records d
                   where d.kind = 'package' and d.record_id = k.id)
        or (k.variation_id is not null
            and exists (select 1 from public.deleted_records d
                        where d.kind = 'variation' and d.record_id = k.variation_id))
      )
  );
$$;

create or replace function public.variation_is_visible(v_id uuid)
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
        exists (select 1 from public.deleted_records d
                where d.kind = 'product' and d.record_id = v.product_id)
        or exists (select 1 from public.deleted_records d
                   where d.kind = 'variation' and d.record_id = v.id)
      )
  );
$$;

-- 4. Delete functions write to the one table
create or replace function public.delete_product(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  prod public.products;
  n integer;
begin
  if not public.is_admin() then
    return 'not_admin';
  end if;

  select * into prod from public.products where id = p_id;
  if not found then
    return 'not_found';
  end if;
  if not public.product_is_visible(p_id) then
    return 'not_found';
  end if;

  select count(*) into n
  from public.price_observations o
  join public.product_packages k on k.id = o.product_package_id
  where k.product_id = p_id;

  insert into public.deleted_records
    (kind, record_id, name_ja, name_en, brand, category, memo, snapshot, price_entry_count, deleted_by)
  values (
    'product', prod.id, prod.name_ja, prod.name_en, prod.brand, prod.category, prod.memo,
    jsonb_build_object(
      'product', to_jsonb(prod),
      'variations', coalesce(
        (select jsonb_agg(to_jsonb(v)) from public.product_variations v where v.product_id = p_id),
        '[]'::jsonb),
      'packages', coalesce(
        (select jsonb_agg(to_jsonb(k)) from public.product_packages k where k.product_id = p_id),
        '[]'::jsonb),
      'price_entry_count', n
    ),
    n,
    auth.uid()
  );

  return 'ok';
end;
$$;

create or replace function public.delete_package(p_id uuid)
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

  insert into public.deleted_records (kind, record_id, snapshot, price_entry_count, deleted_by)
  values ('package', p_id, to_jsonb(v_row), n, auth.uid());
  return 'archived';
end;
$$;

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
    delete from public.deleted_records
      where kind = 'package'
        and record_id in (
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

  insert into public.deleted_records (kind, record_id, snapshot, price_entry_count, deleted_by)
  values (
    'variation',
    p_variation_id,
    jsonb_build_object('variation', to_jsonb(v_row), 'packages', pkgs),
    n,
    auth.uid()
  );
  return 'archived';
end;
$$;

-- 5. Price entry counts per package (shown next to the delete buttons)
create function public.package_price_counts(p_package_ids uuid[])
returns table (package_id uuid, entry_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select o.product_package_id, count(*)
  from public.price_observations o
  where o.product_package_id = any (p_package_ids)
  group by o.product_package_id;
$$;

revoke execute on function public.package_price_counts(uuid[]) from public, anon;
grant execute on function public.package_price_counts(uuid[]) to authenticated;