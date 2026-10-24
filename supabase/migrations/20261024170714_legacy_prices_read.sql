-- Legacy price entries of the given 容量 (hidden by RLS because their product is archived).
-- Only open legacy 容量 are returned: the product was merged into another one and the 容量 was not
-- archived. Readable by every logged-in user.
create function public.legacy_observations(p_package_ids uuid[])
returns setof public.price_observations
language sql
stable
security definer
set search_path = ''
as $$
  select o.*
  from public.price_observations o
  join public.product_packages k on k.id = o.product_package_id
  join public.deleted_records d
    on d.kind = 'product' and d.record_id = k.product_id and d.merged_into is not null
  where o.product_package_id = any(p_package_ids)
    and not exists (
      select 1 from public.deleted_records dp
      where dp.kind = 'package' and dp.record_id = k.id)
  order by o.observed_at desc, o.created_at desc
  limit 400;
$$;

revoke execute on function public.legacy_observations(uuid[]) from public, anon;
grant execute on function public.legacy_observations(uuid[]) to authenticated;