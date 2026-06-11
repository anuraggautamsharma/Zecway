"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { saveAgent } from "./actions";

type Citation = { n: number; title: string; url: string | null };
export type AgentDraft = {
  id?: string;
  name: string;
  description: string;
  emoji: string;
  inputLabel: string;
  inputPlaceholder: string;
  splitLines: boolean;
  searchHint: string;
  respondInstructions: string;
};

const EMPTY: AgentDraft = {
  name: "",
  description: "",
  emoji: "🤖",
  inputLabel: "Input",
  inputPlaceholder: "",
  splitLines: false,
  searchHint: "",
  respondInstructions: "",
};

type StepKey = "trigger" | "search" | "think" | "respond";

const STEPS: { key: StepKey; label: string; kind: string }[] = [
  { key: "trigger", label: "Trigger", kind: "Input form" },
  { key: "search", label: "Company search", kind: "Retrieval" },
  { key: "think", label: "Think", kind: "Reasoning" },
  { key: "respond", label: "Respond", kind: "Output" },
];

function stepSummary(key: StepKey, d: AgentDraft): string {
  switch (key) {
    case "trigger":
      return `Runs manually with “${d.inputLabel || "Input"}”${d.splitLines ? " · one item per line" : ""}`;
    case "search":
      return d.searchHint
        ? `Searches the graph, steered by “${d.searchHint}”`
        : "Searches the knowledge graph — permission-checked";
    case "think":
      return d.respondInstructions
        ? `Follows your instructions: “${d.respondInstructions.slice(0, 60)}${d.respondInstructions.length > 60 ? "…" : ""}”`
        : "Reasons over what it found (set instructions →)";
    case "respond":
      return "Produces a cited markdown document";
  }
}

export default function Builder({
  workspaceId,
  initial,
}: {
  workspaceId: string;
  initial?: AgentDraft;
}) {
  const [d, setD] = useState<AgentDraft>(initial ?? EMPTY);
  const [sel, setSel] = useState<StepKey>("trigger");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // preview run state
  const [pvInput, setPvInput] = useState("");
  const [pvBusy, setPvBusy] = useState(false);
  const [pvOutput, setPvOutput] = useState("");
  const [pvCitations, setPvCitations] = useState<Citation[]>([]);
  const [pvStatus, setPvStatus] = useState("");

  const set = (patch: Partial<AgentDraft>) => setD((x) => ({ ...x, ...patch }));
  const canSave = d.name.trim().length > 0 && d.respondInstructions.trim().length > 0;
  const canPreview = d.respondInstructions.trim().length > 0;

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    const fd = new FormData();
    fd.set("workspace_id", workspaceId);
    if (d.id) fd.set("agent_id", d.id);
    fd.set("name", d.name);
    fd.set("description", d.description);
    fd.set("emoji", d.emoji);
    fd.set("input_label", d.inputLabel);
    fd.set("input_placeholder", d.inputPlaceholder);
    if (d.splitLines) fd.set("split_lines", "on");
    fd.set("search_hint", d.searchHint);
    fd.set("respond_instructions", d.respondInstructions);
    try {
      await saveAgent(fd); // redirects on success
    } catch (e) {
      // Next redirect throws internally; real errors land here
      if ((e as Error)?.message?.includes("NEXT_REDIRECT")) throw e;
      setError("Could not save — check the required fields.");
      setSaving(false);
    }
  }

  async function preview(e: React.FormEvent) {
    e.preventDefault();
    if (pvBusy || !pvInput.trim() || !canPreview) return;
    setPvBusy(true);
    setPvOutput("");
    setPvCitations([]);
    setPvStatus("starting…");
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          preview: {
            name: d.name || "Untitled agent",
            split_lines: d.splitLines,
            search_hint: d.searchHint,
            respond_instructions: d.respondInstructions,
          },
          input: { text: pvInput },
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        setPvStatus(data.error ?? "Preview failed — try again.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let m: {
            type: string; title?: string; text?: string;
            citations?: Citation[]; error?: string;
          };
          try {
            m = JSON.parse(line);
          } catch {
            continue;
          }
          if (m.type === "step" && m.title) setPvStatus(m.title);
          else if (m.type === "delta" && m.text) {
            acc += m.text;
            setPvOutput(acc);
            setPvStatus("");
          } else if (m.type === "done") setPvCitations(m.citations ?? []);
          else if (m.type === "error" && m.error) setPvStatus(m.error);
        }
      }
    } catch {
      setPvStatus("Preview failed — try again.");
    } finally {
      setPvBusy(false);
    }
  }

  const panel = {
    trigger: (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Input label</label>
            <input
              value={d.inputLabel}
              onChange={(e) => set({ inputLabel: e.target.value })}
              maxLength={40}
              placeholder="Questions"
              className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Placeholder</label>
            <input
              value={d.inputPlaceholder}
              onChange={(e) => set({ inputPlaceholder: e.target.value })}
              maxLength={120}
              placeholder="Paste this week's questions…"
              className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
            />
          </div>
        </div>
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={d.splitLines}
            onChange={(e) => set({ splitLines: e.target.checked })}
            className="mt-0.5 accent-[#e8540a]"
          />
          <span>
            Treat each line as a separate item
            <span className="block text-xs text-mist">
              the agent searches and answers each line on its own (up to 10)
            </span>
          </span>
        </label>
        <p className="text-xs leading-relaxed text-mist">
          Schedules and automatic triggers (run when content changes) are on the
          roadmap — agents run manually for now.
        </p>
      </div>
    ),
    search: (
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink">
            Search hint <span className="font-normal text-mist">(optional)</span>
          </label>
          <input
            value={d.searchHint}
            onChange={(e) => set({ searchHint: e.target.value })}
            maxLength={120}
            placeholder="e.g. customer support policies"
            className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
          />
        </div>
        <p className="text-xs leading-relaxed text-mist">
          Added to every search this agent runs, steering retrieval toward the
          right corner of the graph. Searches are always permission-checked —
          the agent sees only what its runner can see.
        </p>
      </div>
    ),
    think: (
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink">
            Instructions — what should it do with the input? *
          </label>
          <textarea
            value={d.respondInstructions}
            onChange={(e) => set({ respondInstructions: e.target.value })}
            rows={5}
            maxLength={1200}
            placeholder="e.g. For each customer question, draft a short reply in our support tone, citing the policy it's based on."
            className="w-full rounded-xl border border-line bg-cream px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>
        <p className="text-xs leading-relaxed text-mist">
          The agent grounds everything in retrieved documents and cites every
          claim — your instructions shape tone, format and focus.
        </p>
      </div>
    ),
    respond: (
      <p className="text-xs leading-relaxed text-mist">
        The agent assembles a markdown document with numbered citations and
        keeps it in run history. Output destinations (Slack DM, email) arrive
        with connectors.
      </p>
    ),
  }[sel];

  return (
    <div>
      {/* header: identity */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={d.emoji}
          onChange={(e) => set({ emoji: e.target.value })}
          maxLength={4}
          aria-label="Icon"
          className="h-11 w-11 rounded-xl border border-line bg-cream text-center text-xl focus:border-accent/60 focus:outline-none"
        />
        <div className="min-w-0 flex-1">
          <input
            value={d.name}
            onChange={(e) => set({ name: e.target.value })}
            maxLength={60}
            placeholder="Name your agent…"
            className="w-full bg-transparent text-lg font-semibold text-ink placeholder:text-mist-soft focus:outline-none"
          />
          <input
            value={d.description}
            onChange={(e) => set({ description: e.target.value })}
            maxLength={140}
            placeholder="One line teammates will see on the card"
            className="mt-0.5 w-full bg-transparent text-sm text-mist placeholder:text-mist-soft focus:outline-none"
          />
        </div>
        <button
          onClick={save}
          disabled={!canSave || saving}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97] disabled:opacity-40"
        >
          {saving ? "Saving…" : d.id ? "Save changes" : "Save agent"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-7 grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* the flow: click a step to configure it */}
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.key} className="relative">
              {i < STEPS.length - 1 && (
                <span className="absolute left-[19px] top-12 h-[calc(100%-2rem)] w-px bg-line" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => setSel(s.key)}
                className={`relative z-10 mb-3 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                  sel === s.key
                    ? "border-accent/60 bg-paper shadow-[0_8px_20px_-12px_rgba(232,84,10,0.35)]"
                    : "border-line bg-paper hover:border-accent/30"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] ${
                    sel === s.key ? "bg-accent-soft text-accent-deep" : "border border-line text-mist"
                  }`}
                >
                  {i}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-accent">
                    {s.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-mist">
                    {stepSummary(s.key, d)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {/* right: config for the selected step + live preview */}
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-mist">
              configure · {STEPS.find((s) => s.key === sel)?.label}
            </h2>
            <div className="mt-4">{panel}</div>
          </section>

          <section className="rounded-2xl border border-dashed border-line p-5">
            <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-mist">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              preview — try it before saving
            </h2>
            <form onSubmit={preview} className="mt-3">
              <textarea
                value={pvInput}
                onChange={(e) => setPvInput(e.target.value)}
                rows={3}
                placeholder={d.inputPlaceholder || "Sample input…"}
                className="w-full rounded-xl border border-line bg-cream px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  disabled={pvBusy || !pvInput.trim() || !canPreview}
                  className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white transition active:scale-[0.97] disabled:opacity-40"
                >
                  {pvBusy ? "Running…" : "Preview run"}
                </button>
                {!canPreview && (
                  <span className="text-xs text-mist">set Think instructions first</span>
                )}
                {pvStatus && <span className="font-mono text-[11px] text-mist">{pvStatus}</span>}
              </div>
            </form>
            {pvOutput && (
              <div className="mt-4 border-t border-line pt-4">
                <div className="md-body text-sm leading-relaxed text-ink">
                  <Markdown>{pvOutput}</Markdown>
                </div>
                {pvCitations.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-line pt-2.5">
                    {pvCitations.map((c) => (
                      <li key={c.n} className="font-mono text-[11px] text-mist">
                        <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-deep">
                          {c.n}
                        </span>
                        {c.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
