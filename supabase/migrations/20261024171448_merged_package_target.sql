-- For an old link to a 容量 of a product that was merged into another: the 容量 of the new
-- product to show instead (the matching 容量, otherwise the smallest visible one). Null if none.
create function public.merged_package_target(p_package uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with src as (
    select k.product_id, k.package_size, k.package_unit, v.attributes_key
    from public.product_packages k
    left join public.product_variations v on v.id = k.variation_id
    where k.id = p_package
  ),
  dest as (
    select d.merged_into as winner
    from public.deleted_records d
    join src on d.record_id = src.product_id
    where d.kind = 'product' and d.merged_into is not null
  )
  select k2.id
  from dest
  cross join src
  join public.product_packages k2 on k2.product_id = dest.winner
  left join public.product_variations v2 on v2.id = k2.variation_id
  where public.product_is_visible(dest.winner)
    and public.package_is_visible(k2.id)
  order by
    (k2.package_size = src.package_size
       and k2.package_unit = src.package_unit
       and v2.attributes_key is not distinct from src.attributes_key) desc,
    k2.package_size
  limit 1;
$$;

revoke execute on function public.merged_package_target(uuid) from public, anon;
grant execute on function public.merged_package_target(uuid) to authenticated;