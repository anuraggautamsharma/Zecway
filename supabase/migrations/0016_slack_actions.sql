-- Outbound actions with human approval, plus the workspace Slack hook.
-- Agents draft an action (e.g. a Slack message); a teammate approves it
-- before anything leaves Zecway. The webhook is stored encrypted like the
-- workspace AI key; admin-gated writes via definer functions.

alter table public.workspaces
  add column slack_webhook_cipher text,
  add column slack_webhook_set_at timestamptz;

create function public.set_workspace_slack(ws uuid, cipher text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_admin(ws) then
    raise exception 'not authorized';
  end if;
  update workspaces
     set slack_webhook_cipher = cipher,
         slack_webhook_set_at = now()
   where id = ws;
end;
$$;

create function public.clear_workspace_slack(ws uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_admin(ws) then
    raise exception 'not authorized';
  end if;
  update workspaces
     set slack_webhook_cipher = null,
         slack_webhook_set_at = null
   where id = ws;
end;
$$;

grant execute on function public.set_workspace_slack(uuid, text) to authenticated;
grant execute on function public.clear_workspace_slack(uuid) to authenticated;

create table public.agent_run_actions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);

alter table public.agent_run_actions enable row level security;

create policy "member actions select" on public.agent_run_actions
  for select using (public.is_workspace_member(workspace_id));
create policy "member actions insert" on public.agent_run_actions
  for insert with check (public.is_workspace_member(workspace_id));
create policy "member actions update" on public.agent_run_actions
  for update using (public.is_workspace_member(workspace_id));
