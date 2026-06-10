# 02 — Product Spec

## Personas

1. **The employee (primary user).** Needs the policy, the deck, the decision, the
   "who owns this?" — fifty times a week. Today they interrupt a colleague or give up.
   Zecway is their one search bar and assistant.
2. **The founder / ops lead (the buyer at our segment).** Feels the company's
   knowledge chaos personally. Signs up, connects the tools, invites the team, pays
   with a credit card. Wants value before the first invite, not after a rollout.
3. **The IT/security admin (the gate, as customers grow).** Approves what Zecway may
   ingest. Needs per-source controls, a visible "what Zecway can see" panel, audit
   trails, and certainty that permissions can't leak.

## Core product

### 1. Connectors → the markdown knowledge graph
- Connectors pull content **and access rules** from each source: Google Drive, Slack,
  Notion, email, and onward by customer demand. Direct upload (PDF, Word, markdown,
  text) for everything else.
- Everything converts to **markdown** — one uniform medium with structure, metadata,
  and provenance preserved. Every item carries its permissions from the source system.
- The graph is *living*: continuous re-sync, hard deletes propagated.

### 2. Search: everything, instantly
- One search bar over every connected source: ranked results combining keyword and
  semantic matching, filterable by source, author, date.
- Results show enough context to click confidently; clicking opens the original in
  its source tool.
- Only ever returns what the searcher could open in the source system.

### 3. Ask: answers with receipts
- Plain-language questions; answers grounded only in permitted graph content.
- **Every claim cites its source.** No citation, no claim. When the graph doesn't
  contain the answer, Zecway says so plainly.
- Follow-up questions keep context; answers link into search for going deeper.

### 4. Workspace & admin
- Teams: invite by email, roles (owner/admin/member), per-seat billing.
- The scope panel: exactly what's connected, what Zecway can see, per-source
  disconnect, hard-delete propagation.
- Usage view: are people actually finding things (the renewal argument, visible).

## The two non-negotiables

1. **Permissions.** A user only ever sees what they could open in the source system.
   Enforced at ingestion and again at query time, in the database itself.
2. **Citations.** The assistant may not assert what it cannot cite. This is the
   survival mechanism against hallucination, not a feature.

## Experience principles

1. **Fast like a reflex.** Search is used dozens of times a day; results must feel
   instant. Speed *is* the design.
2. **Consumer-grade calm.** One bar, obvious results, zero training required. The
   product should feel closer to Google than to enterprise software.
3. **Honest uncertainty.** "Your company hasn't written this down" is a feature.
   Trust compounds; bluffing kills.
4. **Value before the team arrives.** The buyer must hit a real answered question
   during onboarding, alone, before inviting anyone.

## Deliberately out of scope (for now)

- The platform layers above search — company entity graph, personal context,
  agents (Phase 5 of the roadmap: sequenced after search wins, not abandoned)
- Action-taking agents in external systems without human approval
- On-premise deployment; building our own LLM
- Real-time conversational voice
