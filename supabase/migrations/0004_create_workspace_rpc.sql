-- Creating a workspace and its first (owner) membership must be atomic, and
-- the plain insert policies can't express it: the creator isn't a member yet
-- when the workspace row is returned. One security-definer RPC does both.
-- (Already applied to the live project as 20260610122720_create_workspace_rpc.)

create function public.create_workspace(ws_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  insert into workspaces (name, created_by) values (ws_name, uid)
    returning id into new_id;
  insert into workspace_members (workspace_id, user_id, role)
    values (new_id, uid, 'owner');
  return new_id;
end;
$$;
