-- Visitors in demo mode may also read the chain usage lookup (price entry dropdown).
create policy "demo read" on public.store_chain_usage
  for select to anon using ((select public.demo_mode_on()));