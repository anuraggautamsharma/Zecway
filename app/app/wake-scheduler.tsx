"use client";

import { useEffect } from "react";

// Fire-and-forget ping that runs the visitor's due scheduled agents.
// Throttled per tab so navigation doesn't spam the endpoint.
export default function WakeScheduler({ workspaceId }: { workspaceId: string }) {
  useEffect(() => {
    const KEY = "zw-wake-at";
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 30 * 60 * 1000) return;
    sessionStorage.setItem(KEY, String(Date.now()));
    fetch("/api/agents/wake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId }),
      keepalive: true,
    }).catch(() => {});
  }, [workspaceId]);
  return null;
}
