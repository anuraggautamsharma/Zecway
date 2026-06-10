-- Minimal stand-in for Supabase's auth schema so the real migrations can run
-- against a plain Postgres in CI. Mirrors the pieces our schema touches:
-- auth.users, auth.uid(), auth.jwt(), and the anon/authenticated roles.

create role anon nologin;
create role authenticated nologin;

create schema auth;

create table auth.users (
  id uuid primary key,
  email text unique
);

-- Supabase populates these from the request JWT; tests set the same GUC.
create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

create function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;

grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;
grant select on auth.users to authenticated;
