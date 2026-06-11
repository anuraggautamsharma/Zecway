-- Agents 2.0: the recipe becomes structured data. `fields` defines the
-- trigger's input form; `steps` is the ordered pipeline. Legacy agents
-- (empty steps) keep running through synthesized definitions.

alter table public.agents
  add column fields jsonb not null default '[]',
  add column steps jsonb not null default '[]';
