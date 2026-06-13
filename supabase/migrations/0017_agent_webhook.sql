-- Webhook triggers: an agent can be fired by an external POST to a secret
-- URL. The token is the secret (unguessable); null means no webhook.
alter table public.agents add column webhook_token text unique;
create index agents_webhook_token_idx on public.agents (webhook_token);
