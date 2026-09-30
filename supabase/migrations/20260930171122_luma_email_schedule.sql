-- Requires matching LUMA_SCHEDULER_SECRET in Edge Functions and Vault.
-- No customer data or credentials are embedded in the stored cron command.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'luma-confirmation-email-worker',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://xiunfinvgxoquxiqnnyj.supabase.co/functions/v1/email-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || decrypted_secret
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    )
    from vault.decrypted_secrets
    where name = 'luma_scheduler_secret'
      and length(decrypted_secret) >= 64
    limit 1;
  $job$
);
