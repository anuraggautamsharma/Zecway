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
      <p className="rounded-full border border-line bg-accent-soft px-6 py-3 text-sm text-snow">
        You&apos;re on the list — we&apos;ll be in touch when early access opens.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={`flex w-full gap-2 ${compact ? "max-w-md" : "max-w-lg"}`}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        className="min-w-0 flex-1 rounded-full border border-line bg-ink-soft px-5 py-3 text-sm text-snow placeholder:text-mist focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {status === "sending" ? "Joining…" : "Get early access"}
      </button>
      {status === "error" && (
        <p className="absolute mt-14 text-xs text-red-400">{message}</p>
      )}
    </form>
  );
}
