-- Search suggestions: the words shown as quick-search chips on 価格確認. One row only.
-- display_count = how many of the first terms are shown; terms = the list in the order typed.
-- Everyone logged in can read it, demo mode visitors too. Only admins can change it, and only
-- display_count, terms and updated_at (column grant). No insert or delete policy: the single
-- row is created here.
create table public.search_suggestions (
  id boolean primary key default true check (id),
  display_count smallint not null default 3 check (display_count between 1 and 10),
  terms text[] not null default '{}' check (cardinality(terms) <= 30),
  updated_at timestamptz not null default now()
);

insert into public.search_suggestions (id) values (true);

alter table public.search_suggestions enable row level security;

create policy "read search suggestions" on public.search_suggestions
  for select to authenticated using (true);
create policy "demo read search suggestions" on public.search_suggestions
  for select to anon using ((select public.demo_mode_on()));
create policy "admin update search suggestions" on public.search_suggestions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke update on public.search_suggestions from authenticated;
grant update (display_count, terms, updated_at) on public.search_suggestions to authenticated;