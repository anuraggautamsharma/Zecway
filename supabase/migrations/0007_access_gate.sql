-- Early-access gate. Sign-up is invite-only: an email gets in if the founder
-- granted it access, or if a workspace member invited it to their team.
-- Enforced by a trigger on auth.users so no client-side path can bypass it.

create table public.founders (
  email text primary key
);
alter table public.founders enable row level security;
-- no policies: reachable only through the security-definer functions below

insert into public.founders (email) values ('anuraggautamsharma@gmail.com');

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  note text,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
alter table public.access_grants enable row level security;

create function public.is_founder()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from founders where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- The gate itself, fired on every new auth user.
create function public.enforce_access_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from founders where lower(email) = lower(new.email))
     or exists (select 1 from access_grants where lower(email) = lower(new.email))
     or exists (select 1 from workspace_invites
                  where lower(email) = lower(new.email) and accepted_at is null) then
    update access_grants set used_at = now()
      where lower(email) = lower(new.email) and used_at is null;
    return new;
  end if;
  raise exception 'Zecway is invite-only right now';
end;
$$;

create trigger access_gate before insert on auth.users
  for each row execute function public.enforce_access_gate();

-- Friendly pre-check so the sign-up form can explain instead of erroring.
create function public.signup_allowed(check_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from founders where lower(email) = lower(check_email))
      or exists (select 1 from access_grants where lower(email) = lower(check_email))
      or exists (select 1 from workspace_invites
                   where lower(email) = lower(check_email) and accepted_at is null);
$$;

-- Founder console: the waitlist plus any directly-granted emails, with status.
create function public.admin_waitlist()
returns table (
  email text,
  company text,
  created_at timestamptz,
  granted_at timestamptz,
  joined boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_founder() then
    raise exception 'not authorized';
  end if;
  return query
    select * from (
      select w.email, w.company, w.created_at,
             g.created_at as granted_at,
             exists (select 1 from auth.users u
                       where lower(u.email) = lower(w.email)) as joined
        from waitlist w
        left join access_grants g on lower(g.email) = lower(w.email)
      union all
      select g.email, g.note, g.created_at, g.created_at,
             exists (select 1 from auth.users u
                       where lower(u.email) = lower(g.email))
        from access_grants g
       where not exists (select 1 from waitlist w
                           where lower(w.email) = lower(g.email))
    ) all_rows
    order by all_rows.created_at desc;
end;
$$;

create function public.admin_grant_access(grant_email text, grant_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_founder() then
    raise exception 'not authorized';
  end if;
  insert into access_grants (email, note)
    values (lower(trim(grant_email)), grant_note)
    on conflict (email) do nothing;
end;
$$;

create function public.admin_revoke_access(grant_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_founder() then
    raise exception 'not authorized';
  end if;
  -- only unused grants can be revoked; once an account exists this is moot
  delete from access_grants
    where lower(email) = lower(grant_email) and used_at is null;
end;
$$;

grant execute on function public.signup_allowed(text) to anon, authenticated;
grant execute on function public.is_founder() to authenticated;
grant execute on function public.admin_waitlist() to authenticated;
grant execute on function public.admin_grant_access(text, text) to authenticated;
grant execute on function public.admin_revoke_access(text) to authenticated;
