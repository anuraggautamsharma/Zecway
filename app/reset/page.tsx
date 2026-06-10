"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "no-session">("checking");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setReady(user ? "ok" : "no-session"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("busy");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight text-ink">
        zecway<span className="text-accent">.</span>
      </Link>
      <div className="w-full max-w-sm">
        {ready === "no-session" ? (
          <div className="animate-pop rounded-2xl border border-line bg-paper p-8 text-center">
            <p className="text-sm text-mist">
              This reset link is invalid or expired.{" "}
              <Link href="/login" className="font-semibold text-accent">
                Request a new one
              </Link>
            </p>
          </div>
        ) : (
          <div className="animate-pop w-full rounded-2xl border border-line bg-paper p-8 shadow-[0_1px_2px_rgba(23,21,19,0.04),0_16px_40px_-20px_rgba(23,21,19,0.15)]">
            <h1 className="text-lg font-semibold tracking-tight text-ink">Set a new password</h1>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (8+ characters)"
                  className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-mist focus:border-accent/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-mist transition hover:text-ink"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={status === "busy" || ready === "checking"}
                className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97] disabled:opacity-60"
              >
                {status === "busy" ? "Saving…" : "Save new password"}
              </button>
            </form>
            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </main>
  );
}
