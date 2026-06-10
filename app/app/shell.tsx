"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";

const NAV = [
  {
    href: "/app",
    label: "Search",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    href: "/app/documents",
    label: "Library",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    href: "/app/team",
    label: "Team",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-card font-medium text-ink"
                : "text-mist hover:bg-paper/60 hover:text-ink"
            }`}
          >
            <span className={active ? "text-accent" : ""}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <span className="mt-1 flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-mist/60">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22v-5" />
          <path d="M9 8V2" />
          <path d="M15 8V2" />
          <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
        </svg>
        Connectors
        <span className="ml-auto rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
          soon
        </span>
      </span>
    </nav>
  );
}

function SidebarContent({
  workspaceName,
  email,
  onNavigate,
}: {
  workspaceName: string;
  email: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 px-3 pt-2">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <img src="/zecway-mark.svg" alt="" className="h-4 w-auto" />
          <span className="font-display text-lg leading-none">Zecway</span>
        </Link>
        <p className="mt-3 truncate text-sm font-semibold text-ink">{workspaceName}</p>
      </div>
      <Nav onNavigate={onNavigate} />
      <div className="mt-auto border-t border-line px-3 pt-4">
        <p className="truncate text-xs text-mist">{email}</p>
        <form action={signOut} className="mt-2">
          <button className="text-xs font-medium text-mist transition hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Shell({
  workspaceName,
  email,
  children,
}: {
  workspaceName: string;
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-cream md:block">
        <SidebarContent workspaceName={workspaceName} email={email} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-line bg-paper/80 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg border border-line p-2 text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-ink">{workspaceName}</span>
        <span className="w-9" />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="animate-pop absolute inset-y-0 left-0 w-64 border-r border-line bg-cream shadow-xl">
            <SidebarContent
              workspaceName={workspaceName}
              email={email}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="min-w-0 flex-1 pt-14 md:ml-60 md:pt-0">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-12">{children}</div>
      </main>
    </div>
  );
}
