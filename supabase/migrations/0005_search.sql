-- Instant keyword search over the graph, permission-filtered in the database
-- exactly like match_chunks (semantic). One result per document: the
-- best-matching chunk, with a [[...]]-highlighted snippet built by Postgres.

create index chunks_content_fts_idx on public.chunks
  using gin (to_tsvector('english', content));

create function public.search_chunks(
  ws uuid,
  search_query text,
  user_principals text[],
  match_count int default 20
)
returns table (
  document_id uuid,
  title text,
  url text,
  source text,
  snippet text,
  rank real
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_workspace_member(ws) then
    raise exception 'not a member of this workspace';
  end if;

  return query
  select hits.document_id, hits.title, hits.url, hits.source, hits.snippet, hits.rank
  from (
    select distinct on (d.id)
      d.id as document_id,
      d.title,
      d.url,
      d.source,
      ts_headline(
        'english', c.content,
        websearch_to_tsquery('english', search_query),
        'MaxWords=28, MinWords=12, StartSel=[[, StopSel=]]'
      ) as snippet,
      ts_rank(
        to_tsvector('english', c.content),
        websearch_to_tsquery('english', search_query)
      ) as rank
    from chunks c
    join documents d on d.id = c.document_id
    where c.workspace_id = ws
      and (
        c.permitted_principals @> array['__workspace__']
        or c.permitted_principals && user_principals
      )
      and to_tsvector('english', c.content)
          @@ websearch_to_tsquery('english', search_query)
    order by d.id, ts_rank(
      to_tsvector('english', c.content),
      websearch_to_tsquery('english', search_query)
    ) desc
  ) hits
  order by hits.rank desc
  limit match_count;
end;
$$;
