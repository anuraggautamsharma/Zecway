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
      <p className="animate-pop rounded-full border border-accent/30 bg-accent-soft px-6 py-3 text-sm font-medium text-accent-deep">
        🎉 You&apos;re on the list — we&apos;ll be in touch when early access opens.
      </p>
    );
  }

  return (
    <div className={`w-full ${compact ? "max-w-md" : "max-w-lg"}`}>
      <form
        onSubmit={submit}
        className="flex gap-2 rounded-full border border-line bg-white p-1.5 shadow-[0_10px_35px_-15px_rgba(240,89,10,0.4)] transition focus-within:border-accent/50"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-mist focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep hover:shadow-lg disabled:opacity-60"
        >
          {status === "sending" ? "Joining…" : "Get early access"}
        </button>
      </form>
      {status === "error" && <p className="mt-2 text-center text-xs text-red-500">{message}</p>}
    </div>
  );
}
