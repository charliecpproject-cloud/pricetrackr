-- Phase 1 RLS policies. One owner account; public sign-ups are disabled.

-- Reference tables: any logged-in user can read, add, edit and delete.
create policy "authenticated full access" on public.store_chains
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on public.shops
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on public.products
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on public.product_packages
  for all to authenticated using (true) with check (true);

-- Price observations: read all, insert and delete only your own rows.
-- There is deliberately NO update policy (observations are insert-only).
create policy "authenticated can read" on public.price_observations
  for select to authenticated using (true);

create policy "owner can insert own" on public.price_observations
  for insert to authenticated with check ((select auth.uid()) = submitted_by);

create policy "owner can delete own" on public.price_observations
  for delete to authenticated using ((select auth.uid()) = submitted_by);