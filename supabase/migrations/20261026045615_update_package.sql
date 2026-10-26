-- Admin only: fix the size or unit of a package (a typo). The package keeps its id, so
-- price records, barcodes and favorites stay attached.
-- Returns ok, not_admin, not_found, invalid or duplicate.
create function public.update_package(p_id uuid, p_size numeric, p_unit text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return 'not_admin';
  end if;
  if p_size is null or p_size <= 0 or p_unit is null or btrim(p_unit) = '' then
    return 'invalid';
  end if;
  if not exists (select 1 from public.product_packages where id = p_id)
     or not public.package_is_visible(p_id) then
    return 'not_found';
  end if;

  update public.product_packages
  set package_size = p_size, package_unit = btrim(p_unit)
  where id = p_id;
  return 'ok';
exception
  when unique_violation then
    return 'duplicate';
end;
$$;

revoke execute on function public.update_package(uuid, numeric, text) from public, anon;
grant execute on function public.update_package(uuid, numeric, text) to authenticated;