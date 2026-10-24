-- Product merge (Step 60a). The old product is archived with the delete tombstone and a pointer
-- to the new product; its 容量, variations and price entries stay where they are ("legacy").
-- An admin then moves a legacy 容量 to the new product, or archives it.
alter table public.deleted_records add column merged_into uuid;
create index deleted_records_merged_into_idx
  on public.deleted_records (merged_into) where merged_into is not null;

-- What a legacy move changed, so that it can be reversed exactly. Only admins can read it.
create table public.price_move_log (
  id uuid primary key default gen_random_uuid(),
  moved_at timestamptz not null default now(),
  moved_by uuid default auth.uid(),
  from_package_id uuid not null,
  to_package_id uuid not null,
  observation_ids uuid[] not null
);
alter table public.price_move_log enable row level security;
create policy "admin read price move log" on public.price_move_log
  for select to authenticated using ((select public.is_admin()));

-- Legacy 容量 of a product: 容量 of products that were merged into it, that still have price
-- entries and were not archived. Readable by every logged-in user.
create function public.legacy_packages(p_product_id uuid)
returns table (
  package_id uuid,
  loser_product_id uuid,
  loser_name text,
  package_size numeric,
  package_unit text,
  variation_attributes jsonb,
  price_entries integer,
  latest_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.id, d.record_id, coalesce(d.name_ja, d.name_en),
         k.package_size::numeric, k.package_unit::text, v.attributes,
         count(o.id)::integer, max(o.observed_at)
  from public.deleted_records d
  join public.product_packages k on k.product_id = d.record_id
  join public.price_observations o on o.product_package_id = k.id
  left join public.product_variations v on v.id = k.variation_id
  where d.kind = 'product'
    and d.merged_into = p_product_id
    and not exists (
      select 1 from public.deleted_records dp
      where dp.kind = 'package' and dp.record_id = k.id)
  group by k.id, d.record_id, d.name_ja, d.name_en, k.package_size, k.package_unit, v.attributes
  order by max(o.observed_at) desc;
$$;

-- For the badge on 価格確認: per product, how many legacy 容量 are open and the newest price date.
create function public.legacy_summary(p_product_ids uuid[])
returns table (product_id uuid, open_packages integer, latest_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select d.merged_into, count(distinct k.id)::integer, max(o.observed_at)
  from public.deleted_records d
  join public.product_packages k on k.product_id = d.record_id
  join public.price_observations o on o.product_package_id = k.id
  where d.kind = 'product'
    and d.merged_into = any(p_product_ids)
    and not exists (
      select 1 from public.deleted_records dp
      where dp.kind = 'package' and dp.record_id = k.id)
  group by d.merged_into;
$$;

-- Admin only: archive the old product p_loser and point it to p_winner.
create function public.merge_products(p_loser uuid, p_winner uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prod public.products;
  v_entries integer;
  v_winner_codes integer;
  v_slots integer;
  v_moved integer := 0;
  v_left integer := 0;
  v_legacy integer := 0;
begin
  if not public.is_admin() then
    return jsonb_build_object('status', 'not_admin');
  end if;
  if p_loser = p_winner then
    return jsonb_build_object('status', 'same');
  end if;

  select * into v_prod from public.products where id = p_loser;
  if not found or not public.product_is_visible(p_loser) then
    return jsonb_build_object('status', 'loser_not_found');
  end if;
  if not exists (select 1 from public.products where id = p_winner)
     or not public.product_is_visible(p_winner) then
    return jsonb_build_object('status', 'winner_not_found');
  end if;

  select count(*) into v_entries
  from public.price_observations o
  join public.product_packages k on k.id = o.product_package_id
  where k.product_id = p_loser;

  insert into public.deleted_records
    (kind, record_id, name_ja, name_en, brand, category, memo, snapshot,
     price_entry_count, deleted_by, merged_into)
  values (
    'product', v_prod.id, v_prod.name_ja, v_prod.name_en, v_prod.brand, v_prod.category, v_prod.memo,
    jsonb_build_object(
      'product', to_jsonb(v_prod),
      'variations', coalesce(
        (select jsonb_agg(to_jsonb(v)) from public.product_variations v where v.product_id = p_loser),
        '[]'::jsonb),
      'packages', coalesce(
        (select jsonb_agg(to_jsonb(k)) from public.product_packages k where k.product_id = p_loser),
        '[]'::jsonb),
      'price_entry_count', v_entries
    ),
    v_entries,
    auth.uid(),
    p_winner
  );

  -- earlier merges into the old product now point to the new one
  update public.deleted_records
     set merged_into = p_winner
   where kind = 'product' and merged_into = p_loser;

  -- barcodes move up to the limit of 10 per product; the rest stay with the old product
  select count(*) into v_winner_codes from public.product_barcodes where product_id = p_winner;
  v_slots := greatest(0, 10 - v_winner_codes);
  with pick as (
    select code from public.product_barcodes
    where product_id = p_loser
    order by code
    limit v_slots
  )
  update public.product_barcodes b
     set product_id = p_winner, package_id = null
    from pick
   where b.code = pick.code;
  get diagnostics v_moved = row_count;
  select count(*) into v_left from public.product_barcodes where product_id = p_loser;

  select coalesce(sum(s.open_packages), 0)::integer into v_legacy
  from public.legacy_summary(array[p_winner]) s;

  return jsonb_build_object(
    'status', 'ok',
    'price_entries', v_entries,
    'barcodes_moved', v_moved,
    'barcodes_left', v_left,
    'legacy_packages', v_legacy
  );
end;
$$;

-- Admin only: move all price entries of one legacy 容量 to the matching 容量 of the new product
-- (created when it does not exist yet).
create function public.move_legacy_package(p_package uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pkg public.product_packages;
  v_old public.product_variations;
  v_winner uuid;
  v_variation uuid;
  v_target uuid;
  v_ids uuid[];
  v_none constant uuid := '00000000-0000-0000-0000-000000000000';
begin
  if not public.is_admin() then
    return jsonb_build_object('status', 'not_admin');
  end if;

  select * into v_pkg from public.product_packages where id = p_package;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select d.merged_into into v_winner
  from public.deleted_records d
  where d.kind = 'product' and d.record_id = v_pkg.product_id and d.merged_into is not null;
  if v_winner is null then
    return jsonb_build_object('status', 'not_legacy');
  end if;
  if exists (select 1 from public.deleted_records where kind = 'package' and record_id = p_package) then
    return jsonb_build_object('status', 'already_archived');
  end if;
  if not public.product_is_visible(v_winner) then
    return jsonb_build_object('status', 'winner_hidden');
  end if;

  if v_pkg.variation_id is not null then
    select * into v_old from public.product_variations where id = v_pkg.variation_id;
    select id into v_variation
    from public.product_variations
    where product_id = v_winner and attributes_key = v_old.attributes_key;
    if v_variation is null then
      insert into public.product_variations (product_id, attributes, attributes_key)
      values (v_winner, v_old.attributes, v_old.attributes_key)
      returning id into v_variation;
    elsif not public.variation_is_visible(v_variation) then
      return jsonb_build_object('status', 'winner_variation_hidden');
    end if;
  end if;

  select id into v_target
  from public.product_packages
  where product_id = v_winner
    and coalesce(variation_id, v_none) = coalesce(v_variation, v_none)
    and package_size = v_pkg.package_size
    and package_unit = v_pkg.package_unit;
  if v_target is null then
    insert into public.product_packages (product_id, variation_id, package_size, package_unit)
    values (v_winner, v_variation, v_pkg.package_size, v_pkg.package_unit)
    returning id into v_target;
  elsif not public.package_is_visible(v_target) then
    return jsonb_build_object('status', 'winner_package_hidden');
  end if;

  with moved as (
    update public.price_observations
       set product_package_id = v_target
     where product_package_id = p_package
     returning id
  )
  select coalesce(array_agg(id), '{}'::uuid[]) into v_ids from moved;

  insert into public.price_move_log (from_package_id, to_package_id, observation_ids)
  values (p_package, v_target, v_ids);

  return jsonb_build_object(
    'status', 'ok',
    'package_id', v_target,
    'moved', coalesce(array_length(v_ids, 1), 0)
  );
end;
$$;

-- Admin only: hide a legacy 容量 (same tombstone as an admin's 上書き削除). The price entries stay.
create function public.archive_legacy_package(p_package uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pkg public.product_packages;
  v_winner uuid;
  v_entries integer;
begin
  if not public.is_admin() then
    return jsonb_build_object('status', 'not_admin');
  end if;

  select * into v_pkg from public.product_packages where id = p_package;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select d.merged_into into v_winner
  from public.deleted_records d
  where d.kind = 'product' and d.record_id = v_pkg.product_id and d.merged_into is not null;
  if v_winner is null then
    return jsonb_build_object('status', 'not_legacy');
  end if;
  if exists (select 1 from public.deleted_records where kind = 'package' and record_id = p_package) then
    return jsonb_build_object('status', 'already_archived');
  end if;

  select count(*) into v_entries
  from public.price_observations where product_package_id = p_package;

  insert into public.deleted_records (kind, record_id, snapshot, price_entry_count, deleted_by)
  values ('package', p_package, to_jsonb(v_pkg), v_entries, auth.uid());

  return jsonb_build_object('status', 'ok', 'archived', v_entries);
end;
$$;

revoke execute on function public.legacy_packages(uuid) from public, anon;
revoke execute on function public.legacy_summary(uuid[]) from public, anon;
revoke execute on function public.merge_products(uuid, uuid) from public, anon;
revoke execute on function public.move_legacy_package(uuid) from public, anon;
revoke execute on function public.archive_legacy_package(uuid) from public, anon;
grant execute on function public.legacy_packages(uuid) to authenticated;
grant execute on function public.legacy_summary(uuid[]) to authenticated;
grant execute on function public.merge_products(uuid, uuid) to authenticated;
grant execute on function public.move_legacy_package(uuid) to authenticated;
grant execute on function public.archive_legacy_package(uuid) to authenticated;