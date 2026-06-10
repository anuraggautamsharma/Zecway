# 02 — Product Spec

## Personas

1. **The employee (daily user).** Anyone at the company with a question: "What's our
   parental leave policy?", "Who owns the Acme account?", "Is there a deck about the
   Q3 launch?" Wants one place to ask, instant trustworthy answers, zero training.
2. **The knowledge worker (power user).** PMs, sales, support, engineers. Uses Zecway
   to assemble context: summarize a thread, compare docs, draft from sources.
3. **The IT admin (buyer's operator).** Connects data sources, manages users and
   permissions, watches usage. Needs confidence nothing leaks and clear audit trails.
4. **The executive sponsor (economic buyer).** CIO/CTO. Cares about security posture,
   adoption metrics, and ROI ("hours saved per employee").

## Core product (Phases 1–2)

### 1. Universal search
- One search bar over all connected sources. Results unified, deduplicated, and ranked.
- **Permissions-aware, always:** a user only ever sees results they could open in the
  source app. This is non-negotiable and enforced at query time.
- Filters: source app, author, date, content type.
- Instant results as you type; full-text + semantic (meaning-based) matching combined.

### 2. AI assistant (chat)
- Ask in plain language; Zecway retrieves the most relevant permitted content and the
  LLM composes an answer **with citations** — every claim links to its source.
- Follow-up questions keep context ("…and who wrote that?").
- Honest fallback: when the answer isn't in company knowledge, say so clearly rather
  than guess. Trust is the product.

### 3. Connectors (initial five families)
| Connector | Content indexed | Permissions model synced |
|---|---|---|
| Google Workspace | Drive files, Docs/Sheets/Slides, (later Gmail, Calendar) | Drive ACLs, shared drives, domain sharing |
| Slack | Public channels first; private channels/DMs opt-in per workspace policy | Channel membership |
| Microsoft Teams | Channel messages, files | Team/channel membership |
| Notion & Confluence | Pages, databases/spaces | Page/space permissions |
| Jira, GitHub, Salesforce | Issues, PRs/READMEs, accounts/opportunities/notes | Project roles, repo access, sharing rules |

Build order within Phase 1: **Google Drive → Slack → Notion** (highest knowledge
density per engineering effort), then the rest.

### 4. Admin console
- Connect/disconnect sources, see sync status and indexed-document counts.
- User management (invite, deactivate), workspace settings.
- Usage analytics: queries/day, top questions, answer-helpfulness ratings — the
  adoption story the buyer shows their boss.

## Later product (Phase 3+)

- **Knowledge graph signals:** rank using people and activity (who you work with, what
  your team opens) — Glean's moat, approached incrementally.
- **Browser extension & Slack bot:** meet users where they already are.
- **Agents & actions:** "file this bug in Jira", "draft a follow-up to this thread" —
  with explicit user approval per action.
- **Verified answers:** admins bless canonical answers for common questions (policy
  questions, IT how-tos).

## Experience principles (the differentiator)

1. **Faster than asking a colleague.** Sub-second search; answers stream immediately.
2. **Never show what you can't open.** A single permissions leak destroys the company.
3. **Cite or be silent.** Every AI statement traceable to a source; no confident fiction.
4. **Zero-training UI.** If it needs onboarding docs, the design failed.
5. **Calm, premium feel.** Enterprise software that looks like it costs what it costs.

## Out of scope (deliberately)

- On-premise deployment (cloud-only until a Fortune 500 contract demands otherwise)
- Indexing email and DMs by default (privacy landmine; opt-in only, later)
- Building our own LLM (we use Claude via API; model choice can be configurable later)
