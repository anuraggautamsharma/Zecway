-- Daily AI allowance for workspaces on the shared trial key. Usage is
-- derived from what already gets recorded (searches, chat turns, agent
-- runs, ingested documents) — no separate metering to drift out of sync.

create function public.ai_actions_today(ws uuid)
returns int language plpgsql stable security definer set search_path = public as $$
declare
  n int;
begin
  if not public.is_workspace_member(ws) then
    raise exception 'not a member of this workspace';
  end if;
  select
    (select count(*) from queries
      where workspace_id = ws and created_at >= date_trunc('day', now()))
  + (select count(*) from messages m
      join conversations c on c.id = m.conversation_id
      where c.workspace_id = ws and m.role = 'assistant'
        and m.created_at >= date_trunc('day', now()))
  + (select count(*) from agent_runs
      where workspace_id = ws and created_at >= date_trunc('day', now()))
  + (select count(*) from documents
      where workspace_id = ws and created_at >= date_trunc('day', now()))
  into n;
  return n;
end;
$$;

grant execute on function public.ai_actions_today(uuid) to authenticated;
