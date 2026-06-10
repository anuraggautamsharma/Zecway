# 04 — Roadmap

Sized for one founder (product/design) + Claude Code (engineering). Each phase ends
with something demoable; nothing is "infrastructure only". Timeboxes are estimates —
ship when the exit criteria are met, not when the calendar says.

## Phase 0 — Design foundation (1–2 weeks) ✦ founder-led
- Brand + design system in Figma: search, results, chat, admin screens.
- Clickable prototype used to pressure-test flows before code.
- **Exit:** prototype a stranger can use to "find an answer" without instruction.

## Phase 1 — Searchable core (4–6 weeks)
The smallest thing that is genuinely Zecway: real company data, permissions-aware
search, cited AI answers.

1. Workspace + auth: sign up, create a workspace, invite teammates (Supabase Auth).
2. **Google Drive connector**: OAuth, full + incremental sync of Docs/Sheets/Slides
   with their sharing rules.
3. Indexing pipeline: extract text → chunk → embed → store with permissions.
4. Search UI: instant combined keyword + semantic results, permission-filtered.
5. AI chat: RAG answers over permitted content with citations (Claude API).
6. Minimal admin: connect source, watch sync status.

**Exit criteria:** connect a real Google Workspace; two users with different Drive
access ask the same question and verifiably get different, correctly-permitted
answers, in under 2 seconds for search and streaming chat.

## Phase 2 — Multi-source + pilot-ready (6–8 weeks)
1. **Slack connector** (public channels), then **Notion**.
2. Unified ranking across sources; filters (source, author, date).
3. Feedback loop: thumbs up/down on answers; quality dashboard.
4. Admin console v1: usage analytics, user management.
5. Onboarding polish: signup → connected → first real answer in under 30 minutes,
   fully self-serve.
6. Run **3–5 design-partner pilots** (friendly teams; free in exchange for feedback).

**Exit criteria:** a pilot team uses Zecway weekly without hand-holding; ≥60% of AI
answers rated helpful; zero permission incidents.

## Phase 3 — Sellable product (8–12 weeks)
1. Remaining connector families: **Teams, Confluence, Jira, GitHub, Salesforce**
   (prioritize by what pilot customers actually ask for).
2. **SSO (SAML/OIDC via WorkOS)**, SCIM user provisioning — table stakes for any
   enterprise security review.
3. Audit logs, data-retention controls, admin permission policies.
4. Billing (Stripe), public pricing page, marketing site.
5. **Start SOC 2 Type II** (see [05](05-enterprise-readiness.md)) — the clock on the
   observation window starts here, so start early.
6. Slack bot + browser extension (distribution inside the customer's workflow).

**Exit criteria:** first paying customers; pass a mid-size company's security
questionnaire without custom work.

## Phase 4 — Enterprise scale (ongoing)
- Knowledge-graph ranking signals (people, activity, recency interactions).
- Agents/actions across apps with per-action user approval.
- SOC 2 Type II report in hand; pen test; ISO 27001 as deals demand.
- Re-platform search/indexing for hundred-million-document tenants; tenant isolation
  options for the largest contracts.
- First hires: a senior engineer (connectors/infra) and a founding GTM person —
  funded by Phase 3 revenue or a raise.

## Risks and honest mitigations

| Risk | Mitigation |
|---|---|
| Permission leak destroys trust | Two-layer enforcement (index + database row-level security); automated cross-user leak tests in CI from Phase 1 day one |
| Connector APIs are fiddly, rate-limited, ever-changing | One shared connector interface; ship one connector at a time, well, instead of many badly |
| Solo founder breadth | Managed services everywhere; Claude Code for engineering; scope discipline (the "Out of scope" list in the spec is load-bearing) |
| Incumbent competition | Don't fight on connector count; fight on experience, time-to-value, and price (see [01](01-vision-and-market.md)) |
| LLM cost at scale | Model tiering (cheap model for classification, premium for answers); per-workspace usage caps on free tier |
