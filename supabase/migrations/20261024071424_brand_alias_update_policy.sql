-- merge_brand() repoints and upserts aliases, so admins need an update policy too.
create policy "admin update brand aliases" on public.brand_aliases
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));