-- Team invites. Works without an email service: the admin invites an email,
-- and whoever signs in with that email sees and accepts the invite in-app.
-- Emails for members/invites are exposed only through security-definer
-- functions that check membership.

create function public.is_workspace_admin(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (workspace_id, email)
);

alter table public.workspace_invites enable row level security;

create policy "admins manage invites" on public.workspace_invites
  for all to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

create policy "invitee reads own invites" on public.workspace_invites
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Accepting must atomically create the membership and mark the invite used;
-- the invitee can't insert into workspace_members directly.
create function public.accept_invite(invite_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  inv record;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  select * into inv from workspace_invites
    where id = invite_id and accepted_at is null
      and lower(email) = lower(auth.jwt() ->> 'email');
  if not found then
    raise exception 'invite not found';
  end if;
  insert into workspace_members (workspace_id, user_id, role)
    values (inv.workspace_id, uid, inv.role)
    on conflict do nothing;
  update workspace_invites set accepted_at = now() where id = invite_id;
  return inv.workspace_id;
end;
$$;

-- Pending invites for the signed-in user, with workspace names (the invitee
-- can't read the workspaces table until they're a member).
create function public.list_pending_invites()
returns table (id uuid, workspace_id uuid, workspace_name text, role text)
language sql stable security definer set search_path = public as $$
  select i.id, i.workspace_id, w.name, i.role
  from workspace_invites i
  join workspaces w on w.id = i.workspace_id
  where i.accepted_at is null
    and lower(i.email) = lower(auth.jwt() ->> 'email')
  order by i.created_at;
$$;

-- Member list with emails (auth.users is not client-readable), members only.
create function public.list_workspace_members(ws uuid)
returns table (user_id uuid, email text, role text, joined_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_workspace_member(ws) then
    raise exception 'not a member of this workspace';
  end if;
  return query
  select m.user_id, u.email::text, m.role, m.created_at
  from workspace_members m
  join auth.users u on u.id = m.user_id
  where m.workspace_id = ws
  order by m.created_at;
end;
$$;
