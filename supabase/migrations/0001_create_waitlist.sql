create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  company text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Visitors may join the waitlist but never read it
create policy "anon can insert" on public.waitlist
  for insert to anon with check (true);
