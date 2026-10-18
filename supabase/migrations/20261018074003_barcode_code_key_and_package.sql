-- Barcodes: the code itself is the key; each barcode belongs to a product and,
-- when known, to one exact 容量 (package).

-- A package can be referenced together with its product (variations already work this way).
alter table public.product_packages
  add constraint product_packages_id_product_id_key unique (id, product_id);

-- The code becomes the primary key; the separate id column is not needed.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.product_barcodes'::regclass
      and contype in ('p', 'u')
  loop
    execute format('alter table public.product_barcodes drop constraint %I', c.conname);
  end loop;
end
$$;

alter table public.product_barcodes drop column id;
alter table public.product_barcodes add primary key (code);

-- Optional exact 容量. (package_id, product_id) must be a real package of that product.
-- If the package is deleted, the barcode stays on the product.
alter table public.product_barcodes add column package_id uuid;
alter table public.product_barcodes
  add constraint product_barcodes_package_fkey
  foreign key (package_id, product_id)
  references public.product_packages (id, product_id)
  on delete set null (package_id);
create index product_barcodes_package_id_idx on public.product_barcodes (package_id);

create policy "update barcodes" on public.product_barcodes
  for update to authenticated using (true) with check (true);