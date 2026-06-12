-- Scheduled triggers: agents can run unattended on a daily/weekly schedule.
-- `schedule` holds {freq: 'daily'|'weekly', day: 0-6}; `schedule_inputs`
-- holds the saved input values used for unattended runs; `last_scheduled_at`
-- gates the once-per-due-day claim. `triggered_by` records run provenance.

alter table public.agents
  add column schedule jsonb,
  add column schedule_inputs jsonb not null default '{}',
  add column last_scheduled_at timestamptz;

alter table public.agent_runs
  add column triggered_by text not null default 'manual';
