# 03 — Architecture

Written for a non-engineering reader first; implementation notes at the end. Guiding
constraint: **one founder + Claude Code**, so managed services over self-run
infrastructure at every decision point.

## How it works, in plain language

```
 Company tools            Zecway — the company brain                Executive
┌──────────────┐   ┌──────────────────────────────────────┐   ┌──────────────────┐
│ Drive, Slack │   │ 1. CONNECTORS                        │   │ 5. THE APP       │
│ Email, Teams ├──▶│    pull content + access rules       │   │  ask · map ·     │
│ Notion, Jira │   │ 2. MARKDOWN KNOWLEDGE GRAPH          │◀──┤  investigations  │
│ Sheets, CRM  │   │    one uniform, living, permissioned │   └──────────────────┘
└──────────────┘   │    copy of everything                │
                   │ 3. SYSTEMS MAP                       │
                   │    people · processes · tools, and   │
                   │    the connections between them      │
                   │ 4. AGENT RUNTIME (Claude)            │
                   │    librarians · cartographers ·      │
                   │    investigation teams · watchdogs   │
                   └──────────────────────────────────────┘
```

1. **Connectors** authorize into each tool (OAuth) and continuously copy two things:
   the *content* and the *access rules*. Webhooks + scheduled re-sync keep it fresh.
2. **The markdown knowledge graph** converts every format — PDF, email, thread,
   spreadsheet, transcript — into markdown documents with structure, metadata,
   provenance, and per-item permissions. One medium for humans *and* agents. Each
   document also gets embeddings (meaning-fingerprints) for semantic retrieval.
3. **The systems map** is a set of entities (people, teams, processes, tools, vendors)
   and edges (works-with, hands-off-to, depends-on) extracted from the graph by
   cartographer agents.
4. **The agent runtime** runs the workers: librarians (ingestion hygiene),
   cartographers (map upkeep), investigation teams (lead → specialists → reviewer →
   synthesis), and later watchdogs. Agents read only what the requesting user may see,
   write their findings back into the graph as documents, and must cite sources for
   every claim.
5. **The app**: ask a question, browse the map, watch an investigation run, read the
   brief.

## The thing we must never get wrong: permissions

Two enforcement layers, so one bug can't leak data:

- **At ingestion**, every graph document stores its allowed users/groups from the
  source system.
- **At query time**, every read — by a human *or an agent acting for them* — is
  filtered by the requester's identity, enforced in the database itself (Postgres
  row-level security), not just app code.

Email and meeting notes raise the bar further: per-source and per-mailbox opt-in,
admin-visible ingestion scope, and hard-delete propagation.

## Technology choices

| Layer | Choice | Why |
|---|---|---|
| Web app | **Next.js on Vercel** | Already live (zecway.com); instant deploys |
| Graph store | **Supabase** (Postgres + pgvector) | Documents, embeddings, entities/edges, auth, and row-level security in one managed system |
| Markdown conversion | Per-format extractors (PDF, email, chat, sheets) feeding one normalizer | The uniform-medium bet; each format is an isolated module |
| Agent runtime | **Claude API** — Sonnet for investigation/synthesis, Haiku for extraction and classification | Quality + cost tiering; provider swappable behind one interface |
| Background jobs | Supabase Edge Functions + scheduled jobs → dedicated queue (Inngest/Trigger.dev) as volume grows | Syncs and investigations are long-running; need retries |
| Embeddings | Managed embedding API | No model hosting |
| Auth | Supabase Auth → SSO/SAML via WorkOS when deals require | Don't build SAML ourselves |

**Honest scaling note:** this serves pilots and mid-size customers (millions of
documents) comfortably. Hundred-million-document Fortune 500 tenants will need
dedicated search/graph infrastructure and stronger tenant isolation — a problem revenue
pays for; the data model is designed to port cleanly.

## Data model (core tables)

- `workspaces` — one per customer; everything scoped by `workspace_id`
- `users`, `groups`, `group_members` — identities mirrored from source systems
- `connections` — configured connector instances (tokens encrypted, sync state)
- `documents` — graph nodes: markdown content, source, provenance, permissions
- `chunks` — retrieval units: text + embedding + `permitted_principals[]`
- `entities`, `edges` — the systems map (people/process/tool nodes and their relations)
- `investigations`, `agent_runs`, `findings` — every agent workstream, its sources,
  and its verified claims
- `feedback` — was the brief useful; did the exec act on it

## Connector & agent design

- All connectors implement one interface — `full_sync()`, `incremental_sync(since)`,
  `fetch_permissions(item)`, `handle_webhook(event)` — so each new source is
  incremental work.
- All agents implement one contract: declared inputs, read scope (the requesting
  user's permissions), required citations on every output claim, and a written
  artifact in the graph. Reviewer agents check claims before synthesis; failures send
  workstreams back, not forward.
