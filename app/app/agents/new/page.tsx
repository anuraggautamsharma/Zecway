import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import Builder from "./builder";

export const metadata = { title: "Zecway — Create agent" };

export default async function NewAgentPage() {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");
  return <Builder workspaceId={workspace.id} />;
}
