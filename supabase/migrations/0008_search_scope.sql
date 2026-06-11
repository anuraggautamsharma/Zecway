-- Scope filters for retrieval: both search paths accept an optional source
-- list and a created-after cutoff. Defaults keep existing 3-arg calls valid.
-- Keyword ranking gains a gentle recency boost: fresher documents win ties.

drop function public.search_chunks(uuid, text, text[], int);

create function public.search_chunks(
  ws uuid,
  search_query text,
  user_principals text[],
  match_count int default 20,
  src_filter text[] default null,
  after_ts timestamptz default null
)
returns table (
  document_id uuid,
  title text,
  url text,
  source text,
  snippet text,
  rank real,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_workspace_member(ws) then
    raise exception 'not a member of this workspace';
  end if;

  return query
  select hits.document_id, hits.title, hits.url, hits.source, hits.snippet,
         hits.boosted as rank, hits.created_at
  from (
    select distinct on (d.id)
      d.id as document_id,
      d.title,
      d.url,
      d.source,
      d.created_at,
      ts_headline(
        'english', c.content,
        websearch_to_tsquery('english', search_query),
        'MaxWords=28, MinWords=12, StartSel=[[, StopSel=]]'
      ) as snippet,
      (
        ts_rank(
          to_tsvector('english', c.content),
          websearch_to_tsquery('english', search_query)
        )
        * (1 + 0.15 / (1 + extract(epoch from (now() - d.created_at)) / (86400 * 30)))
      )::real as boosted
    from chunks c
    join documents d on d.id = c.document_id
    where c.workspace_id = ws
      and (
        c.permitted_principals @> array['__workspace__']
        or c.permitted_principals && user_principals
      )
      and (src_filter is null or d.source = any (src_filter))
      and (after_ts is null or d.created_at >= after_ts)
      and to_tsvector('english', c.content)
          @@ websearch_to_tsquery('english', search_query)
    order by d.id, ts_rank(
      to_tsvector('english', c.content),
      websearch_to_tsquery('english', search_query)
    ) desc
  ) hits
  order by hits.boosted desc
  limit match_count;
end;
$$;

drop function public.match_chunks(uuid, vector, text[], int);

create function public.match_chunks(
  ws uuid,
  query_embedding vector(768),
  user_principals text[],
  match_count int default 8,
  src_filter text[] default null,
  after_ts timestamptz default null
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
    and (src_filter is null or d.source = any (src_filter))
    and (after_ts is null or d.created_at >= after_ts)
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
