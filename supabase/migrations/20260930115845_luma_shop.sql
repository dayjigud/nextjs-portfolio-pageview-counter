-- Additive Luma schema. Never apply this to an unrelated project.
create schema if not exists luma_private;
revoke all on schema luma_private from public, anon, authenticated;
do $$ begin if not exists(select 1 from pg_roles where rolname='luma_server') then create role luma_server nologin noinherit; end if; end $$;
grant usage on schema public,luma_private to luma_server;
create table public.categories(id uuid primary key default gen_random_uuid(),slug text unique not null,label text not null,sort_order int not null default 0);
create table public.products(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,description text not null,category_id uuid not null references public.categories(id),specifications jsonb not null default '{}',active boolean not null default true);
create table public.product_variants(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),label text not null,price_kobo bigint not null check(price_kobo between 0 and 900719925474099),currency text not null default 'NGN' check(currency='NGN'),active boolean not null default true,unique(product_id,label));
create table public.product_images(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),storage_path text not null,alt text not null,sort_order int not null default 0);
create table public.profiles(user_id uuid primary key references auth.users(id) on delete cascade,display_name text not null default '' check(length(display_name)<=100),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.carts(id uuid primary key default gen_random_uuid(),user_id uuid unique not null references auth.users(id) on delete cascade,revision int not null default 0 check(revision>=0),updated_at timestamptz not null default now());
create table public.cart_items(cart_id uuid not null references public.carts(id) on delete cascade,variant_id uuid not null references public.product_variants(id),quantity int not null check(quantity between 1 and 10),primary key(cart_id,variant_id));
create table public.orders(id uuid primary key default gen_random_uuid(),reference text unique not null,user_id uuid not null references auth.users(id),demo boolean not null default true check(demo),status text not null default 'confirmed' check(status='confirmed'),currency text not null default 'NGN' check(currency='NGN'),subtotal_kobo bigint not null check(subtotal_kobo>=0),delivery_kobo bigint not null check(delivery_kobo=250000),total_kobo bigint not null check(total_kobo=subtotal_kobo+delivery_kobo),recipient_email text not null,delivery jsonb not null,idempotency_key uuid not null,request_fingerprint text not null,created_at timestamptz not null default now(),unique(user_id,idempotency_key));
create index orders_owner_time on public.orders(user_id,created_at);
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),variant_id uuid not null references public.product_variants(id),product_name text not null,variant_label text not null,price_kobo bigint not null check(price_kobo>=0),quantity int not null check(quantity between 1 and 10));
create index order_items_order on public.order_items(order_id);
create table luma_private.cart_handoffs(token_hash text primary key,source_user_id uuid not null references auth.users(id) on delete cascade,source_cart_id uuid not null references public.carts(id) on delete cascade,source_revision int not null,expires_at timestamptz not null,redeemed_by uuid references auth.users(id),redeemed_at timestamptz,result jsonb);
create index handoffs_source on luma_private.cart_handoffs(source_user_id);
create table luma_private.email_jobs(id uuid primary key default gen_random_uuid(),order_id uuid unique not null references public.orders(id),status text not null default 'pending' check(status in('pending','processing','accepted','retrying','failed')),attempts int not null default 0,next_attempt timestamptz not null default now(),lease_until timestamptz,lease_token uuid,message_id text,last_error text);
create index email_jobs_due on luma_private.email_jobs(next_attempt) where status in('pending','retrying','processing');
create table luma_private.request_limits(user_id uuid not null references auth.users(id) on delete cascade,action text not null,window_start timestamptz not null,counter int not null,primary key(user_id,action,window_start));
-- Explicit grants: browser has no cart/order/outbox writes.
do $$ declare t text; begin foreach t in array array['categories','products','product_variants','product_images','profiles','carts','cart_items','orders','order_items'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon,authenticated',t); execute format('grant select on public.%I to authenticated',t); execute format('grant select,insert,update,delete on public.%I to luma_server',t); execute format('create policy server_access on public.%I to luma_server using(true) with check(true)',t); end loop; end $$;
grant select on public.categories,public.products,public.product_variants,public.product_images to anon;
create policy catalog_read on public.categories for select to anon,authenticated using(true);
create policy product_read on public.products for select to anon,authenticated using(active);
create policy variant_read on public.product_variants for select to anon,authenticated using(active and exists(select 1 from public.products p where p.id=product_id and p.active));
create policy image_read on public.product_images for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.active));
create policy profile_read on public.profiles for select to authenticated using(user_id=(select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,true)=false);
grant update(display_name) on public.profiles to authenticated;
create policy profile_update on public.profiles for update to authenticated using(user_id=(select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,true)=false) with check(user_id=(select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,true)=false);
create policy cart_read on public.carts for select to authenticated using(user_id=(select auth.uid()));
create policy cart_item_read on public.cart_items for select to authenticated using(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=(select auth.uid())));
create policy order_read on public.orders for select to authenticated using(user_id=(select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,true)=false);
create policy order_item_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,true)=false));
alter table luma_private.cart_handoffs enable row level security;
alter table luma_private.email_jobs enable row level security;
alter table luma_private.request_limits enable row level security;
grant select,insert,update,delete on all tables in schema luma_private to luma_server;
create policy server_access on luma_private.cart_handoffs to luma_server using(true) with check(true);
create policy server_access on luma_private.email_jobs to luma_server using(true) with check(true);
create policy server_access on luma_private.request_limits to luma_server using(true) with check(true);
insert into storage.buckets(id,name,public) values('luma-catalog','luma-catalog',true) on conflict(id) do nothing;
create policy luma_catalog_assets on storage.objects for select to anon,authenticated using(bucket_id='luma-catalog');
-- No automatic remote cron setup: operator installs schedules only after secrets/site verified.
-- Runtime operations cannot edit the catalog or rewrite immutable orders.
revoke insert,update,delete on public.categories,public.products,public.product_variants,public.product_images from luma_server;
revoke update,delete on public.orders,public.order_items from luma_server;
-- PostgreSQL SELECT FOR SHARE needs UPDATE on at least one column; handlers only lock these.
grant update(active) on public.products to luma_server;
grant update(price_kobo) on public.product_variants to luma_server;
