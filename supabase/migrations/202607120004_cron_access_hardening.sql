-- Mora Vinería v0.2 — pg_cron solo queda accesible para postgres.

revoke all on schema cron from public, anon, authenticated;
revoke all on all tables in schema cron from public, anon, authenticated;
revoke all on all sequences in schema cron from public, anon, authenticated;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
grant all privileges on all sequences in schema cron to postgres;
