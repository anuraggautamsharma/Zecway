-- Agents v1: template-driven step pipelines that run AS the requesting user.
-- A run and its steps are the receipts: every search, thought and output is
-- recorded, readable by the runner alone. Retrieval inside a run flows
-- through match_chunks, so an agent can never see more than its runner can.

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  agent_slug text not null,
  status text not null default 'running'
    check (status in ('running', 'done', 'failed')),
  input jsonb not null default '{}',
  output text,
  citations jsonb not null default '[]',
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index agent_runs_user_idx
  on public.agent_runs (user_id, workspace_id, created_at desc);

alter table public.agent_runs enable row level security;

create policy "own runs" on public.agent_runs
  for all to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(workspace_id))
  with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));

create table public.agent_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs (id) on delete cascade,
  idx int not null,
  kind text not null check (kind in ('trigger', 'search', 'read', 'think', 'respond')),
  title text not null,
  detail jsonb not null default '{}',
  status text not null default 'running'
    check (status in ('running', 'done', 'failed')),
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (run_id, idx)
);

alter table public.agent_run_steps enable row level security;

create policy "own run steps" on public.agent_run_steps
  for all to authenticated
  using (exists (
    select 1 from public.agent_runs r
    where r.id = run_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.agent_runs r
    where r.id = run_id and r.user_id = auth.uid()
  ));
