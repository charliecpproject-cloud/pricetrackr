-- Tax rate (%) of a product; applies to all its variations and packages.
-- Used to suggest a tax-included price for prices entered as 税抜き or 税不明.
alter table public.products
  add column tax_rate smallint check (tax_rate between 0 and 30);