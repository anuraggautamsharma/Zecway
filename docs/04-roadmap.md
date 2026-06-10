# 04 — Roadmap

Sized for one founder (product/design) + Claude Code (engineering). Every phase ends
demoable. Timeboxes are estimates — ship on exit criteria, not the calendar.

## Phase 0 — Presence ✅ done
Brand, launch landing page with waitlist, live on **zecway.com**, auto-deploy pipeline,
Supabase + Vercel + GitHub wired.

## Phase 1 — The graph (5–7 weeks)
The foundation everything else stands on: real company content, converted to one
markdown graph, with permissions, and cited answers over it.

1. Workspace + auth (Supabase Auth); invite the operator persona.
2. **Google Drive connector** (docs, PDFs, sheets) with sharing rules — then **Slack**.
3. Markdown conversion pipeline: per-format extractors → one normalizer → graph
   documents with provenance + permissions → chunks + embeddings.
4. **Ask**: plain-language questions answered only from permitted graph content, every
   claim cited (Claude API). Honest "the graph doesn't contain this" fallback.
5. Graph browser: see your company's knowledge as one legible, searchable corpus.
6. Permission leak tests in CI from day one — two users, different access, provably
   different answers.

**Exit:** connect a real workspace; ask a real question; get a cited answer in
seconds that respects permissions. The "wow" demo exists.

## Phase 2 — The map + first investigations (6–8 weeks)
1. Entity extraction: people, teams, tools, vendors from graph content (cartographer
   agent v1).
2. **Systems map UI** — the flagship visual: the company as a living network.
3. **Investigation v1 (single analyst agent):** decision-grade question → evidence
   assembly → structured brief with citations, confidence, and gaps. Trust-ladder
   stage 1–2.
4. Email + meeting-notes connectors with per-source/per-mailbox opt-in (the admin gate
   gets real controls here).
5. **2–3 design-partner pilots** — founders/execs we know, free, one real decision each.

**Exit:** a real executive acts on a Zecway brief and asks a second question.

## Phase 3 — Agent teams + sellable (8–12 weeks)
1. **Multi-agent investigations:** lead decomposes, specialists run in parallel,
   reviewer verifies claims against sources, lead synthesizes. Visible-while-running UI.
2. **Watchdogs v1** (trust-ladder stage 3): handoff-delay and duplicate-work signals,
   shipped only where the graph is rich enough to be right.
3. Remaining connectors by pilot demand (Teams, Notion, Confluence, Jira, Salesforce).
4. Enterprise table stakes: SSO/SAML (WorkOS), SCIM, audit logs, retention controls.
5. Billing + pricing page; **start SOC 2 Type II** (clock runs on the observation
   window — start early).

**Exit:** first paying customers; pass a mid-size security questionnaire unmodified.

## Phase 4 — Scale (ongoing)
- Company-wide expansion: everyday ask/search for all employees (the Glean surface,
  now trivial on top of the graph).
- Action-taking agents with per-action human approval.
- SOC 2 report in hand; pen test; per-tenant isolation for the largest contracts;
  re-platform search/graph for hundred-million-document tenants.
- First hires: senior engineer (connectors/infra), founding GTM.

## Risks and honest mitigations

| Risk | Mitigation |
|---|---|
| Permission leak destroys trust | Two-layer enforcement + cross-user leak tests in CI from Phase 1 day one; agents inherit requester permissions |
| Bad recommendation fires us like a bad consultant | Trust ladder: evidence assembly → investigations → proactive inference; citations mandatory; confidence + gaps stated |
| Multi-agent errors compound | Reviewer agents verify claims against sources before synthesis; no citation, no claim |
| Email/meeting-notes privacy backlash | Opt-in per source and mailbox, visible ingestion scope, hard-delete propagation |
| Markdown conversion quality (PDFs, sheets are messy) | Per-format extractors as isolated modules; quality metrics per format; humans can inspect the graph directly — legibility is the debugging tool |
| LLM cost per investigation | Model tiering; investigations are priced events (consulting reference price absorbs dollars of compute) |
| Solo-founder breadth | Managed services everywhere; one connector at a time, well; the out-of-scope list is load-bearing |
