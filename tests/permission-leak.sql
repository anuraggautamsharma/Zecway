-- The promise under test: a user only ever sees what they are permitted to
-- see — across direct table reads, semantic retrieval (match_chunks), and
-- keyword search (search_chunks). Any failed assertion raises and fails CI.

-- Supabase grants these to app roles; the stub schema must too.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- ── Seed (as superuser) ────────────────────────────────────────────────────
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.co'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.co'),
  ('00000000-0000-0000-0000-00000000000c', 'outsider@test.co');

insert into public.workspaces (id, name, created_by) values
  ('00000000-0000-0000-0000-0000000000aa', 'Test Co', '00000000-0000-0000-0000-00000000000a');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-00000000000a', 'owner'),
  ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-00000000000b', 'member');

insert into public.documents (id, workspace_id, source, source_id, title, markdown, permitted_principals) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000aa',
   'upload', 'public.md',  'Public Doc', 'parental leave is 18 weeks', '{__workspace__}'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000aa',
   'upload', 'secret.md', 'Secret Doc', 'the secret acquisition target is MangoCorp', '{b@test.co}');

insert into public.chunks (workspace_id, document_id, idx, content, embedding, permitted_principals)
select '00000000-0000-0000-0000-0000000000aa', d.id, 0, d.markdown,
       (select ('[' || string_agg('0.1', ',') || ']')::vector(768) from generate_series(1, 768)),
       d.permitted_principals
from public.documents d;

-- ── Act as user A (member; NOT permitted on the secret chunk) ─────────────
set role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","email":"a@test.co"}', false);

do $$
declare
  secret_hits int;
  public_hits int;
begin
  -- semantic retrieval must exclude the restricted chunk
  select count(*) into secret_hits from public.match_chunks(
    '00000000-0000-0000-0000-0000000000aa',
    (select ('[' || string_agg('0.1', ',') || ']')::vector(768) from generate_series(1, 768)),
    array['a@test.co']) m where m.title = 'Secret Doc';
  if secret_hits > 0 then
    raise exception 'LEAK: match_chunks returned a restricted chunk to user A';
  end if;

  select count(*) into public_hits from public.match_chunks(
    '00000000-0000-0000-0000-0000000000aa',
    (select ('[' || string_agg('0.1', ',') || ']')::vector(768) from generate_series(1, 768)),
    array['a@test.co']) m where m.title = 'Public Doc';
  if public_hits = 0 then
    raise exception 'BROKEN: match_chunks hid workspace-visible content from a member';
  end if;

  -- keyword search must exclude the restricted chunk
  select count(*) into secret_hits from public.search_chunks(
    '00000000-0000-0000-0000-0000000000aa', 'MangoCorp', array['a@test.co']);
  if secret_hits > 0 then
    raise exception 'LEAK: search_chunks returned a restricted chunk to user A';
  end if;
end $$;

-- ── Act as user B (member; permitted on the secret chunk) ─────────────────
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000b","email":"b@test.co"}', false);

do $$
declare
  secret_hits int;
begin
  select count(*) into secret_hits from public.search_chunks(
    '00000000-0000-0000-0000-0000000000aa', 'MangoCorp', array['b@test.co']);
  if secret_hits = 0 then
    raise exception 'BROKEN: search_chunks hid permitted content from user B';
  end if;
end $$;

-- ── Act as an outsider (no membership at all) ─────────────────────────────
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000c","email":"outsider@test.co"}', false);

do $$
declare
  n int;
  rejected boolean := false;
begin
  -- direct table reads: RLS must return nothing
  select count(*) into n from public.documents;
  if n > 0 then
    raise exception 'LEAK: outsider can read documents via RLS';
  end if;
  select count(*) into n from public.chunks;
  if n > 0 then
    raise exception 'LEAK: outsider can read chunks via RLS';
  end if;
  select count(*) into n from public.workspace_members;
  if n > 0 then
    raise exception 'LEAK: outsider can read workspace membership';
  end if;

  -- retrieval functions must refuse non-members outright
  begin
    perform public.search_chunks(
      '00000000-0000-0000-0000-0000000000aa', 'parental', array['outsider@test.co']);
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'LEAK: search_chunks served a non-member';
  end if;
end $$;

reset role;
select 'permission-leak tests passed' as result;
