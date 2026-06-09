# 03 — Architecture

Written for a non-engineering reader first; implementation notes for the build are at
the end. The guiding constraint: **one founder + Claude Code**, so we choose managed
services over self-run infrastructure at every decision point.

## How it works, in plain language

```
 Company tools                Outvo                          Employee
┌──────────────┐   ┌────────────────────────────┐   ┌─────────────────────┐
│ Google Drive │   │ 1. CONNECTORS              │   │ 4. SEARCH UI / CHAT │
│ Slack        ├──▶│    pull content + who-can- │   │    one search bar,  │
│ Notion       │   │    see-it rules, on a loop │   │    cited AI answers │
│ Jira, etc.   │   │ 2. INDEX                   │◀──┤                     │
└──────────────┘   │    store text + meaning    │   └─────────────────────┘
                   │    vectors + permissions   │
                   │ 3. RETRIEVAL + LLM (RAG)   │
                   │    find permitted, relevant│
                   │    content → Claude writes │
                   │    the answer w/ citations │
                   └────────────────────────────┘
```

1. **Connectors** log into each tool with the company's blessing (OAuth) and
   continuously copy two things: the *content* and the *access rules* (who can see
   each document). They re-sync on a schedule and via webhooks so the index stays fresh.
2. **The index** stores every document twice: as text (for keyword search) and as an
   *embedding* — a numerical fingerprint of its meaning (for "find things about X even
   if they don't contain the word X"). Each chunk carries its permission list.
3. **Answering** (RAG — retrieval-augmented generation): when someone asks a question,
   Outvo first finds the most relevant chunks *that this user is allowed to see*, then
   hands only those to the LLM, which writes an answer citing them. The LLM never
   answers from its own memory about the company.
4. **The app** is a fast web interface: search bar, results, chat, admin console.

## The one thing we must never get wrong: permissions

Permissions are enforced in **two layers**, so a bug in one cannot leak data:

- **At index time** every chunk stores its allowed users/groups, synced from the source.
- **At query time** every database query filters by the requesting user's identity —
  enforced *in the database itself* (Postgres row-level security), not just in app code.

If a document's sharing changes in Google Drive, the next sync updates it; deletes are
propagated as hard deletes from the index.

## Technology choices

| Layer | Choice | Why |
|---|---|---|
| Web app | **Next.js on Vercel** | Best-in-class DX, instant deploys, already in our toolchain |
| Database + vectors | **Supabase** (Postgres + pgvector) | One system for data, vector search, auth, and row-level security; no separate vector DB to operate |
| Keyword search | Postgres full-text search | Good enough until scale demands more (then: dedicated search engine) |
| Background sync jobs | Supabase Edge Functions + scheduled jobs (move to a queue service like Inngest/Trigger.dev as volume grows) | Connector syncs are long-running; needs retries and rate-limit handling |
| LLM | **Claude API** (Sonnet for chat, Haiku for cheap classification/summarization) | Quality + cost tiering; provider kept swappable behind one interface |
| Embeddings | Managed embedding API (e.g. Voyage) | No model hosting |
| Auth | Supabase Auth → SSO/SAML via WorkOS when enterprise deals require it | Don't build SAML ourselves |

**Honest scaling note:** this stack comfortably serves pilots and mid-size customers
(millions of documents). A true Fortune 500 full deployment (hundreds of millions of
documents, strict tenancy isolation) will eventually need dedicated search
infrastructure and per-tenant isolation — that re-platforming is a Phase 4 problem,
paid for by revenue, and the data model is designed so it ports cleanly.

## Data model (core tables)

- `workspaces` — one per customer company (all tables scoped by `workspace_id`)
- `users`, `groups`, `group_members` — identities, mirrored from source systems
- `connections` — a configured connector instance (tokens encrypted, sync state)
- `documents` — one row per source item (title, url, author, timestamps, source type)
- `chunks` — document pieces with text, embedding vector, and `permitted_principals[]`
- `queries`, `answers`, `feedback` — every search/chat interaction, for quality metrics

## Connector design

All connectors implement one interface so each new one is incremental work, not a
rewrite: `full_sync()`, `incremental_sync(since)`, `fetch_permissions(item)`,
`handle_webhook(event)`. Each runs as an isolated job with per-source rate limiting,
retries with backoff, and a sync-status record the admin console displays.
