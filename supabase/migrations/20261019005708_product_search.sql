-- Search: width-, case- and kana-insensitive, several words (all must match),
-- across name, alias, brand, category, memo, variations, barcodes and sizes.

-- Normalise text for searching: NFKC (full/half width), lower case,
-- hiragana folded to katakana (U+3041-3096 -> U+30A1-30F6).
create or replace function public.search_normalize(t text)
returns text
language sql
stable
set search_path = ''
as $$
  select translate(
    lower(normalize(coalesce(t, ''), NFKC)),
    (select string_agg(chr(i), '' order by i) from generate_series(12353, 12438) as i),
    (select string_agg(chr(i + 96), '' order by i) from generate_series(12353, 12438) as i)
  );
$$;

create or replace function public.search_products(p_query text, p_limit integer default 50)
returns table (product_id uuid, score integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with tokens as (
    select distinct tok
    from unnest(string_to_array(public.search_normalize(p_query), ' ')) as tok
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
  )
  select d.id, sum(w.weight)::integer as score
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
  group by d.id
  having bool_and(w.weight > 0)
  order by score desc, d.id
  limit greatest(least(p_limit, 200), 1);
$$;

grant execute on function public.search_normalize(text) to anon, authenticated;
revoke execute on function public.search_products(text, integer) from public;
grant execute on function public.search_products(text, integer) to anon, authenticated;