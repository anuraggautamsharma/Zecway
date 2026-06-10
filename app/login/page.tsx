"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "confirm">("idle");
  const [error, setError] = useState(
    params.get("error") === "link"
      ? "That sign-in link is invalid or expired — please try again."
      : "",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("busy");
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setStatus("idle");
        return;
      }
      setStatus("confirm");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Wrong email or password."
          : error.message,
      );
      setStatus("idle");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  if (status === "confirm") {
    return (
      <div className="animate-pop rounded-2xl border border-accent/30 bg-accent-soft px-8 py-10 text-center">
        <p className="text-2xl">📬</p>
        <h2 className="mt-3 text-lg font-semibold text-ink">Check your email</h2>
        <p className="mt-2 text-sm text-mist">
          We sent a confirmation link to <strong>{email}</strong>. Click it and
          you&apos;ll land in your workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-pop w-full rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(23,21,19,0.04),0_16px_40px_-20px_rgba(23,21,19,0.15)]">
      <h1 className="text-xl font-semibold text-ink">
        {mode === "signin" ? "Sign in to Zecway" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-mist">
        {mode === "signin"
          ? "Your team's knowledge is waiting."
          : "Give your company one search bar."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-mist focus:border-accent/50 focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
          className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-mist focus:border-accent/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "busy"}
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
        >
          {status === "busy"
            ? "One moment…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <p className="mt-5 text-center text-xs text-mist">
        {mode === "signin" ? "New to Zecway? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
          className="font-semibold text-accent hover:text-accent-deep"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight text-ink">
        zecway<span className="text-accent">.</span>
      </Link>
      <div className="w-full max-w-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
