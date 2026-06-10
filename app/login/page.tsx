"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SearchDemo from "../search-demo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=/reset`,
      });
      if (error) {
        setError(error.message);
        setStatus("idle");
        return;
      }
      setStatus("confirm");
      return;
    }

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
          {mode === "forgot" ? (
            <>
              We sent a password-reset link to <strong>{email}</strong>. Click it
              to choose a new password.
            </>
          ) : (
            <>
              We sent a confirmation link to <strong>{email}</strong>. Click it and
              you&apos;ll land in your workspace.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-pop w-full">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {mode === "signin"
          ? "Sign in to Zecway"
          : mode === "signup"
            ? "Create your account"
            : "Reset your password"}
      </h1>
      <p className="mt-1.5 text-sm text-mist">
        {mode === "signin"
          ? "Your team's knowledge is waiting."
          : mode === "signup"
            ? "Give your company one search bar."
            : "We'll email you a link to set a new one."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>
        <div className={mode === "forgot" ? "hidden" : ""}>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required={mode !== "forgot"}
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "8+ characters" : "••••••••"}
              className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 pr-11 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
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
        </div>
        <button
          type="submit"
          disabled={status === "busy"}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97] disabled:opacity-60"
        >
          {status === "busy"
            ? "One moment…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
        </button>
      </form>

      {mode === "signin" && (
        <p className="mt-3 text-center">
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError("");
            }}
            className="text-xs text-mist transition hover:text-ink"
          >
            Forgot password?
          </button>
        </p>
      )}

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
    <main className="flex min-h-screen">
      {/* Left: the pitch + live product demo */}
      <aside className="hidden w-1/2 flex-col items-center justify-center bg-cream px-10 lg:flex xl:px-16">
        <div className="w-full max-w-xl">
          <h2 className="text-center font-display text-4xl leading-[1.1] text-ink">
            Answers from your company&apos;s own knowledge
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-body">
            One search bar across every tool your team uses — every answer cited,
            permissions always respected.
          </p>
          <div className="mt-10">
            <SearchDemo />
          </div>
        </div>
      </aside>

      {/* Right: the form */}
      <section className="flex min-h-screen flex-1 flex-col items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 block text-center text-2xl font-bold tracking-tight text-ink"
          >
            zecway<span className="text-accent">.</span>
          </Link>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
