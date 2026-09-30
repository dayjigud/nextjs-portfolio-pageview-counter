-- OPERATOR SETUP EXAMPLE ONLY. Not a migration and not automatically deployed.
-- First enable pg_cron, pg_net and Vault through Supabase Integrations.
-- Store a random secret as luma_scheduler_secret in Vault, and copy that same
-- value to Edge Function secret LUMA_SCHEDULER_SECRET through provider UI.
-- Activate only after LUMA_DATABASE_URL and verified Mailgun sender are configured.
select cron.schedule('luma-email-worker','* * * * *', $job$
 select net.http_post(
   url := 'https://xiunfinvgxoquxiqnnyj.supabase.co/functions/v1/email-worker',
   headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='luma_scheduler_secret')),
   body := '{}'::jsonb,
   timeout_milliseconds := 10000
 );
$job$);
-- Guest cleanup intentionally omitted pending separate approval and tests.
