-- Ingestion happens server-side under the logged-in user's own session (no
-- service key in the app), so members need write access to graph tables.
-- Retrieval goes through match_chunks, which enforces membership and
-- per-chunk permissions in the database.
-- (Already applied to the live project as 20260610122102_ingest_policies_and_match.)

create policy "members create connections" on public.connections
  for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "members update connections" on public.connections
  for update to authenticated using (public.is_workspace_member(workspace_id));

create policy "members write documents" on public.documents
  for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "members update documents" on public.documents
  for update to authenticated using (public.is_workspace_member(workspace_id));
create policy "members delete documents" on public.documents
  for delete to authenticated using (public.is_workspace_member(workspace_id));

create policy "members write chunks" on public.chunks
  for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "members delete chunks" on public.chunks
  for delete to authenticated using (public.is_workspace_member(workspace_id));

create policy "members update own queries" on public.queries
  for update to authenticated using (public.is_workspace_member(workspace_id));

-- Permission-filtered vector search. The '__workspace__' sentinel principal
-- marks content visible to every member; otherwise the chunk's principals
-- must intersect the asking user's principals (e.g. their email).
create function public.match_chunks(
  ws uuid,
  query_embedding vector(768),
  user_principals text[],
  match_count int default 8
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  title text,
  url text,
  similarity float
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_workspace_member(ws) then
    raise exception 'not a member of this workspace';
  end if;

  return query
  select c.id, c.document_id, c.content, d.title, d.url,
         1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  join documents d on d.id = c.document_id
  where c.workspace_id = ws
    and (
      c.permitted_principals @> array['__workspace__']
      or c.permitted_principals && user_principals
    )
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
