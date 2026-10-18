-- Barcodes of products. A product may have several; a code belongs to one product.
-- Only the code text is stored, never an image.
create table public.product_barcodes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  code text not null check (code ~ '^[A-Z0-9]{6,32}$'),
  created_at timestamptz not null default now(),
  unique (code)
);

create index product_barcodes_product_id_idx on public.product_barcodes (product_id);

alter table public.product_barcodes enable row level security;

-- Barcodes of archived (deleted) products are hidden, like the product itself.
create policy "read visible barcodes" on public.product_barcodes
  for select to authenticated using (public.product_is_visible(product_id));
create policy "insert barcodes" on public.product_barcodes
  for insert to authenticated with check (true);
create policy "delete barcodes" on public.product_barcodes
  for delete to authenticated using (true);

-- Demo mode visitors can look codes up (read only).
create policy "demo read" on public.product_barcodes
  for select to anon
  using ((select public.demo_mode_on()) and public.product_is_visible(product_id));