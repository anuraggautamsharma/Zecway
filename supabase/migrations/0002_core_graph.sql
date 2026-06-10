-- Phase 1 foundation: workspaces, membership, connections, and the
-- markdown knowledge graph (documents + chunks with embeddings).

create extension if not exists vector;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- A configured connector instance (e.g. one Google Drive authorization)
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  source text not null check (source in ('google_drive', 'slack', 'upload', 'notion', 'email')),
  status text not null default 'pending' check (status in ('pending', 'syncing', 'ready', 'error', 'disconnected')),
  -- encrypted at the application layer before storage
  credentials text,
  sync_state jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Graph nodes: one row per source item, content normalized to markdown
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  connection_id uuid references public.connections (id) on delete set null,
  source text not null,
  source_id text,
  title text not null,
  markdown text not null,
  url text,
  author text,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  -- principals (user emails / group ids) allowed to see this item in the source
  permitted_principals text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, source, source_id)
);

-- Retrieval units: chunked markdown with embeddings
create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  idx int not null,
  content text not null,
  embedding vector(768),
  permitted_principals text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (document_id, idx)
);

create index chunks_embedding_idx on public.chunks
  using hnsw (embedding vector_cosine_ops);
create index documents_workspace_idx on public.documents (workspace_id);
create index chunks_workspace_idx on public.chunks (workspace_id);

-- Every question asked and answer given, for quality metrics
create table public.queries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid references auth.users (id),
  question text not null,
  answer text,
  citations jsonb not null default '[]',
  feedback text check (feedback in ('helpful', 'unhelpful')),
  created_at timestamptz not null default now()
);

-- Row-level security: workspace members only, on every table
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.connections enable row level security;
alter table public.documents enable row level security;
alter table public.chunks enable row level security;
alter table public.queries enable row level security;

create function public.is_workspace_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create policy "members read workspace" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "authenticated create workspace" on public.workspaces
  for insert to authenticated with check (created_by = auth.uid());

create policy "members read membership" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy "creator bootstraps membership" on public.workspace_members
  for insert to authenticated with check (
    user_id = auth.uid() and exists (
      select 1 from workspaces w
      where w.id = workspace_id and w.created_by = auth.uid()
    )
  );

create policy "members read connections" on public.connections
  for select using (public.is_workspace_member(workspace_id));
create policy "members read documents" on public.documents
  for select using (public.is_workspace_member(workspace_id));
create policy "members read chunks" on public.chunks
  for select using (public.is_workspace_member(workspace_id));
create policy "members read own queries" on public.queries
  for select using (public.is_workspace_member(workspace_id));
create policy "members ask" on public.queries
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

-- Writes to connections/documents/chunks happen via service role only
-- (ingestion pipeline), never from the browser.
