-- Favorites: one row per account and exact 容量 (package). "Related" packages (the same product and
-- variation as a favorite) are worked out by the app, never stored.
-- RLS: an account reads, adds and removes only its own rows. There is NO policy for the anon role,
-- so demo mode visitors never see favorites. Favorites of archived products, variations or packages
-- are hidden (package_is_visible). If a package is really deleted, its favorites go with it.
create table public.favorite_packages (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  package_id uuid not null references public.product_packages (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, package_id)
);

create index favorite_packages_package_id_idx on public.favorite_packages (package_id);

alter table public.favorite_packages enable row level security;

create policy "read own favorites" on public.favorite_packages
  for select to authenticated
  using (user_id = (select auth.uid()) and public.package_is_visible(package_id));
create policy "add own favorites" on public.favorite_packages
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.package_is_visible(package_id));
create policy "remove own favorites" on public.favorite_packages
  for delete to authenticated
  using (user_id = (select auth.uid()));