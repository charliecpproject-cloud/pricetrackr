-- search_products() gets a scope: all (default), name, brand, category or barcode.
drop function public.search_products(text, integer);

create function public.search_products(
  p_query text,
  p_limit integer default 50,
  p_scope text default 'all'
)
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
        case when p_scope in ('all', 'name') and position(t.tok in d.name_text) > 0 then 10 else 0 end,
        case when p_scope in ('all', 'barcode') and position(t.tok in d.barcode_text) > 0 then 9 else 0 end,
        case when p_scope in ('all', 'brand') and position(t.tok in d.brand_text) > 0 then 6 else 0 end,
        case when p_scope in ('all', 'category') and position(t.tok in d.category_text) > 0 then 5 else 0 end,
        case when p_scope = 'all' and position(t.tok in d.variation_text) > 0 then 4 else 0 end,
        case when p_scope = 'all' and position(t.tok in d.package_text) > 0 then 2 else 0 end,
        case when p_scope = 'all' and position(t.tok in d.memo_text) > 0 then 1 else 0 end
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

revoke execute on function public.search_products(text, integer, text) from public;
grant execute on function public.search_products(text, integer, text) to anon, authenticated;