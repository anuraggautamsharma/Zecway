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

const STEPS: { key: StepKey; label: string }[] = [
  { key: "trigger", label: "Trigger" },
  { key: "search", label: "Company search" },
  { key: "think", label: "Think" },
  { key: "respond", label: "Respond" },
];

export function StepGlyph({ kind, active }: { kind: string; active?: boolean }) {
  const paths: Record<string, React.ReactNode> = {
    trigger: <path d="M13 2 3 14h7l-1 8 10-12h-7z" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    read: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
    think: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
      </>
    ),
    respond: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
  };
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        active ? "bg-accent-soft text-accent-deep" : "bg-cream text-mist"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[kind] ?? <circle cx="12" cy="12" r="8" />}
      </svg>
    </span>
  );
}

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
        ? `“${d.respondInstructions.slice(0, 70)}${d.respondInstructions.length > 70 ? "…" : ""}”`
        : "Reasons over what it found — set instructions";
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
  const [drawer, setDrawer] = useState<"step" | "preview" | null>("step");
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
      if ((e as Error)?.message?.includes("NEXT_REDIRECT")) throw e;
      setError("Could not save — check name and instructions.");
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

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink">{label}</label>
      {node}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-mist">{hint}</p>}
    </div>
  );

  const stepPanel = {
    trigger: (
      <div className="space-y-4">
        {field(
          "Input label",
          <input
            value={d.inputLabel}
            onChange={(e) => set({ inputLabel: e.target.value })}
            maxLength={40}
            placeholder="Questions"
            className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
          />,
        )}
        {field(
          "Placeholder",
          <input
            value={d.inputPlaceholder}
            onChange={(e) => set({ inputPlaceholder: e.target.value })}
            maxLength={120}
            placeholder="Paste this week's questions…"
            className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
          />,
        )}
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
          Schedules and content triggers are on the roadmap — agents run
          manually for now.
        </p>
      </div>
    ),
    search: (
      <div className="space-y-4">
        {field(
          "Search hint (optional)",
          <input
            value={d.searchHint}
            onChange={(e) => set({ searchHint: e.target.value })}
            maxLength={120}
            placeholder="e.g. customer support policies"
            className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
          />,
          "Added to every search this agent runs, steering retrieval toward the right corner of the graph. Searches are always permission-checked.",
        )}
      </div>
    ),
    think: (
      <div className="space-y-4">
        {field(
          "Instructions — what should it do with the input? *",
          <textarea
            value={d.respondInstructions}
            onChange={(e) => set({ respondInstructions: e.target.value })}
            rows={6}
            maxLength={1200}
            placeholder="e.g. For each customer question, draft a short reply in our support tone, citing the policy it's based on."
            className="w-full rounded-xl border border-line bg-cream px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />,
          "The agent grounds everything in retrieved documents and cites every claim — your instructions shape tone, format and focus.",
        )}
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
    <div className="flex h-[calc(100svh-3.5rem)] flex-col md:h-svh">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-paper px-4 py-2">
        <a
          href="/app/agents"
          aria-label="Back to agents"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-mist transition hover:bg-cream hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7M19 12H5" />
          </svg>
        </a>
        <input
          value={d.emoji}
          onChange={(e) => set({ emoji: e.target.value })}
          maxLength={4}
          aria-label="Icon"
          className="h-9 w-9 rounded-lg border border-line bg-cream text-center text-base focus:border-accent/60 focus:outline-none"
        />
        <div className="min-w-0 flex-1">
          <input
            value={d.name}
            onChange={(e) => set({ name: e.target.value })}
            maxLength={60}
            placeholder="Name your agent…"
            className="w-full bg-transparent text-[15px] font-semibold text-ink placeholder:text-mist-soft focus:outline-none"
          />
          <input
            value={d.description}
            onChange={(e) => set({ description: e.target.value })}
            maxLength={140}
            placeholder="One line teammates will see on the card"
            className="w-full bg-transparent text-xs text-mist placeholder:text-mist-soft focus:outline-none"
          />
        </div>
        {error && <span className="hidden text-xs text-red-500 sm:block">{error}</span>}
        <button
          type="button"
          onClick={() => setDrawer(drawer === "preview" ? null : "preview")}
          className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
            drawer === "preview"
              ? "border-accent/60 bg-accent-soft text-accent-deep"
              : "border-line text-ink hover:border-accent/40"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
          Preview
        </button>
        <button
          onClick={save}
          disabled={!canSave || saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97] disabled:opacity-40"
        >
          {saving ? "Saving…" : d.id ? "Save" : "Save agent"}
        </button>
      </div>

      {/* the viewport: dotted canvas with the flow floating on it */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="dot-grid h-full overflow-y-auto bg-cream/30">
          <div className="mx-auto w-[440px] max-w-full px-4 pb-16 pt-10">
            <span className="mb-3 inline-block rounded-md bg-accent-soft px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-deep">
              start
            </span>
            {STEPS.map((s, i) => (
              <div key={s.key}>
                <button
                  type="button"
                  onClick={() => {
                    setSel(s.key);
                    setDrawer("step");
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border bg-paper p-4 text-left shadow-sm transition ${
                    sel === s.key && drawer === "step"
                      ? "border-accent/60 shadow-[0_12px_28px_-14px_rgba(232,84,10,0.4)]"
                      : "border-line hover:border-accent/35"
                  }`}
                >
                  <StepGlyph kind={s.key} active={sel === s.key && drawer === "step"} />
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-mist">{i}.</span>
                      <span className="text-sm font-medium text-ink">{s.label}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-mist">
                      {stepSummary(s.key, d)}
                    </span>
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex flex-col items-center py-1.5 text-line" aria-hidden>
                    <span className="h-5 w-px bg-line" />
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* right drawer: step config or preview */}
        {drawer && (
          <div className="animate-pop absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-line bg-paper shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-mist">
                {drawer === "preview"
                  ? "preview — try it before saving"
                  : `configure · ${STEPS.find((s) => s.key === sel)?.label}`}
              </h2>
              <button
                type="button"
                onClick={() => setDrawer(null)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-mist transition hover:bg-cream hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {drawer === "step" ? (
                stepPanel
              ) : (
                <>
                  <form onSubmit={preview}>
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
                        {pvBusy ? "Running…" : "Run preview"}
                      </button>
                      {!canPreview && (
                        <span className="text-xs text-mist">set Think instructions first</span>
                      )}
                    </div>
                    {pvStatus && (
                      <p className="mt-2 font-mono text-[11px] text-mist">{pvStatus}</p>
                    )}
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
