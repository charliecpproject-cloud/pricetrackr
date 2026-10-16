-- Account types. Role is 'admin' or 'user'; every login account has one profile row.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read only their own profile.
-- No insert, update or delete policy: roles can only be changed in the
-- Supabase SQL Editor (or by the trigger below), never from the app.
create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

-- Every new account automatically gets a 'user' profile.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Existing accounts (your owner account) get a profile too, as 'user'.
-- You promote yourself to admin in the SQL Editor (step 3 below).
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Helper for later policies and server code: is the current user an admin?
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;