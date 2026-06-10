# 04 — Roadmap

Sized for one founder (product/design) + Claude Code (engineering). Every phase ends
demoable. Timeboxes are estimates — ship on exit criteria, not the calendar.

## Phase 0 — Presence ✅ done
Brand, launch landing page with waitlist, live on **zecway.com**, auto-deploy pipeline,
Supabase + Vercel + GitHub wired.

## Phase 1 — The loop ✅ mostly done
Sign in → workspace → feed it documents → cited answers, permissions enforced in the
database.

1. ✅ Auth (email + password), session handling, protected app
2. ✅ Workspace creation
3. ✅ Upload: PDF, Word, markdown, text → markdown graph → chunks + embeddings
4. ✅ Ask: cited answers from permitted content only; honest "not in the graph"
   fallback; transient-AI-failure resilience
5. Remaining: **search results view** (today only Ask exists), graph browser
   (read documents in-app), team invites, password reset, transactional email
   (Resend), permission-leak tests in CI

**Exit:** a small team uses it daily on uploaded documents.

## Phase 2 — Connectors (4–6 weeks)
The product becomes real: the graph fills itself.

1. **Google Drive connector** — content + sharing rules, continuous re-sync. The
   single most important build of the company.
2. **Slack connector** — channels with membership-based permissions.
3. Onboarding tuned to the activation metric: signup → connected → first answered
   question in under 10 minutes, solo.
4. The scope panel: what's connected, what Zecway can see, disconnect + hard delete.

**Exit:** a real company connects Drive + Slack and employees find things without
asking each other.

## Phase 3 — Self-serve business (6–8 weeks)
1. Per-seat billing (Stripe), public pricing page, free tier.
2. Team management: roles, seat counts, usage view for the buyer.
3. Search quality pass: hybrid keyword + semantic ranking, filters, speed budget.
4. Surfaces where work happens: Slack bot (`/zecway who owns onboarding?`) and/or
   browser extension — by user demand.
5. Connectors by demand: Notion, Confluence, Gmail.

**Exit:** strangers sign up, connect, invite their team, and pay — without ever
talking to us.

## Phase 4 — Upmarket (ongoing)
- SSO/SAML (WorkOS), SCIM, audit logs, retention controls
- **SOC 2 Type II** — start the observation window early (Vanta/Drata)
- Big-company connectors: Teams, Jira, Salesforce
- Scale work: dedicated search infrastructure, tenant isolation for largest customers
- First hires: senior engineer (connectors/infra), founding GTM

## Phase 5 — The platform (the destination)
The climb from search to Work AI, in order, each layer on the one below:
1. **Company graph**: entity extraction — the people, teams, processes, and tools
   behind the documents, and how they relate
2. **Personal context**: per-user goals, tasks, and writing voice; answers and
   drafts become personal, not generic
3. **Assistant upgrades**: proactive intelligence, content creation grounded in
   company context
4. **Agents**: created in plain language, per-department library, every action
   permission-checked, human approval on anything that leaves the system
5. **Trust productized + APIs**: a named, visible protection surface; search/ask
   APIs so the graph is indexed once and used everywhere

## Risks and honest mitigations

| Risk | Mitigation |
|---|---|
| Glean/Copilot move down-market | Our segment is unprofitable for sales-led incumbents; win on self-serve speed, design, and transparent pricing — and stay faster |
| Permission leak destroys trust | Two-layer enforcement + cross-user leak tests in CI; every connector ships with its own leak tests |
| Hallucinated answers | Citations mandatory; answer only from retrieved content; honest "not written down" fallback |
| Connector quality (sync drift, messy formats) | One interface, one connector at a time, per-format quality metrics; the markdown graph is human-inspectable — legibility is the debugging tool |
| LLM cost per seat at scale | Model tiering behind the swappable AI layer; cache common queries; per-seat pricing covers marginal cost with wide margin |
| Free-tier AI limits bite during development | Swappable provider interface; move to paid keys before launch |
| Solo-founder breadth | Managed services everywhere; one connector at a time, well; the out-of-scope list is load-bearing |
