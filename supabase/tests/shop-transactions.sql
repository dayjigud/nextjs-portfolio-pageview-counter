begin;
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.orders'::regclass and contype='u' and pg_get_constraintdef(oid) like '%user_id, idempotency_key%') then raise exception 'Order idempotency uniqueness missing';end if;
 if not exists(select 1 from pg_constraint where conrelid='luma_private.email_jobs'::regclass and contype='u') then raise exception 'Outbox uniqueness missing';end if;
 if (select price_kobo from public.product_variants v join public.products p on p.id=v.product_id where p.slug='luma-a1')<>14500000 then raise exception 'Incorrect seeded kobo price';end if;
 if not exists(select 1 from pg_roles where rolname='luma_server' and not rolbypassrls and not rolsuper) then raise exception 'Server role overprivileged';end if;
end $$;
rollback;
