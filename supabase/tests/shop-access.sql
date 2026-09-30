-- Isolated fixture identities are rolled back; never point this at unrelated projects.
begin;
insert into auth.users(id,is_anonymous) values('11111111-1111-4111-8111-111111111111',true),('22222222-2222-4222-8222-222222222222',false);
insert into public.carts(user_id) values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","is_anonymous":true}',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.carts)<>1 then raise exception 'Guest cart ownership failed';end if;
 if exists(select 1 from public.carts where user_id='22222222-2222-4222-8222-222222222222') then raise exception 'Cross-owner cart exposed';end if;
 if has_table_privilege(current_user,'public.orders','INSERT') then raise exception 'Browser can insert orders';end if;
 if has_table_privilege(current_user,'public.carts','UPDATE') then raise exception 'Browser can mutate cart ownership';end if;
 if has_schema_privilege(current_user,'luma_private','USAGE') then raise exception 'Private schema exposed';end if;
 if (select count(*) from public.products)<>7 then raise exception 'Active catalog is not readable';end if;
end $$;
reset role;
set local role anon;
do $$ begin if has_table_privilege(current_user,'public.products','INSERT') then raise exception 'Public catalog writable';end if; if (select count(*) from public.products)<>7 then raise exception 'Public catalog read failed';end if;end $$;
reset role;
rollback;
