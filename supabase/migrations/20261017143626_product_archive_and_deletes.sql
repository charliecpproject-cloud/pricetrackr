-- Deleted products: a tombstone with the product info and a snapshot.
-- The product, its variations, packages and price entries stay in their tables
-- but are hidden from the app (row level security) while a tombstone exists.
-- Revive: delete the tombstone row. Cleanup: delete the hidden rows later.

create table public.deleted_products (
  product_id uuid primary key references public.products (id),
  name_ja text,
  name_en text,
  brand text,
  category text,
  memo text,
  snapshot jsonb not null,
  deleted_at timestamptz not null default now(),
  deleted_by uuid references auth.users (id) default auth.uid()
);

alter table public.deleted_products enable row level security;

-- Only admins can read the archive. Rows are written only by delete_product().
create policy "admin can read deleted products" on public.deleted_products
  for select to authenticated using ((select public.is_admin()));

-- Visibility helpers (security definer, so they can see the archive).
create function public.product_is_visible(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.deleted_products where product_id = p_id
  );
$$;

create function public.package_is_visible(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.product_packages k
    join public.deleted_products d on d.product_id = k.product_id
    where k.id = p_id
  );
$$;

revoke execute on function public.product_is_visible(uuid) from public;
revoke execute on function public.package_is_visible(uuid) from public;
grant execute on function public.product_is_visible(uuid) to anon, authenticated;
grant execute on function public.package_is_visible(uuid) to anon, authenticated;

-- products
drop policy "authenticated full access" on public.products;
drop policy "demo read" on public.products;
create policy "read visible products" on public.products
  for select to authenticated using (public.product_is_visible(id));
create policy "insert products" on public.products
  for insert to authenticated with check (true);
create policy "update visible products" on public.products
  for update to authenticated using (public.product_is_visible(id)) with check (true);
create policy "delete products" on public.products
  for delete to authenticated using (true);
create policy "demo read" on public.products
  for select to anon
  using ((select public.demo_mode_on()) and public.product_is_visible(id));

-- product_variations
drop policy "authenticated full access" on public.product_variations;
drop policy "demo read" on public.product_variations;
create policy "read visible variations" on public.product_variations
  for select to authenticated using (public.product_is_visible(product_id));
create policy "insert variations" on public.product_variations
  for insert to authenticated with check (true);
create policy "update visible variations" on public.product_variations
  for update to authenticated using (public.product_is_visible(product_id)) with check (true);
create policy "delete variations" on public.product_variations
  for delete to authenticated using (true);
create policy "demo read" on public.product_variations
  for select to anon
  using ((select public.demo_mode_on()) and public.product_is_visible(product_id));

-- product_packages
drop policy "authenticated full access" on public.product_packages;
drop policy "demo read" on public.product_packages;
create policy "read visible packages" on public.product_packages
  for select to authenticated using (public.product_is_visible(product_id));
create policy "insert packages" on public.product_packages
  for insert to authenticated with check (true);
create policy "update visible packages" on public.product_packages
  for update to authenticated using (public.product_is_visible(product_id)) with check (true);
create policy "delete packages" on public.product_packages
  for delete to authenticated using (true);
create policy "demo read" on public.product_packages
  for select to anon
  using ((select public.demo_mode_on()) and public.product_is_visible(product_id));

-- price_observations (insert and delete-own policies stay as they are)
drop policy "authenticated can read" on public.price_observations;
drop policy "demo read" on public.price_observations;
create policy "read visible prices" on public.price_observations
  for select to authenticated using (public.package_is_visible(product_package_id));
create policy "demo read" on public.price_observations
  for select to anon
  using ((select public.demo_mode_on()) and public.package_is_visible(product_package_id));

-- Delete a variation together with its packages, only when none of them has price entries.
create function public.delete_variation(p_variation_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.product_variations where id = p_variation_id
  ) then
    return 'not_found';
  end if;

  if exists (
    select 1
    from public.price_observations o
    join public.product_packages k on k.id = o.product_package_id
    where k.variation_id = p_variation_id
  ) then
    return 'has_prices';
  end if;

  delete from public.product_packages where variation_id = p_variation_id;
  delete from public.product_variations where id = p_variation_id;
  return 'ok';
end;
$$;

-- Admin-only: archive a product (price entries are kept but hidden).
create function public.delete_product(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  prod public.products;
begin
  if not public.is_admin() then
    return 'not_admin';
  end if;

  select * into prod from public.products where id = p_id;
  if not found then
    return 'not_found';
  end if;
  if exists (select 1 from public.deleted_products where product_id = p_id) then
    return 'not_found';
  end if;

  insert into public.deleted_products
    (product_id, name_ja, name_en, brand, category, memo, snapshot, deleted_by)
  values (
    prod.id, prod.name_ja, prod.name_en, prod.brand, prod.category, prod.memo,
    jsonb_build_object(
      'product', to_jsonb(prod),
      'variations', coalesce(
        (select jsonb_agg(to_jsonb(v)) from public.product_variations v where v.product_id = p_id),
        '[]'::jsonb),
      'packages', coalesce(
        (select jsonb_agg(to_jsonb(k)) from public.product_packages k where k.product_id = p_id),
        '[]'::jsonb),
      'price_entry_count', (
        select count(*)
        from public.price_observations o
        join public.product_packages k on k.id = o.product_package_id
        where k.product_id = p_id)
    ),
    auth.uid()
  );

  return 'ok';
end;
$$;

revoke execute on function public.delete_variation(uuid) from public, anon;
revoke execute on function public.delete_product(uuid) from public, anon;
grant execute on function public.delete_variation(uuid) to authenticated;
grant execute on function public.delete_product(uuid) to authenticated;