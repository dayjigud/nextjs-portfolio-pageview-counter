-- Pending explicit approval before deployment.
-- Internal maintenance needs auth-schema deletion; this bounded function is not exposed via REST.
create function luma_private.cleanup_guests() returns integer language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
  with candidates as (
    select u.id from auth.users u join public.carts c on c.user_id=u.id
    where u.is_anonymous=true and c.updated_at<now()-interval '30 days'
    and not exists(select 1 from luma_private.cart_handoffs h where h.source_user_id=u.id and h.expires_at>now() and h.redeemed_at is null)
    order by c.id for update of c,u skip locked limit 100
  ), deleted as (delete from auth.users where id in(select id from candidates) returning id)
  select count(*) into removed from deleted;
  return removed;
end $$;
revoke all on function luma_private.cleanup_guests() from public,anon,authenticated;
grant execute on function luma_private.cleanup_guests() to luma_server;
