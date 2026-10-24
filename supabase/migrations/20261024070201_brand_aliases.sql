-- Brand aliases: another way to write a brand (パスコ for PASCO).
-- brand = the spelling that products should use. Everyone can read; only admins can change.
create table public.brand_aliases (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (char_length(brand) between 1 and 100),
  alias text not null check (char_length(alias) between 1 and 100),
  created_at timestamptz not null default now(),
  check (lower(alias) <> lower(brand))
);

create unique index brand_aliases_alias_idx on public.brand_aliases (lower(alias));

alter table public.brand_aliases enable row level security;

create policy "read brand aliases" on public.brand_aliases
  for select to authenticated using (true);
create policy "demo read brand aliases" on public.brand_aliases
  for select to anon using ((select public.demo_mode_on()));
create policy "admin insert brand aliases" on public.brand_aliases
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin delete brand aliases" on public.brand_aliases
  for delete to authenticated using ((select public.is_admin()));

-- Admin only: give every product of the brand p_from the brand p_to.
-- The old spelling becomes an alias of the new one. Returns the number of products changed.
create function public.merge_brand(p_from text, p_to text)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from text := btrim(p_from);
  v_to text := btrim(p_to);
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if v_from = '' or v_to = '' or char_length(v_to) > 100 then
    raise exception 'invalid brand' using errcode = '22023';
  end if;

  update public.products
     set brand = v_to
   where public.search_normalize(brand) = public.search_normalize(v_from);
  get diagnostics v_count = row_count;

  -- an alias that is the same word as the new spelling is not needed any more
  delete from public.brand_aliases
   where public.search_normalize(alias) = public.search_normalize(v_to);

  -- aliases that pointed at the old spelling now point at the new one
  update public.brand_aliases
     set brand = v_to
   where public.search_normalize(brand) = public.search_normalize(v_from);

  -- the old spelling becomes an alias
  if public.search_normalize(v_from) <> public.search_normalize(v_to) then
    insert into public.brand_aliases (brand, alias) values (v_to, v_from)
    on conflict (lower(alias)) do update set brand = excluded.brand;
  end if;

  return v_count;
end;
$$;

revoke execute on function public.merge_brand(text, text) from public, anon;
grant execute on function public.merge_brand(text, text) to authenticated;