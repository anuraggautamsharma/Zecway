import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import Chat, { type ChatMessage } from "./chat";

export const metadata = { title: "Zecway — Assistant" };

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; ask?: string }>;
}) {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");

  const { c, ask } = await searchParams;
  const supabase = await createClient();

  const [{ data: sourceRows }, { data: recentDocs }] = await Promise.all([
    supabase.from("documents").select("source").eq("workspace_id", workspace.id),
    supabase
      .from("documents")
      .select("title")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  const sources = [...new Set((sourceRows ?? []).map((r) => r.source))].sort();
  const suggestions = (recentDocs ?? [])
    .map((d) => d.title)
    .filter(Boolean)
    .map((t) => {
      const short = t.length > 38 ? `${t.slice(0, 38)}…` : t;
      return `Summarize “${short}” for me`;
    });

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(25);

  let initialMessages: ChatMessage[] = [];
  if (c) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("role, content, citations")
      .eq("conversation_id", c)
      .order("created_at", { ascending: true });
    initialMessages = (msgs ?? []) as ChatMessage[];
  }

  return (
    <Chat
      workspaceId={workspace.id}
      conversations={convs ?? []}
      initialId={c ?? null}
      initialMessages={initialMessages}
      sources={sources}
      initialAsk={!c ? (ask ?? null) : null}
      suggestions={suggestions}
    />
  );
}
