-- Phase 1 schema: store chains, shops, products, packages, price observations

create table public.store_chains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  store_chain_id uuid not null references public.store_chains (id),
  name text not null,
  address text,
  region text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name_ja text,
  name_en text,
  brand text,
  category text,
  created_at timestamptz not null default now()
);

create table public.product_packages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  package_size numeric not null,
  package_unit text not null,
  created_at timestamptz not null default now(),
  unique (product_id, package_size, package_unit)
);

create table public.price_observations (
  id uuid primary key default gen_random_uuid(),
  product_package_id uuid not null references public.product_packages (id),
  shop_id uuid not null references public.shops (id),
  price numeric not null check (price >= 0),
  currency text not null default 'JPY',
  observed_at timestamptz not null default now(),
  is_sale boolean not null default false,
  source text not null default 'manual' check (source in ('manual')),
  status text not null default 'active' check (status in ('active')),
  submitted_by uuid references auth.users (id) default auth.uid(),
  notes text,
  created_at timestamptz not null default now()
);

create index price_observations_package_observed_idx
  on public.price_observations (product_package_id, observed_at desc);

-- Row Level Security: on for every table. No policies yet, so all access
-- from the app is denied until Step 5 adds them.
alter table public.store_chains enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.product_packages enable row level security;
alter table public.price_observations enable row level security;