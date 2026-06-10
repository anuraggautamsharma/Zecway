# 03 — Architecture

Written for a non-engineering reader first; implementation notes at the end. Guiding
constraint: **one founder + Claude Code**, so managed services over self-run
infrastructure at every decision point.

## How it works, in plain language

```
 Company tools            Zecway — AI workplace search             Every employee
┌──────────────┐   ┌──────────────────────────────────────┐   ┌──────────────────┐
│ Drive, Slack │   │ 1. CONNECTORS                        │   │ 4. THE APP       │
│ Email, Notion├──▶│    pull content + access rules       │   │  one search bar  │
│ Uploads      │   │ 2. MARKDOWN KNOWLEDGE GRAPH          │◀──┤  + the assistant │
│ (PDF, docs)  │   │    one uniform, living, permissioned │   └──────────────────┘
└──────────────┘   │    copy of everything                │
                   │ 3. ANSWER PIPELINE                   │
                   │    permission-filtered retrieval →   │
                   │    ranked results / cited answers    │
                   └──────────────────────────────────────┘
```

1. **Connectors** authorize into each tool (OAuth) and continuously copy two things:
   the *content* and the *access rules*. Webhooks + scheduled re-sync keep it fresh.
   Direct upload covers files outside any connected tool.
2. **The markdown knowledge graph** converts every format — PDF, Word, email, thread,
   page — into markdown documents with structure, metadata, provenance, and per-item
   permissions. Each document is chunked and embedded (meaning-fingerprints) for
   semantic retrieval alongside keyword search.
3. **The answer pipeline** serves both surfaces from the same permission-filtered
   retrieval: **search** returns ranked results; **ask** feeds the top results to an
   LLM that must answer only from them, citing every claim, or say the answer isn't
   in the graph.
4. **The app**: search, ask, browse what's in the graph, manage the team and the
   connected sources.

## The thing we must never get wrong: permissions

Two enforcement layers, so one bug can't leak data:

- **At ingestion**, every graph document stores its allowed users/groups from the
  source system.
- **At query time**, every read is filtered by the requester's identity, enforced in
  the database itself (Postgres row-level security + a permission-checking search
  function), not just app code.

Email raises the bar further: per-mailbox opt-in, admin-visible ingestion scope, and
hard-delete propagation.

## Technology choices

| Layer | Choice | Why |
|---|---|---|
| Web app | **Next.js on Vercel** | Already live (zecway.com); instant deploys |
| Graph store | **Supabase** (Postgres + pgvector) | Documents, embeddings, auth, and row-level security in one managed system |
| Markdown conversion | Per-format extractors (PDF via unpdf, DOCX via mammoth, text) feeding one pipeline | The uniform-medium bet; each format is an isolated module |
| LLM + embeddings | **Gemini free tier during development**, behind a one-file swappable interface (`lib/ai.ts`) | Zero cost while building; revisit model quality and rate limits before paid launch |
| Background jobs | Supabase Edge Functions + scheduled jobs → dedicated queue (Inngest/Trigger.dev) as connector volume grows | Syncs are long-running; need retries |
| Auth | Supabase Auth → SSO/SAML via WorkOS when deals require | Don't build SAML ourselves |

**Honest scaling note:** this serves our segment (10–500 person companies, up to
millions of documents) comfortably. Very large tenants will need dedicated search
infrastructure and stronger isolation — a problem revenue pays for; the data model is
designed to port cleanly.

## Data model (core tables)

- `workspaces` — one per customer; everything scoped by `workspace_id`
- `workspace_members` — seats and roles; the billing unit
- `connections` — configured connector instances (tokens encrypted, sync state)
- `documents` — graph nodes: markdown content, source, provenance, permissions
- `chunks` — retrieval units: text + embedding + `permitted_principals[]`
- `queries` — every search/ask, its answer and citations (quality metrics + usage view)

## Connector design

All connectors implement one interface — `full_sync()`, `incremental_sync(since)`,
`fetch_permissions(item)`, `handle_webhook(event)` — so each new source is
incremental work, not a rebuild. Connector quality (freshness, permission fidelity,
format conversion) is the product; each one ships with its own leak tests.
