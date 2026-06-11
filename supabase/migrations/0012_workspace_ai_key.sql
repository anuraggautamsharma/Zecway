-- Bring-your-own-key: a workspace can run on its own Gemini API key.
-- The key is stored AES-encrypted (the encryption secret lives only in the
-- server environment, never in the database). Admin-gated writes via
-- definer functions; members can read the row but only see ciphertext.

alter table public.workspaces
  add column ai_key_cipher text,
  add column ai_key_set_at timestamptz;

create function public.set_workspace_ai_key(ws uuid, cipher text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_admin(ws) then
    raise exception 'not authorized';
  end if;
  update workspaces
     set ai_key_cipher = cipher,
         ai_key_set_at = now()
   where id = ws;
end;
$$;

create function public.clear_workspace_ai_key(ws uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_admin(ws) then
    raise exception 'not authorized';
  end if;
  update workspaces
     set ai_key_cipher = null,
         ai_key_set_at = null
   where id = ws;
end;
$$;

grant execute on function public.set_workspace_ai_key(uuid, text) to authenticated;
grant execute on function public.clear_workspace_ai_key(uuid) to authenticated;
