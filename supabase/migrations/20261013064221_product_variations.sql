-- Product variations: user-defined attributes such as タイプ：パンツ, サイズ：M.
create table public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  attributes jsonb not null
    check (case when jsonb_typeof(attributes) = 'array'
                then jsonb_array_length(attributes) > 0
                else false end),
  attributes_key text not null,
  created_at timestamptz not null default now(),
  unique (product_id, attributes_key),
  unique (id, product_id)
);

alter table public.product_variations enable row level security;
create policy "authenticated full access" on public.product_variations
  for all to authenticated using (true) with check (true);

-- A package may belong to a variation of its own product.
alter table public.product_packages add column variation_id uuid;
alter table public.product_packages
  add constraint product_packages_variation_fkey
  foreign key (variation_id, product_id)
  references public.product_variations (id, product_id);

-- The old uniqueness ignored variations, so replace it.
alter table public.product_packages
  drop constraint if exists product_packages_product_id_package_size_package_unit_key;
create unique index product_packages_unique_idx
  on public.product_packages (
    product_id,
    coalesce(variation_id, '00000000-0000-0000-0000-000000000000'::uuid),
    package_size,
    package_unit
  );