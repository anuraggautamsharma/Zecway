# 05 — Enterprise Readiness

What it takes to sell the company brain to serious companies — and when to do each
piece. Too early wastes scarce time; too late blocks signed deals for months.

## Security & compliance ladder

| Requirement | What it is | When |
|---|---|---|
| Security basics | Encryption in transit/at rest, encrypted connector tokens, least privilege, dependency scanning | Phase 1, day one |
| Permissions guarantee | CI tests proving user A (and agents acting for A) can never read B's restricted content | Phase 1, in CI |
| Ingestion scope controls | Per-source / per-mailbox opt-in, visible "what Zecway can see" panel, hard-delete propagation | Phase 2 (email raises the bar) |
| SSO (SAML/OIDC) + SCIM | Customer's identity provider; auto provisioning | Phase 3 |
| Audit logs | Who asked, what was ingested, which agents read what | Phase 3 |
| **SOC 2 Type II** | The report every security review asks for first; needs a months-long observation window — start early, automate evidence (Vanta/Drata) | Start Phase 3, report Phase 4 |
| Pen test, DPA/GDPR, ISO 27001 | As deals demand | Phase 4 |

## The questions executives will ask (trust page, written in advance)

1. *Is our data used to train models?* — **No.** API-based usage, no training on
   customer data, contractual zero-retention options.
2. *What can the agents see?* — Exactly what the asking user can see, nothing more.
   Permission filtering happens **before** anything reaches a model.
3. *Emails too?* — Only mailboxes you explicitly opt in, with a visible scope panel
   and instant revocation. The graph honors deletions.
4. *How do we know an answer is right?* — Every claim cites its source; reviewer
   agents verify before synthesis; confidence and gaps are stated. Click any claim,
   see the document.
5. *Who else touches our data?* — Named subprocessors (Supabase, Vercel, Anthropic,
   embedding provider) with their certifications.

## Pricing: against the analysis budget, not the software budget

Per-seat pricing is wrong for this product — value concentrates in a few users making
expensive decisions. Anchor against what we replace:

- **Pilot** — free or low flat fee, one connected workspace, one real decision
  investigation. Goal: the sponsor acts on a brief.
- **Company brain** — flat platform fee per company (size-banded, target $3–8K/month):
  full graph, systems map, standing agents, unlimited asks.
- **Investigations** — included allowance, then priced per deep multi-agent
  investigation. A $500 investigation against a $50,000 consulting week is the
  easiest line in the pitch.
- **Enterprise** — custom: SSO/SCIM, audit, isolation options, security review
  support.

Transparent and public, in deliberate contrast to both consulting opacity and Glean's
quote-only pricing.

## Go-to-market

**Land:** one executive sponsor, one real decision. The pilot *is* the sales motion —
"give us your vendor-renewal question; here's the brief." No platform pitch, no
IT-wide rollout ask.

**Prove:** the brief itself is the case study. Decisions supported, time-to-answer,
money saved vs. the consultant quote — quotable, concrete, per-customer.

**Expand:** sponsor's second question → other executives → standing agents always-on →
(Phase 4) company-wide ask/search for every employee. By then the graph is
load-bearing infrastructure and the renewal sells itself.

**Positioning line:** *"Zecway, the company brain — consultant-grade answers from your
own company's knowledge, in minutes, with receipts."*

## What we deliberately postpone

- Hiring sales before pilot briefs prove conversion
- On-prem / private cloud (revisit only for a signed-contract-sized ask)
- Certifications beyond SOC 2 until a named deal requires them
- Paid marketing until investigations demo end-to-end
