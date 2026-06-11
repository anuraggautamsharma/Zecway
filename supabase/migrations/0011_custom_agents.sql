-- User-built agents. An agent is a saved recipe: how to treat the input,
-- how to search, and what to produce. The run engine executes the recipe
-- as the requesting user — same permission gate as everything else.

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  description text not null default '',
  emoji text not null default '🤖',
  input_label text not null default 'Input',
  input_placeholder text not null default '',
  split_lines boolean not null default false,
  search_hint text not null default '',
  respond_instructions text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agents enable row level security;

create policy "members read agents" on public.agents
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "members create agents" on public.agents
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "author or admin updates agents" on public.agents
  for update to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (created_by = auth.uid() or public.is_workspace_admin(workspace_id))
  );

create policy "author or admin deletes agents" on public.agents
  for delete to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (created_by = auth.uid() or public.is_workspace_admin(workspace_id))
  );

-- runs remember which agent produced them (null for built-ins)
alter table public.agent_runs
  add column agent_id uuid references public.agents (id) on delete set null,
  add column agent_name text;
