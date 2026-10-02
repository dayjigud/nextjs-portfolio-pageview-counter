-- Add only owner-readable invalidation tables; existing RLS remains authoritative.
do $$
begin
 if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
  raise exception 'supabase_realtime publication is missing';
 end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='carts') then
  alter publication supabase_realtime add table public.carts;
 end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
  alter publication supabase_realtime add table public.orders;
 end if;
end $$;
