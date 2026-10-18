-- Optional nickname used for greetings. Not unique.
alter table public.profiles
  add column display_name text check (char_length(display_name) <= 30);

-- Users may change only their own theme and display name (never their role).
grant update (display_name) on public.profiles to authenticated;