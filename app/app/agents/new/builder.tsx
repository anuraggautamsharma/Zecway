"use client";

import { useRef, useState } from "react";
import Markdown from "react-markdown";
import { saveAgent } from "./actions";
import {
  type FieldDef,
  type StepDef,
  STEP_META,
  fieldKey,
} from "@/lib/agent-def";

type Citation = { n: number; title: string; url: string | null };
export type DocOption = { id: string; title: string };
export type AgentDraft = {
  id?: string;
  name: string;
  description: string;
  emoji: string;
  splitLines: boolean;
  fields: FieldDef[];
  steps: StepDef[];
};

const EMPTY: AgentDraft = {
  name: "",
  description: "",
  emoji: "🤖",
  splitLines: false,
  fields: [{ key: "input", label: "Input", placeholder: "", long: true }],
  steps: [
    { kind: "search", query: "[[input]]" },
    { kind: "respond", instructions: "" },
  ],
};

export function StepGlyph({ kind, active }: { kind: string; active?: boolean }) {
  const paths: Record<string, React.ReactNode> = {
    trigger: <path d="M13 2 3 14h7l-1 8 10-12h-7z" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    web_search: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    read: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
    read_doc: (
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

function stepSummary(s: StepDef): string {
  switch (s.kind) {
    case "search":
      return s.query ? `Query: “${s.query.slice(0, 60)}${s.query.length > 60 ? "…" : ""}”` : "Set the search query";
    case "web_search":
      return s.query ? `Web: “${s.query.slice(0, 60)}${s.query.length > 60 ? "…" : ""}”` : "Set the web query";
    case "read_doc":
      return s.title ? `Reads “${s.title}”` : "Pick a document";
    case "think":
      return s.instructions
        ? `“${s.instructions.slice(0, 60)}${s.instructions.length > 60 ? "…" : ""}”`
        : "Set hidden reasoning instructions";
    case "respond":
      return s.instructions
        ? `“${s.instructions.slice(0, 60)}${s.instructions.length > 60 ? "…" : ""}”`
        : "Set what the final document should be";
  }
}

const CATALOG: StepDef["kind"][] = ["search", "web_search", "read_doc", "think", "respond"];

export default function Builder({
  workspaceId,
  documents,
  initial,
}: {
  workspaceId: string;
  documents: DocOption[];
  initial?: AgentDraft;
}) {
  const [d, setD] = useState<AgentDraft>(initial ?? EMPTY);
  const [sel, setSel] = useState<number>(-1); // -1 = trigger
  const [drawer, setDrawer] = useState<"step" | "catalog" | "preview" | null>("step");
  const [catalogAt, setCatalogAt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // preview state
  const [pvInputs, setPvInputs] = useState<Record<string, string>>({});
  const [pvBusy, setPvBusy] = useState(false);
  const [pvOutput, setPvOutput] = useState("");
  const [pvCitations, setPvCitations] = useState<Citation[]>([]);
  const [pvStatus, setPvStatus] = useState("");

  const set = (patch: Partial<AgentDraft>) => setD((x) => ({ ...x, ...patch }));
  const setStep = (i: number, patch: Partial<StepDef>) =>
    setD((x) => ({
      ...x,
      steps: x.steps.map((s, j) => (j === i ? ({ ...s, ...patch } as StepDef) : s)),
    }));

  const hasRespond = d.steps.some((s) => s.kind === "respond");
  const canSave = d.name.trim().length > 0 && hasRespond;
  const canPreview = hasRespond;

  // variables available to the step being configured
  const varsFor = (stepIndex: number) => [
    ...d.fields.map((f) => f.key),
    ...d.steps.slice(0, Math.max(stepIndex, 0)).map((_, i) => `step_${i + 1}`),
  ];
  const insertVar = (v: string) => {
    const el = areaRef.current;
    const tag = `[[${v}]]`;
    if (sel < 0) return;
    const s = d.steps[sel];
    const key = s.kind === "search" || s.kind === "web_search" ? "query" : "instructions";
    const cur = (s as Record<string, unknown>)[key] as string ?? "";
    if (el && document.activeElement === el) {
      const at = el.selectionStart ?? cur.length;
      setStep(sel, { [key]: cur.slice(0, at) + tag + cur.slice(at) } as Partial<StepDef>);
    } else {
      setStep(sel, { [key]: (cur ? cur + " " : "") + tag } as Partial<StepDef>);
    }
  };

  function addStep(kind: StepDef["kind"], at: number) {
    const blank: StepDef =
      kind === "search"
        ? { kind, query: d.fields[0] ? `[[${d.fields[0].key}]]` : "" }
        : kind === "web_search"
          ? { kind, query: "" }
          : kind === "read_doc"
            ? { kind, document_id: documents[0]?.id ?? "", title: documents[0]?.title }
            : { kind, instructions: "" };
    const steps = [...d.steps];
    steps.splice(at, 0, blank);
    set({ steps });
    setSel(at);
    setDrawer("step");
  }
  const removeStep = (i: number) => {
    set({ steps: d.steps.filter((_, j) => j !== i) });
    setSel(-1);
    setDrawer(null);
  };
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= d.steps.length) return;
    const steps = [...d.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    set({ steps });
    setSel(j);
  };

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    const fields = d.fields.map((f, i) => ({ ...f, key: f.key || fieldKey(f.label, i) }));
    const fd = new FormData();
    fd.set("workspace_id", workspaceId);
    if (d.id) fd.set("agent_id", d.id);
    fd.set("name", d.name);
    fd.set("description", d.description);
    fd.set("emoji", d.emoji);
    if (d.splitLines) fd.set("split_lines", "on");
    fd.set("fields", JSON.stringify(fields));
    fd.set("steps", JSON.stringify(d.steps));
    // legacy columns mirror the first field for older surfaces
    fd.set("input_label", fields[0]?.label ?? "Input");
    fd.set("input_placeholder", fields[0]?.placeholder ?? "");
    fd.set(
      "respond_instructions",
      (d.steps.find((s) => s.kind === "respond") as { instructions?: string })?.instructions ?? "-",
    );
    try {
      await saveAgent(fd);
    } catch (e) {
      if ((e as Error)?.message?.includes("NEXT_REDIRECT")) throw e;
      setError("Could not save — name and a Respond step are required.");
      setSaving(false);
    }
  }

  async function preview(e: React.FormEvent) {
    e.preventDefault();
    if (pvBusy || !canPreview) return;
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
            fields: d.fields,
            steps: d.steps,
          },
          input: { inputs: pvInputs },
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
          let m: { type: string; title?: string; text?: string; citations?: Citation[]; error?: string };
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

  const Chips = ({ at }: { at: number }) => (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-mist">insert:</span>
      {varsFor(at).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => insertVar(v)}
          className="rounded-full border border-line bg-cream px-2.5 py-1 font-mono text-[11px] text-accent-deep transition hover:border-accent/50"
        >
          [[{v}]]
        </button>
      ))}
    </div>
  );

  const inputCls =
    "w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none";

  // ── drawer body for the selected card ──
  let drawerTitle = "";
  let drawerBody: React.ReactNode = null;
  if (drawer === "step" && sel === -1) {
    drawerTitle = "configure · Trigger";
    drawerBody = (
      <div className="space-y-5">
        <p className="text-xs leading-relaxed text-mist">
          The input form people fill when they run this agent. Every field
          becomes a variable you can insert into any step.
        </p>
        {d.fields.map((f, i) => (
          <div key={i} className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
                field · [[{f.key || fieldKey(f.label, i)}]]
              </span>
              {d.fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => set({ fields: d.fields.filter((_, j) => j !== i) })}
                  className="text-xs text-mist hover:text-red-500"
                >
                  remove
                </button>
              )}
            </div>
            <input
              value={f.label}
              onChange={(e) => {
                const fields = [...d.fields];
                fields[i] = { ...f, label: e.target.value, key: fieldKey(e.target.value, i) };
                set({ fields });
              }}
              placeholder="Label"
              className={`mt-2 ${inputCls}`}
            />
            <input
              value={f.placeholder ?? ""}
              onChange={(e) => {
                const fields = [...d.fields];
                fields[i] = { ...f, placeholder: e.target.value };
                set({ fields });
              }}
              placeholder="Placeholder"
              className={`mt-2 ${inputCls}`}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={f.long ?? false}
                onChange={(e) => {
                  const fields = [...d.fields];
                  fields[i] = { ...f, long: e.target.checked };
                  set({ fields });
                }}
                className="accent-[#e8540a]"
              />
              Multi-line field
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set({
              fields: [
                ...d.fields,
                { key: `field_${d.fields.length + 1}`, label: "", placeholder: "" },
              ],
            })
          }
          className="w-full rounded-xl border border-dashed border-line px-3 py-2 text-xs text-mist transition hover:border-accent/50 hover:text-accent"
        >
          + Add field
        </button>
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={d.splitLines}
            onChange={(e) => set({ splitLines: e.target.checked })}
            className="mt-0.5 accent-[#e8540a]"
          />
          <span>
            Treat each line of the first field as a separate item
            <span className="block text-xs text-mist">
              searches referencing it run per line (up to 10)
            </span>
          </span>
        </label>
      </div>
    );
  } else if (drawer === "step" && sel >= 0 && d.steps[sel]) {
    const s = d.steps[sel];
    drawerTitle = `configure · ${STEP_META[s.kind].label}`;
    drawerBody = (
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-mist">{STEP_META[s.kind].blurb}.</p>
        {(s.kind === "search" || s.kind === "web_search") && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Query</label>
            <textarea
              ref={areaRef}
              value={s.query}
              onChange={(e) => setStep(sel, { query: e.target.value })}
              rows={3}
              placeholder={s.kind === "search" ? "what to look for in the graph…" : "what to look for on the web…"}
              className={inputCls}
            />
            <Chips at={sel} />
          </div>
        )}
        {s.kind === "read_doc" && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">Document</label>
            <select
              value={s.document_id}
              onChange={(e) => {
                const doc = documents.find((x) => x.id === e.target.value);
                setStep(sel, { document_id: e.target.value, title: doc?.title });
              }}
              className={inputCls}
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>
        )}
        {(s.kind === "think" || s.kind === "respond") && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink">
              Instructions {s.kind === "respond" && "*"}
            </label>
            <textarea
              ref={areaRef}
              value={s.instructions}
              onChange={(e) => setStep(sel, { instructions: e.target.value })}
              rows={6}
              placeholder={
                s.kind === "think"
                  ? "e.g. From [[step_1]], extract the three most important risks as a list."
                  : "e.g. Write a friendly summary answering [[question]], citing every claim."
              }
              className={`${inputCls} rounded-xl leading-relaxed`}
            />
            <Chips at={sel} />
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <button type="button" onClick={() => moveStep(sel, -1)} className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-mist hover:text-ink">↑ up</button>
          <button type="button" onClick={() => moveStep(sel, 1)} className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-mist hover:text-ink">↓ down</button>
          <button type="button" onClick={() => removeStep(sel)} className="ml-auto rounded-lg border border-line px-2.5 py-1.5 text-xs text-mist hover:border-red-300 hover:text-red-500">delete step</button>
        </div>
      </div>
    );
  } else if (drawer === "catalog") {
    drawerTitle = "select step";
    drawerBody = (
      <div className="space-y-2">
        <p className="text-xs leading-relaxed text-mist">Define what the agent does at this point.</p>
        {CATALOG.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => addStep(kind, catalogAt)}
            className="flex w-full items-start gap-3 rounded-xl border border-line p-3 text-left transition hover:border-accent/40"
          >
            <StepGlyph kind={kind} />
            <span>
              <span className="block text-sm font-medium text-ink">{STEP_META[kind].label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-mist">{STEP_META[kind].blurb}</span>
            </span>
          </button>
        ))}
      </div>
    );
  } else if (drawer === "preview") {
    drawerTitle = "preview — try it before saving";
    drawerBody = (
      <>
        <form onSubmit={preview} className="space-y-3">
          {d.fields.map((f, i) => (
            <div key={i}>
              <label className="mb-1 block text-xs font-medium text-ink">{f.label || `Field ${i + 1}`}</label>
              {f.long ? (
                <textarea
                  value={pvInputs[f.key] ?? ""}
                  onChange={(e) => setPvInputs({ ...pvInputs, [f.key]: e.target.value })}
                  rows={3}
                  placeholder={f.placeholder}
                  className={`${inputCls} rounded-xl leading-relaxed`}
                />
              ) : (
                <input
                  value={pvInputs[f.key] ?? ""}
                  onChange={(e) => setPvInputs({ ...pvInputs, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className={inputCls}
                />
              )}
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button
              disabled={pvBusy || !canPreview}
              className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white transition active:scale-[0.97] disabled:opacity-40"
            >
              {pvBusy ? "Running…" : "Run preview"}
            </button>
            {!canPreview && <span className="text-xs text-mist">add a Respond step first</span>}
          </div>
          {pvStatus && <p className="font-mono text-[11px] text-mist">{pvStatus}</p>}
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
                    <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-deep">{c.n}</span>
                    {c.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </>
    );
  }

  const AddConnector = ({ at }: { at: number }) => (
    <div className="flex flex-col items-center py-1 text-line" aria-hidden={false}>
      <span className="h-3 w-px bg-line" />
      <button
        type="button"
        onClick={() => {
          setCatalogAt(at);
          setDrawer("catalog");
        }}
        aria-label="Add step"
        className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-paper text-mist shadow-sm transition hover:border-accent/60 hover:text-accent"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <span className="h-3 w-px bg-line" />
    </div>
  );

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col md:h-svh">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-paper px-4 py-2">
        <a href="/app/agents" aria-label="Back to agents" className="flex h-9 w-9 items-center justify-center rounded-lg text-mist transition hover:bg-cream hover:text-ink">
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

      {/* viewport */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="dot-grid h-full overflow-y-auto bg-cream/30">
          <div className="mx-auto w-[460px] max-w-full px-4 pb-16 pt-10">
            <span className="mb-3 inline-block rounded-md bg-accent-soft px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-deep">
              start
            </span>

            {/* trigger card */}
            <button
              type="button"
              onClick={() => {
                setSel(-1);
                setDrawer("step");
              }}
              className={`flex w-full items-start gap-3 rounded-2xl border bg-paper p-4 text-left shadow-sm transition ${
                sel === -1 && drawer === "step"
                  ? "border-accent/60 shadow-[0_12px_28px_-14px_rgba(232,84,10,0.4)]"
                  : "border-line hover:border-accent/35"
              }`}
            >
              <StepGlyph kind="trigger" active={sel === -1 && drawer === "step"} />
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] text-mist">0.</span>
                  <span className="text-sm font-medium text-ink">Trigger</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-mist">
                  Runs manually with{" "}
                  {d.fields.map((f) => `“${f.label || "…"}”`).join(", ")}
                  {d.splitLines ? " · first field one item per line" : ""}
                </span>
              </span>
            </button>

            <AddConnector at={0} />

            {d.steps.map((s, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => {
                    setSel(i);
                    setDrawer("step");
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border bg-paper p-4 text-left shadow-sm transition ${
                    sel === i && drawer === "step"
                      ? "border-accent/60 shadow-[0_12px_28px_-14px_rgba(232,84,10,0.4)]"
                      : "border-line hover:border-accent/35"
                  }`}
                >
                  <StepGlyph kind={s.kind} active={sel === i && drawer === "step"} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-mist">{i + 1}.</span>
                      <span className="text-sm font-medium text-ink">{STEP_META[s.kind].label}</span>
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-mist/70">
                        [[step_{i + 1}]]
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-mist">
                      {stepSummary(s)}
                    </span>
                  </span>
                </button>
                <AddConnector at={i + 1} />
              </div>
            ))}

            {!hasRespond && (
              <p className="mt-1 rounded-xl border border-dashed border-line px-4 py-3 text-center text-xs text-mist">
                Add a <strong>Respond</strong> step — every agent ends by writing
                its answer.
              </p>
            )}
          </div>
        </div>

        {/* right drawer */}
        {drawer && (
          <div className="animate-pop absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-line bg-paper shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-mist">{drawerTitle}</h2>
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
            <div className="min-h-0 flex-1 overflow-y-auto p-5">{drawerBody}</div>
          </div>
        )}
      </div>
    </div>
  );
}
