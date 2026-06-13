import type { AgentDraft } from "./builder";

// Starter recipes for the New Agent launchpad. Each is a complete draft the
// builder opens for editing — color shows the breadth of what's buildable.
export type Template = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  draft: AgentDraft;
};

const base = {
  schedule: null,
  scheduleInputs: {},
  webhookToken: null,
} as const;

export const TEMPLATES: Template[] = [
  {
    id: "rfp",
    name: "RFP answerer",
    emoji: "📋",
    blurb: "Paste questionnaire questions — get cited answers from your own docs.",
    draft: {
      ...base,
      name: "RFP answerer",
      description: "Answers questionnaire questions from company knowledge, with citations.",
      emoji: "📋",
      splitLines: true,
      fields: [
        {
          key: "questions",
          label: "Questions",
          placeholder: "What is your data retention policy?\nDo you support SSO?",
          long: true,
        },
      ],
      steps: [
        { kind: "search", query: "[[questions]]" },
        {
          kind: "respond",
          instructions:
            "Answer every question using only the sources. Format each question as a bold line with its answer below. Be direct and cite every claim.",
        },
      ],
    },
  },
  {
    id: "policy-gap",
    name: "Policy gap finder",
    emoji: "🔍",
    blurb: "Compares your policy on a topic against common market practice.",
    draft: {
      ...base,
      name: "Policy gap finder",
      description: "Compares our policy on a topic with how comparable companies handle it.",
      emoji: "🔍",
      splitLines: false,
      fields: [{ key: "topic", label: "Topic", placeholder: "parental leave", long: false }],
      steps: [
        { kind: "search", query: "our policy on [[topic]]" },
        { kind: "web_search", query: "typical [[topic]] policy at comparable startups" },
        {
          kind: "think",
          instructions:
            "Compare our policy in [[step_1]] with the market norms in [[step_2]]. List the key gaps in a short paragraph.",
        },
        {
          kind: "respond",
          instructions:
            "Write a short brief: state our policy on [[topic]] (cited), then where it falls short of market norms using [[step_3]]. Mark web-derived claims clearly.",
        },
      ],
    },
  },
  {
    id: "deep-research",
    name: "Deep researcher",
    emoji: "🔭",
    blurb: "Investigates any topic on its own, then writes a cited brief.",
    draft: {
      ...base,
      name: "Deep researcher",
      description: "Plans its own searches across company docs and the web, then writes a brief.",
      emoji: "🔭",
      splitLines: false,
      fields: [{ key: "topic", label: "Topic", placeholder: "our security posture", long: false }],
      steps: [
        {
          kind: "auto",
          goal: "Find everything relevant about [[topic]]: what our company documents say, and how it compares to what similar companies do.",
        },
        {
          kind: "respond",
          instructions:
            "Write a research brief on [[topic]] from the findings in [[step_1]]. Cite company sources; clearly mark web-derived facts.",
        },
      ],
    },
  },
  {
    id: "weekly-digest",
    name: "Weekly digest → Slack",
    emoji: "📨",
    blurb: "Every Monday, researches a topic and drafts a Slack post for approval.",
    draft: {
      name: "Weekly digest",
      description: "A scheduled, cited weekly pulse on a topic — drafted to Slack for approval.",
      emoji: "📨",
      splitLines: false,
      schedule: { freq: "weekly", day: 1 },
      scheduleInputs: { topic: "industry news relevant to us" },
      webhookToken: null,
      fields: [{ key: "topic", label: "Topic", placeholder: "industry news relevant to us", long: false }],
      steps: [
        {
          kind: "auto",
          goal: "Find the most important recent developments about [[topic]], from our docs and the web.",
        },
        {
          kind: "respond",
          instructions:
            "Write a tight weekly digest on [[topic]] from [[step_1]] — 3 to 5 bullets, each cited. Mark web-derived facts.",
        },
        { kind: "send_slack", message: "Weekly digest — [[topic]]:\n\n[[step_2]]" },
      ],
    },
  },
  {
    id: "onboarding",
    name: "Onboarding buddy",
    emoji: "👋",
    blurb: "Answers new-hire questions warmly from the company handbook.",
    draft: {
      ...base,
      name: "Onboarding buddy",
      description: "Answers new-hire questions from company knowledge, in a warm, helpful voice.",
      emoji: "👋",
      splitLines: false,
      fields: [
        { key: "question", label: "New-hire question", placeholder: "How do I request leave?", long: true },
      ],
      steps: [
        { kind: "search", query: "[[question]]" },
        {
          kind: "respond",
          instructions:
            "Answer [[question]] warmly and clearly, as a helpful colleague would, using only the sources. Cite every claim. If the answer isn't in the sources, say who to ask.",
        },
      ],
    },
  },
  {
    id: "meeting-prep",
    name: "Meeting prep",
    emoji: "🤝",
    blurb: "Pulls everything you need to walk into a meeting prepared.",
    draft: {
      ...base,
      name: "Meeting prep",
      description: "Gathers context for a meeting topic and lays out talking points.",
      emoji: "🤝",
      splitLines: false,
      fields: [{ key: "topic", label: "Meeting topic", placeholder: "renewal call with Acme", long: false }],
      steps: [
        { kind: "search", query: "[[topic]]" },
        {
          kind: "respond",
          instructions:
            "Prepare me for a meeting about [[topic]] using the sources: background, the 3 most relevant facts, likely questions, and suggested talking points. Cite everything.",
        },
      ],
    },
  },
];
