# 01 — Vision & Market

## Vision

Every company runs on knowledge that is scattered across dozens of apps. The average
enterprise uses 100+ SaaS tools; the answer to almost any question an employee has
already exists *somewhere* — in a doc, a Slack thread, a ticket, a CRM note — but
finding it is so painful that people ask colleagues, reinvent work, or give up.

**Outvo is the company brain.** Connect your tools once, and every employee gets:

1. **Search** across everything, ranked by relevance to *them*, showing only what
   they're permitted to see.
2. **Answers** — an AI assistant that responds to questions in plain language, with
   citations to the real source documents.
3. **Actions** (later) — agents that do work across apps: draft the doc, file the
   ticket, update the record.

## The market

- **Category:** Enterprise search / "Work AI". Glean calls it the Work AI platform;
  analysts group it under enterprise search and AI assistants.
- **Proof the market pays:** Glean is valued at ~$7.2B (2026), charges $50+/user/month,
  and its median customer pays ~$98,700/year. Microsoft sells Copilot at $30/user/month
  on top of M365 licenses.
- **Why now:** RAG (retrieval-augmented generation) is mature, LLM costs keep falling,
  and every Fortune 500 has an "AI mandate" with budget attached. The buying question
  has shifted from *"should we?"* to *"which one?"*

## Competitive landscape

| Competitor | Position | Weakness we exploit |
|---|---|---|
| **Glean** | Market leader, 100+ connectors, knowledge graph | Expensive ($50+/user/mo), opaque pricing, long enterprise deployment, utilitarian UX |
| **Microsoft Copilot** | Default for M365 shops, $30/user/mo | Only covers M365 data well; non-Microsoft sources need clunky Graph Connectors |
| **Onyx (ex-Danswer)** | Open-source, self-hostable, $20/user/mo cloud | Engineering-led product; weaker polish and admin experience |
| **GoSearch, Guru, Coveo, Elastic, Dust** | Various niches | Fragmented; none combine Glean-level depth with consumer-grade design |

## How Outvo wins

Being honest: we will not out-connector Glean (100+ connectors) or out-distribute
Microsoft on day one. We win on three axes where incumbents are weakest:

1. **Design-led experience.** Founder is a product designer. Every competitor's product
   feels like infrastructure with a UI bolted on. Search quality gets you in the
   evaluation; daily-use delight wins the renewal. Target: the first enterprise tool
   employees *choose* to open.
2. **Time-to-value in days, not months.** Self-serve onboarding: connect Google
   Workspace + Slack in 15 minutes, see your own real answers immediately. Glean
   deployments are sales-led and slow. Land in a single department, expand bottom-up.
3. **Transparent, undercutting price.** Public pricing at roughly half of Glean
   (target: $20–25/user/month, free pilot tier for one team). Under Glean's price
   umbrella there is enormous room.

## Wedge into the Fortune 500

"Fortune 500" is the destination, not the first customer. Big-company procurement
requires SOC 2, security review, and references — so the path is:

1. **Phase 1–2:** Win teams *inside* big companies (a 50-person department can often
   buy under a procurement threshold) and design-forward mid-size companies.
2. **Phase 3:** Convert departmental wins into company-wide contracts once compliance
   (SOC 2 Type II, SSO, audit logs) is in place. See [05 — Enterprise Readiness](05-enterprise-readiness.md).

## Success metrics

- **North star:** weekly queries per active user (are people *living* in it?)
- Answer quality: % of AI answers rated helpful, with a citation the user clicks
- Time-to-first-answer for a new workspace (target: < 30 minutes from signup)
- Logo expansion: department → company-wide conversions
