"use client";

import { useState } from "react";

export default function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong, please try again");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setMessage("Something went wrong, please try again");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="animate-pop rounded-lg border border-accent/25 bg-accent-soft px-5 py-3 text-sm font-medium text-accent-deep">
        You&apos;re on the list — we&apos;ll be in touch when early access opens.
      </p>
    );
  }

  return (
    <div className={`w-full ${compact ? "max-w-md" : "max-w-md"}`}>
      <form
        onSubmit={submit}
        className="flex gap-2 rounded-xl border border-line bg-paper p-1.5 transition focus-within:border-ink/30"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          className="min-w-0 flex-1 rounded-lg bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-mist focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep disabled:opacity-60"
        >
          {status === "sending" ? "Joining…" : "Get early access"}
        </button>
      </form>
      {status === "error" && <p className="mt-2 text-center text-xs text-red-500">{message}</p>}
    </div>
  );
}
