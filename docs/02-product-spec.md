# 02 — Product Spec

## Personas

1. **The executive sponsor (primary buyer & user).** CEO, COO, functional VP. Has
   decisions queued that each justify the product alone: restructure, vendor renewal,
   why-is-this-team-slow. Wants an evidence-backed brief in minutes, not a project.
2. **The chief of staff / ops lead (power operator).** Runs Zecway day to day: frames
   questions, reviews investigation briefs before they reach the exec, curates what
   gets connected.
3. **The IT/security admin (the gate).** Approves what Zecway may ingest. Needs
   per-source controls, audit trails, and certainty that permissions can't leak —
   especially with email and meeting notes in scope.
4. **Employees (later beneficiaries).** Once the graph exists, everyday search/ask for
   everyone is a natural expansion — but it is the expansion, not the wedge.

## Core product

### 1. Ingestion → the markdown knowledge graph
- Connectors pull every kind of content: documents, PDFs, emails, Slack/Teams messages,
  spreadsheets, meeting notes, tickets, CRM records.
- Everything is converted to **markdown** — one uniform medium, readable by humans and
  natively workable by agents. Tables, threads, and slides all become legible text with
  structure and metadata preserved.
- Every item carries its **permissions** from the source system, plus provenance
  (where it came from, when, who wrote it).
- The graph is *living*: continuous re-sync, hard deletes propagated.

### 2. The systems map
- Entities: people, teams, processes, tools, vendors, customers — extracted from the
  graph's content and activity.
- Edges: who works with whom, which process crosses which teams and tools, where
  handoffs occur. Built by **cartographer agents**, refreshed as the company changes.
- Rendered visually: the map is a flagship UI surface, not just internal plumbing.

### 3. Ask: answers with receipts
- Plain-language questions; answers grounded only in permitted graph content.
- **Every claim cites its source.** No citation, no claim. When the graph doesn't
  contain the answer, Zecway says so.

### 4. Investigations (the consulting engagement, compressed)
- For decision-grade questions, a **lead agent** decomposes the question into
  workstreams; **specialist agents** investigate each in parallel inside the graph;
  a **reviewer agent** verifies every claim against sources; the lead synthesizes a
  brief: recommendation, evidence, confidence, and what would change the answer.
- Output is a document in the graph — reusable, shareable, citable by later
  investigations.

### 5. Standing agents
- **Librarians** — keep ingestion clean, deduplicated, current.
- **Cartographers** — maintain the systems map.
- **Watchdogs** (trust-ladder stage 3) — surface anomalies proactively: a handoff
  slowing, duplicated work, a vendor drifting out of SLA.

## The two non-negotiables

1. **Permissions.** A user only ever sees — and an agent acting for a user only ever
   reads — what that user could open in the source system. Enforced at ingestion and
   again at query time, in the database itself.
2. **Citations.** Agents may not assert what they cannot cite. This is the survival
   mechanism against compounding multi-agent error, not a feature.

## Experience principles

1. **Boardroom-grade output.** Every brief should look like the best deck the best
   consultant ever delivered — because that's the comparison the buyer is making.
2. **Minutes, visibly.** Show the investigation working: workstreams spawning,
   sources being read, claims being verified. The theater is honest *and* persuasive.
3. **Honest uncertainty.** Confidence levels and gaps stated plainly. Trust compounds;
   bluffing kills.
4. **Read first, act later.** Analysis agents are read-only. Agents that take actions
   in external systems require explicit per-action human approval — and come later.

## Deliberately out of scope (for now)

- Action-taking agents without human approval gates
- Company-wide every-employee rollout as the initial motion (it's the expansion)
- On-premise deployment; building our own LLM
- Real-time conversational voice — text briefs first
