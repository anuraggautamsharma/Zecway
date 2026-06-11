import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import Builder from "./builder";

export const metadata = { title: "Zecway — Create agent" };

export default async function NewAgentPage() {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 font-mono text-[11px] text-mist">
        <a href="/app/agents" className="hover:text-accent">agents</a>
        <span>/</span>
        <span className="text-ink">new</span>
      </div>
      <Builder workspaceId={workspace.id} />
    </div>
  );
}
