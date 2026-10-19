-- Search aliases: a word (for example a category such as ベビーフード) and other words
-- that people may type for it (離乳食, baby food). Searching an alias also searches the word.
-- Everyone can read them (search needs them); only admins can change them.
create table public.search_aliases (
  id uuid primary key default gen_random_uuid(),
  canonical text not null check (char_length(canonical) between 1 and 50),
  alias text not null check (char_length(alias) between 1 and 50),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index search_aliases_unique_idx
  on public.search_aliases (lower(canonical), lower(alias));

alter table public.search_aliases enable row level security;

create policy "read aliases" on public.search_aliases
  for select to authenticated using (true);
create policy "demo read aliases" on public.search_aliases
  for select to anon using ((select public.demo_mode_on()));
create policy "admin insert aliases" on public.search_aliases
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin update aliases" on public.search_aliases
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete aliases" on public.search_aliases
  for delete to authenticated using ((select public.is_admin()));

-- search_products() now also searches the word of every enabled alias that appears in the query.
create or replace function public.search_products(p_query text, p_limit integer default 50)
returns table (product_id uuid, score integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with base as (
    select public.search_normalize(p_query) as q
  ),
  queries as (
    select b.q from base b
    union
    select replace(b.q, public.search_normalize(a.alias), public.search_normalize(a.canonical))
    from base b
    join public.search_aliases a
      on a.enabled
     and public.search_normalize(a.alias) <> ''
     and position(public.search_normalize(a.alias) in b.q) > 0
  ),
  qs as (
    select q, row_number() over (order by q) as qi from queries
  ),
  tokens as (
    select distinct qs.qi, tok
    from qs, unnest(string_to_array(qs.q, ' ')) as tok
    where tok <> ''
  ),
  docs as (
    select
      p.id,
      public.search_normalize(concat_ws(' ', p.name_ja, p.name_en)) as name_text,
      public.search_normalize(coalesce(p.brand, '')) as brand_text,
      public.search_normalize(coalesce(p.category, '')) as category_text,
      public.search_normalize(coalesce(p.memo, '')) as memo_text,
      public.search_normalize(coalesce(
        (select string_agg(v.attributes_key, ' ')
         from public.product_variations v where v.product_id = p.id), '')) as variation_text,
      public.search_normalize(coalesce(
        (select string_agg(b.code, ' ')
         from public.product_barcodes b where b.product_id = p.id), '')) as barcode_text,
      public.search_normalize(coalesce(
        (select string_agg(trim_scale(k.package_size)::text || k.package_unit, ' ')
         from public.product_packages k where k.product_id = p.id), '')) as package_text
    from public.products p
  ),
  scored as (
    select d.id, t.qi, sum(w.weight)::integer as score
    from docs d
    cross join tokens t
    cross join lateral (
      select greatest(
        case when position(t.tok in d.name_text) > 0 then 10 else 0 end,
        case when position(t.tok in d.barcode_text) > 0 then 9 else 0 end,
        case when position(t.tok in d.brand_text) > 0 then 6 else 0 end,
        case when position(t.tok in d.category_text) > 0 then 5 else 0 end,
        case when position(t.tok in d.variation_text) > 0 then 4 else 0 end,
        case when position(t.tok in d.package_text) > 0 then 2 else 0 end,
        case when position(t.tok in d.memo_text) > 0 then 1 else 0 end
      ) as weight
    ) w
    group by d.id, t.qi
    having bool_and(w.weight > 0)
  )
  select s.id, max(s.score)::integer
  from scored s
  group by s.id
  order by max(s.score) desc, s.id
  limit greatest(least(p_limit, 200), 1);
$$;