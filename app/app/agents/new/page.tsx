import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { createAgent } from "./actions";

export const metadata = { title: "Zecway — Create agent" };

export default async function NewAgentPage() {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-ink">Create an agent</h1>
      <p className="mt-1 text-sm leading-relaxed text-mist">
        Describe the chore. The agent will search your workspace&apos;s
        knowledge, follow your instructions, and produce a cited document —
        running as whoever runs it, seeing only what they can see.
      </p>

      <form action={createAgent} className="mt-7 space-y-5">
        <input type="hidden" name="workspace_id" value={workspace.id} />

        <div className="flex gap-3">
          <div className="w-20">
            <label className="mb-1.5 block text-sm font-medium text-ink">Icon</label>
            <input
              name="emoji"
              maxLength={4}
              defaultValue="🤖"
              className="w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-center text-lg focus:border-accent/60 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">Name *</label>
            <input
              name="name"
              required
              maxLength={60}
              placeholder="Weekly policy digest"
              className="w-full rounded-lg border border-line bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
          <input
            name="description"
            maxLength={140}
            placeholder="What teammates see on the agent card"
            className="w-full rounded-lg border border-line bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            What should it do with the input? *
          </label>
          <textarea
            name="respond_instructions"
            required
            rows={4}
            maxLength={1200}
            placeholder="e.g. For each customer question, draft a short reply in our support tone, citing the policy it's based on."
            className="w-full rounded-xl border border-line bg-cream px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
          <p className="mt-1.5 text-xs text-mist">
            The agent always grounds its work in your workspace documents and
            cites every claim — these instructions shape what it produces.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
            input form
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink">Input label</label>
              <input
                name="input_label"
                maxLength={40}
                placeholder="Questions"
                className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink">Placeholder</label>
              <input
                name="input_placeholder"
                maxLength={120}
                placeholder="Paste this week's questions…"
                className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
              />
            </div>
          </div>
          <label className="mt-3 flex items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" name="split_lines" className="mt-0.5 accent-[#e8540a]" />
            <span>
              Treat each line as a separate item
              <span className="block text-xs text-mist">
                e.g. one question per line — the agent searches and answers each
                one (up to 10)
              </span>
            </span>
          </label>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Search hint <span className="font-normal text-mist">(optional)</span>
          </label>
          <input
            name="search_hint"
            maxLength={120}
            placeholder="e.g. customer support policies"
            className="w-full rounded-lg border border-line bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-mist">
            Added to every search the agent runs — steers retrieval toward the
            right corner of the graph.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97]">
            Create agent
          </button>
          <a href="/app/agents" className="text-sm text-mist hover:text-ink">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
