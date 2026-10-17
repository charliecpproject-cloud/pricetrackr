-- Each account can choose a theme. The app validates the value against its theme list.
alter table public.profiles
  add column theme text not null default 'default'
  check (char_length(theme) <= 30);

-- Users may change ONLY their own theme, never their role.
-- Table-level update is removed; update is granted on the theme column only.
revoke update on public.profiles from anon, authenticated;
grant update (theme) on public.profiles to authenticated;

create policy "update own theme" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);