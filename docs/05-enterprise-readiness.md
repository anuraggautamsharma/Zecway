# 05 — Business & Trust Readiness

What it takes to sell AI workplace search at each stage — and when to do each piece.
Too early wastes scarce time; too late blocks signed deals for months.

## Security & compliance ladder

| Requirement | What it is | When |
|---|---|---|
| Security basics | Encryption in transit/at rest, encrypted connector tokens, least privilege, dependency scanning | Phase 1, day one |
| Permissions guarantee | CI tests proving user A can never read B's restricted content — per connector | Phase 1–2, in CI |
| Ingestion scope controls | Per-source / per-mailbox opt-in, visible "what Zecway can see" panel, hard-delete propagation | Phase 2 |
| SSO (SAML/OIDC) + SCIM | Customer's identity provider; auto provisioning | Phase 4 |
| Audit logs | Who searched, what was ingested, what was read | Phase 4 |
| **SOC 2 Type II** | The report every security review asks for first; needs a months-long observation window — start early, automate evidence (Vanta/Drata) | Start Phase 4 |
| Pen test, DPA/GDPR, ISO 27001 | As deals demand | As deals demand |

## The questions buyers will ask (trust page, written in advance)

1. *Is our data used to train models?* — **No.** API-based usage, no training on
   customer data, contractual zero-retention options.
2. *What can the AI see?* — Exactly what the asking user can see, nothing more.
   Permission filtering happens **before** anything reaches a model.
3. *Emails too?* — Only mailboxes you explicitly opt in, with a visible scope panel
   and instant revocation. The graph honors deletions.
4. *How do we know an answer is right?* — Every claim cites its source; click any
   claim, see the document. When it isn't written down, Zecway says so.
5. *Who else touches our data?* — Named subprocessors (Supabase, Vercel, AI provider)
   with their certifications.

## Pricing: per seat, public, self-serve

Deliberate contrast with Glean's quote-only enterprise pricing. Targets, to be tested:

- **Free** — small teams (e.g. up to 5 seats), limited sources and history. The
  product sells itself inside companies; free is the distribution.
- **Pro** — target **$10–15/seat/month**, self-serve by credit card: all connectors,
  unlimited search and asks, the scope panel.
- **Business** — target **$20–25/seat/month**: SSO/SCIM, audit logs, retention
  controls, priority support.
- **Annual discount** standard; pricing public on the website from day one.

The reference math a buyer does: one interrupted colleague costs more per week than a
seat costs per month.

## Go-to-market: product-led

**Land:** self-serve. A founder or ops lead signs up free, connects Drive, gets a real
answer in minutes, invites five colleagues. No demo calls, no procurement.

**Prove:** the activation metric is the pitch — time-to-first-answer under ten
minutes, weekly active searchers visible to the buyer in the usage view.

**Expand:** seats grow with the team; free workspaces convert when they hit limits;
Business tier captures the companies whose IT departments arrive asking about SSO.

**Channels (founder-shaped):** design-quality product pages and comparison content
("Glean for small teams"), founder build-in-public posts, communities where ops
people live. Paid acquisition only after free→paid conversion is proven.

**Positioning line:** *"Zecway — ask your company anything. One search bar across
every tool you use, with answers you can check."*

## What we deliberately postpone

- Hiring sales (product-led until upmarket pull is undeniable)
- On-prem / private cloud (revisit only for a signed-contract-sized ask)
- Certifications beyond SOC 2 until a named deal requires them
- Paid marketing until self-serve conversion is proven
