// Agents 2.0 definitions. An agent is fields (the trigger's input form)
// plus an ordered list of steps. Step outputs join the variable context as
// step_1, step_2, … and any string config may reference [[variables]].

export type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  long?: boolean;
};

export type StepDef =
  | { kind: "search"; query: string; top_k?: number }
  | { kind: "web_search"; query: string }
  | { kind: "read_doc"; document_id: string; title?: string }
  | { kind: "think"; instructions: string }
  | { kind: "respond"; instructions: string }
  | { kind: "branch"; condition: string; if_true: StepDef[]; if_false: StepDef[] }
  | { kind: "auto"; goal: string; max_actions?: number }
  | { kind: "send_slack"; message: string };

export type AgentDefV2 = {
  id: string | null;
  slug: string;
  name: string;
  splitLines: boolean;
  fields: FieldDef[];
  steps: StepDef[];
};

export const template = (s: string, ctx: Record<string, string>) =>
  s.replace(/\[\[([\w-]+)\]\]/g, (_, k: string) => ctx[k] ?? "");

export const fieldKey = (label: string, i: number) => {
  const k = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return k || `field_${i + 1}`;
};

// Legacy agents predate structured steps: synthesize the equivalent recipe.
export function synthesizeLegacy(a: {
  input_label: string;
  input_placeholder: string;
  split_lines: boolean;
  search_hint: string;
  respond_instructions: string;
}): { fields: FieldDef[]; steps: StepDef[] } {
  const key = fieldKey(a.input_label || "input", 0);
  return {
    fields: [
      {
        key,
        label: a.input_label || "Input",
        placeholder: a.input_placeholder,
        long: true,
      },
    ],
    steps: [
      {
        kind: "search",
        query: a.search_hint ? `${a.search_hint}\n[[${key}]]` : `[[${key}]]`,
      },
      { kind: "respond", instructions: a.respond_instructions },
    ],
  };
}

export const BUILTIN_RFP: AgentDefV2 = {
  id: null,
  slug: "rfp-answerer",
  name: "RFP answerer",
  splitLines: true,
  fields: [
    {
      key: "questions",
      label: "Questions",
      placeholder:
        "What is your data retention policy?\nDo you support SSO?\nWhere is customer data stored?",
      long: true,
    },
  ],
  steps: [
    { kind: "search", query: "[[questions]]" },
    {
      kind: "respond",
      instructions:
        "Answer every question using only the sources. Format as markdown: each question as a bold line, its answer below. Be direct and concise.",
    },
  ],
};

export const STEP_META: Record<
  StepDef["kind"],
  { label: string; blurb: string }
> = {
  search: {
    label: "Company search",
    blurb: "Searches the knowledge graph — permission-checked",
  },
  web_search: {
    label: "Web search",
    blurb: "Searches the public web with Google and summarizes",
  },
  read_doc: {
    label: "Read document",
    blurb: "Reads one specific document in full",
  },
  think: {
    label: "Think",
    blurb: "Hidden reasoning step — output feeds later steps",
  },
  respond: {
    label: "Respond",
    blurb: "Writes the final cited document for the user",
  },
  branch: {
    label: "Branch",
    blurb: "Decides which path to follow, with a fallback lane",
  },
  auto: {
    label: "Plan & execute",
    blurb: "Give it a goal — it picks its own searches, up to 6 actions",
  },
  send_slack: {
    label: "Post to Slack",
    blurb: "Drafts a message — a teammate approves before it's sent",
  },
};
