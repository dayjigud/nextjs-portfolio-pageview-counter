-- Run only against an isolated Luma test database after applying the migration.
begin;
insert into auth.users(id,is_anonymous) values('a1111111-1111-4111-8111-111111111111',false),('b2222222-2222-4222-8222-222222222222',false);
insert into public.carts(user_id) values('a1111111-1111-4111-8111-111111111111'),('b2222222-2222-4222-8222-222222222222');
insert into public.orders(reference,user_id,subtotal_kobo,delivery_kobo,total_kobo,recipient_email,delivery,idempotency_key,request_fingerprint) values('LUMA-REALTIME-FIXTURE','a1111111-1111-4111-8111-111111111111',100,250000,250100,'fixture@example.test','{}','cccccccc-cccc-4ccc-8ccc-cccccccccccc',repeat('a',64));
do $$ begin
 if (select count(*) from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename in ('carts','orders'))<>2 then raise exception 'Realtime membership missing';end if;
 if exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='luma_private') then raise exception 'Private schema published';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","is_anonymous":false}',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.carts where user_id='a1111111-1111-4111-8111-111111111111')<>1 then raise exception 'Owner cart denied';end if;
 if exists(select 1 from public.carts where user_id='b2222222-2222-4222-8222-222222222222') then raise exception 'Outsider cart exposed';end if;
 if (select count(*) from public.orders where reference='LUMA-REALTIME-FIXTURE')<>1 then raise exception 'Owner order denied';end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated","is_anonymous":false}',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.orders where reference='LUMA-REALTIME-FIXTURE') then raise exception 'Outsider order exposed';end if;
end $$;
reset role;
rollback;
