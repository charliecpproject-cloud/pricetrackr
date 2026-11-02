-- Admin only: set the brand or the category of the chosen products (Step 76).
-- For a brand, an old spelling that no product uses any more becomes an alias of the new brand.
-- Returns the number of products changed. Prices, packages and barcodes are not touched.
create function public.set_product_field(
  p_field text,
  p_value text,
  p_ids uuid[],
  p_keep_alias boolean default true
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_value text := btrim(p_value);
  v_count integer;
  v_old text[];
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_field not in ('brand', 'category') then
    raise exception 'invalid field' using errcode = '22023';
  end if;
  if v_value is null or v_value = '' or char_length(v_value) > 100 then
    raise exception 'invalid value' using errcode = '22023';
  end if;
  if p_ids is null or coalesce(array_length(p_ids, 1), 0) = 0 or array_length(p_ids, 1) > 500 then
    raise exception 'invalid products' using errcode = '22023';
  end if;

  if p_field = 'category' then
    update public.products set category = v_value where id = any(p_ids);
    get diagnostics v_count = row_count;
    return v_count;
  end if;

  -- brand: remember the old spellings that are going away
  select coalesce(array_agg(distinct btrim(brand)), '{}'::text[]) into v_old
    from public.products
   where id = any(p_ids)
     and brand is not null
     and btrim(brand) <> ''
     and public.search_normalize(brand) <> public.search_normalize(v_value);

  update public.products set brand = v_value where id = any(p_ids);
  get diagnostics v_count = row_count;

  -- an alias that is the same word as the new spelling is not needed any more
  delete from public.brand_aliases
   where public.search_normalize(alias) = public.search_normalize(v_value);

  if p_keep_alias then
    foreach v_name in array v_old loop
      -- only when no product still uses the old spelling
      if not exists (
        select 1 from public.products
         where public.search_normalize(brand) = public.search_normalize(v_name)
      ) then
        update public.brand_aliases
           set brand = v_value
         where public.search_normalize(brand) = public.search_normalize(v_name);
        insert into public.brand_aliases (brand, alias) values (v_value, v_name)
        on conflict (lower(alias)) do update set brand = excluded.brand;
      end if;
    end loop;
  end if;

  return v_count;
end;
$$;

revoke execute on function public.set_product_field(text, text, uuid[], boolean) from public, anon;
grant execute on function public.set_product_field(text, text, uuid[], boolean) to authenticated;