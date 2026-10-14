alter table public.products
  add column memo text check (char_length(memo) <= 1000);