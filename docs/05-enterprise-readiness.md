# 05 — Enterprise Readiness

What it actually takes to sell to a Fortune 500, and when to do each piece. The
mistake to avoid is doing this too early (it's expensive and slows product work) or
too late (it blocks signed deals for 6+ months).

## Security & compliance ladder

| Requirement | What it is | When |
|---|---|---|
| Security basics | Encryption in transit + at rest, encrypted connector tokens, least-privilege access, dependency scanning | Phase 1, day one — cheap now, painful to retrofit |
| Permissions guarantee | Automated tests proving user A can never retrieve user B's restricted content | Phase 1, in CI |
| SSO (SAML/OIDC) + SCIM | Log in via the customer's identity provider; auto-provision/deprovision users | Phase 3 — first security questionnaire will demand it |
| Audit logs | Who searched, connected, exported, changed settings | Phase 3 |
| **SOC 2 Type II** | The audit report every US enterprise asks for first. Type II requires a 3–12 month observation window — start early. Use a compliance platform (Vanta/Drata) to automate evidence | Start Phase 3; report in hand Phase 4 |
| Pen test | Annual third-party penetration test report | Phase 4, before first F500 contract |
| DPA / GDPR / data residency | Data processing agreements; EU residency if selling in Europe | As deals require |
| ISO 27001, FedRAMP | International / US-government equivalents | Only when a specific deal demands |

## The AI-specific questions enterprises will ask

Have written answers ready (a "trust page" on the website):

1. *Is our data used to train models?* — **No.** API-based LLM usage with no training
   on customer data; contractual zero-retention options.
2. *What sees our data?* — Named subprocessor list (Supabase, Vercel, Anthropic,
   embedding provider) with their certifications.
3. *Can the AI leak one employee's restricted content to another?* — No: retrieval is
   permission-filtered **before** anything reaches the model; the model only ever sees
   what the asking user could open themselves.
4. *Can we control what's indexed?* — Yes: per-source, per-channel/space opt-in rules
   in the admin console.

## Go-to-market

**Motion: bottom-up land, top-down expand.**

1. **Land (Phases 2–3):** self-serve + design-partner pilots. Target design-forward
   mid-size companies and *single departments* inside large ones (departmental
   purchases often fly under procurement thresholds). Free pilot tier for one team.
2. **Prove:** the admin analytics dashboard *is* the sales deck — hours saved,
   queries/week, adoption curve. Collect quotable case studies from pilots.
3. **Expand (Phase 4):** departmental champion + usage data + SOC 2 report →
   company-wide contract. This is when "Fortune 500 customer" becomes real.

**Pricing (public and simple — itself a differentiator vs. Glean's opaque quotes):**
- **Free pilot** — one team, 2 connectors, 30 days
- **Business** — ~$20/user/month, all connectors, SSO
- **Enterprise** — custom: audit logs, SCIM, priority support, security review support

**Positioning line:** *"Everything Glean promises, at half the price, live in a day,
and designed like a product people actually want to open."*

## What we deliberately postpone

- Hiring sales before the product sells itself to pilots
- On-prem / private-cloud deployment (revisit only for a signed-contract-sized ask)
- Compliance certifications beyond SOC 2 until a named deal requires them
